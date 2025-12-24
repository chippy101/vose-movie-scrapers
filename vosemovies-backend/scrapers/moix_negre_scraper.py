#!/usr/bin/env python3
"""
Cines Moix Negre VOSE Movie Scraper
Scrapes VOSE movies from Cines Moix Negre (uses sacatuentrada.es platform)
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup
import json
from datetime import datetime, timedelta
from typing import List, Dict
import time
import os
import sys
import re

# Import comprehensive VOSE markers
try:
    from vose_markers import is_vose, VOSE_MARKERS
except ImportError:
    def is_vose(text):
        return 'vose' in text.lower() or 'vo ' in text.lower() or 'v.o.' in text.lower()
    VOSE_MARKERS = ['vose', 'vo', 'v.o.']

# Import stealth configuration
try:
    from stealth_config import StealthConfig, get_debug_mode
except ImportError:
    print("Warning: stealth_config.py not found, using basic configuration")
    StealthConfig = None
    get_debug_mode = lambda: False


class CinesMoixNegreScraper:
    """Selenium-based scraper for Cines Moix Negre VOSE movies"""

    def __init__(self, headless: bool = True):
        self.base_url = "https://cinesmoixnegre.sacatuentrada.es"
        self.today_url = f"{self.base_url}/es/hoy"
        self.headless = headless
        self.driver = None

    def init_driver(self):
        """Initialize Selenium WebDriver with stealth settings"""
        try:
            if StealthConfig:
                chrome_options, user_agent = StealthConfig.get_stealth_chrome_options(
                    headless=self.headless,
                    debug_mode=get_debug_mode()
                )
            else:
                chrome_options = Options()
                if self.headless:
                    chrome_options.add_argument('--headless=new')
                chrome_options.add_argument('--disable-blink-features=AutomationControlled')
                chrome_options.add_argument('--no-sandbox')
                chrome_options.add_argument('--disable-dev-shm-usage')
                chrome_options.add_argument('--disable-gpu')  # Required for Render
                chrome_options.add_argument('--remote-debugging-port=9222')  # Fix DevToolsActivePort error
                chrome_options.add_argument('--window-size=1920,1080')
                user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                chrome_options.add_argument(f'--user-agent={user_agent}')
                chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
                chrome_options.add_experimental_option('useAutomationExtension', False)

            self.driver = webdriver.Chrome(options=chrome_options)

            if StealthConfig:
                StealthConfig.apply_stealth_scripts(self.driver)
            else:
                self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": user_agent})

        except Exception as e:
            print(f"Error initializing Chrome driver: {e}")
            sys.exit(1)

    def scrape(self) -> List[Dict]:
        """Main scraping method"""
        print(f"Scraping Cines Moix Negre from {self.today_url}")

        try:
            self.init_driver()
            all_movies = []

            # Load the page
            print("Loading page...")
            self.driver.get(self.today_url)
            time.sleep(3)

            # Handle cookie consent if present
            try:
                cookie_button = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Aceptar')]"))
                )
                cookie_button.click()
                print("✓ Cookie consent accepted")
                time.sleep(1)
            except TimeoutException:
                print("No cookie banner found")

            # Get page source and parse
            html = self.driver.page_source
            movies = self.parse_movies(html)

            print(f"Found {len(movies)} VOSE movies")
            return movies

        finally:
            if self.driver:
                self.driver.quit()

    def parse_movies(self, html: str) -> List[Dict]:
        """Parse HTML to extract VOSE movies"""
        soup = BeautifulSoup(html, 'html.parser')
        movies = []

        # sacatuentrada.es typically uses specific classes for movie listings
        # Common patterns: movie cards, film items, session containers
        movie_containers = (
            soup.find_all('div', class_=re.compile(r'movie|film|session|pelicula', re.I)) or
            soup.find_all('article', class_=re.compile(r'movie|film|session|pelicula', re.I)) or
            soup.find_all('div', {'data-movie': True}) or
            soup.find_all('div', {'data-film': True})
        )

        print(f"Found {len(movie_containers)} potential movie containers")

        for container in movie_containers:
            # Check if it's VOSE
            container_text = container.get_text()
            if not is_vose(container_text):
                continue

            movie_data = self._extract_movie_data(container)
            if movie_data:
                movies.append(movie_data)

        return movies

    def _extract_movie_data(self, container) -> Dict:
        """Extract movie details from container"""
        try:
            # Title - look for common title patterns
            title_elem = (
                container.find('h2') or
                container.find('h3') or
                container.find(class_=re.compile(r'title|titulo|name', re.I)) or
                container.find('a', class_=re.compile(r'movie|film', re.I))
            )
            title = title_elem.get_text(strip=True) if title_elem else None

            if not title:
                return None

            # Link
            link_elem = container.find('a', href=True)
            link = link_elem['href'] if link_elem else None
            if link and not link.startswith('http'):
                link = f"{self.base_url}{link}"

            # Extract showtimes
            showtimes = []
            time_elements = (
                container.find_all(class_=re.compile(r'time|hora|session', re.I)) or
                container.find_all('time') or
                container.find_all('span', string=re.compile(r'\d{1,2}:\d{2}'))
            )

            today_date = datetime.now().strftime('%Y-%m-%d')
            for elem in time_elements:
                time_text = elem.get_text(strip=True)
                # Extract time pattern like "19:30"
                time_match = re.search(r'(\d{1,2}:\d{2})', time_text)
                if time_match:
                    showtimes.append({
                        'date': today_date,
                        'time': time_match.group(1)
                    })

            if not showtimes:
                # Fallback: search entire container text for time patterns
                times = re.findall(r'\b(\d{1,2}:\d{2})\b', container.get_text())
                for t in times:
                    showtimes.append({
                        'date': today_date,
                        'time': t
                    })

            # Skip if no showtimes found
            if not showtimes:
                return None

            return {
                'title': title,
                'link': link,
                'showtimes': showtimes,
                'cinema': 'Cines Moix Negre',
                'location': 'Unknown',  # Update if you know the location
                'island': 'Mallorca',
                'version': 'VOSE',
                'raw_text': container.get_text(' ', strip=True),
                'scraped_at': datetime.now().isoformat()
            }

        except Exception as e:
            print(f"Error extracting movie data: {e}")
            return None


def main():
    """Run the scraper"""
    scraper = CinesMoixNegreScraper(headless=True)
    movies = scraper.scrape()

    if movies:
        output_file = f"moix_negre_vose_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(movies, f, ensure_ascii=False, indent=2)
        print(f"\n✓ Saved {len(movies)} movies to {output_file}")
    else:
        print("\n✗ No VOSE movies found")


if __name__ == "__main__":
    main()
