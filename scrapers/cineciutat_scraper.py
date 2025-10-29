#!/usr/bin/env python3
"""
CineCiutat VOSE Movie Scraper with Selenium
Scrapes VOSE (Original Version with Spanish Subtitles) movies from CineCiutat Palma
Works around anti-bot protection by using real browser automation
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException
from bs4 import BeautifulSoup
import json
from datetime import datetime
from typing import List, Dict
import time
import os
import sys

class CineCiutatScraper:
    """Selenium-based scraper for CineCiutat VOSE movies"""

    def __init__(self, headless: bool = True):
        self.base_url = "https://cineciutat.org"
        self.movies_url = f"{self.base_url}/en/movies"
        self.headless = headless
        self.driver = None

    def init_driver(self):
        """Initialize Selenium WebDriver with anti-detection settings"""
        chrome_options = Options()

        if self.headless:
            chrome_options.add_argument('--headless=new')

        # Anti-detection settings
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        # Disable automation flags
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        try:
            self.driver = webdriver.Chrome(options=chrome_options)

            # Execute CDP commands to further hide automation
            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
                "userAgent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        except Exception as e:
            print(f"Error initializing Chrome driver: {e}")
            print("Make sure ChromeDriver is installed:")
            print("  Ubuntu: sudo apt-get install chromium-chromedriver")
            print("  macOS: brew install chromedriver")
            sys.exit(1)

    def scrape(self) -> List[Dict]:
        """Main scraping method"""
        print(f"Scraping CineCiutat VOSE movies from {self.movies_url}")

        try:
            self.init_driver()

            # Navigate to movies page
            print("Loading page...")
            self.driver.get(self.movies_url)

            # Wait for page to load
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
                print("No cookie banner found or already accepted")

            # Wait for movie listings to load
            print("Waiting for movie listings...")
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "article"))
                )
            except TimeoutException:
                print("Warning: No article elements found, trying alternative selectors")

            # Get page source
            html = self.driver.page_source

            # Save raw HTML for debugging
            os.makedirs('/tmp', exist_ok=True)
            with open('/tmp/cineciutat_raw.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("Saved raw HTML to /tmp/cineciutat_raw.html")

            # Also save screenshot for debugging
            self.driver.save_screenshot('/tmp/cineciutat_screenshot.png')
            print("Saved screenshot to /tmp/cineciutat_screenshot.png")

            # Parse the HTML
            movies = self.parse_movies(html)

            return movies

        finally:
            if self.driver:
                self.driver.quit()

    def parse_movies(self, html: str) -> List[Dict]:
        """Parse HTML to extract VOSE movies"""
        soup = BeautifulSoup(html, 'html.parser')
        movies = []

        # Try multiple selectors for movie containers
        selectors = [
            ('article', lambda x: x and 'movie' in str(x).lower()),
            ('div', lambda x: x and 'movie' in str(x).lower()),
            ('article', lambda x: x and 'film' in str(x).lower()),
            ('div', lambda x: x and 'card' in str(x).lower()),
            ('article', None),  # All articles
        ]

        movie_containers = []
        for tag, class_filter in selectors:
            if class_filter:
                movie_containers = soup.find_all(tag, class_=class_filter)
            else:
                movie_containers = soup.find_all(tag)

            if movie_containers:
                print(f"Found {len(movie_containers)} containers using selector: {tag}")
                break

        print(f"Processing {len(movie_containers)} potential movie containers")

        for container in movie_containers:
            # Check if it's VOSE
            if not self._is_vose(container):
                continue

            movie_data = self._extract_movie_data(container)
            if movie_data:
                movies.append(movie_data)

        return movies

    def _is_vose(self, container) -> bool:
        """Check if movie is in VOSE version"""
        text = container.get_text().lower()

        vose_markers = [
            'vose', 'v.o.s.e', 'v.o.s.e.', 'vo.se',
            'original version', 'versión original', 'version original',
            'subtitled', 'subtitulada', 'subtitulado'
        ]

        return any(marker in text for marker in vose_markers)

    def _extract_movie_data(self, container) -> Dict:
        """Extract movie details from container"""
        try:
            # Title
            title_elem = (
                container.find(['h1', 'h2', 'h3', 'h4']) or
                container.find('a', class_=lambda x: x and 'title' in str(x).lower())
            )
            title = title_elem.get_text(strip=True) if title_elem else None

            if not title:
                return None

            # Link
            link_elem = container.find('a', href=True)
            link = link_elem['href'] if link_elem else None
            if link and not link.startswith('http'):
                link = f"{self.base_url}{link}"

            # Showtimes
            showtimes = []
            time_elements = container.find_all(['time', 'span', 'div'], class_=lambda x: x and 'time' in str(x).lower())
            for elem in time_elements:
                time_text = elem.get_text(strip=True)
                if time_text and ':' in time_text:  # Looks like a time (e.g., "20:30")
                    showtimes.append(time_text)

            # Extract all text for reference
            all_text = container.get_text(' ', strip=True)

            return {
                'title': title,
                'link': link,
                'showtimes': showtimes,
                'cinema': 'CineCiutat',
                'location': 'Palma de Mallorca',
                'island': 'Mallorca',
                'version': 'VOSE',
                'raw_text': all_text,
                'scraped_at': datetime.now().isoformat()
            }

        except Exception as e:
            print(f"Error extracting movie data: {e}")
            return None

    def save_results(self, movies: List[Dict], output_file: str = None):
        """Save results to JSON"""
        if output_file is None:
            output_file = f"cineciutat_vose_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else '.', exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(movies, f, ensure_ascii=False, indent=2)

        print(f"Saved {len(movies)} movies to {output_file}")


def main():
    """Run the scraper"""
    scraper = CineCiutatScraper(headless=True)
    movies = scraper.scrape()

    # Display results
    print("\n" + "="*80)
    print("VOSE MOVIES AT CINECIUTAT")
    print("="*80)

    for i, movie in enumerate(movies, 1):
        print(f"\n{i}. {movie['title']}")
        if movie['link']:
            print(f"   URL: {movie['link']}")
        if movie['showtimes']:
            print(f"   Showtimes: {', '.join(movie['showtimes'])}")

    # Save to file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(os.path.dirname(script_dir), 'data', 'cinema')
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'cineciutat_vose.json')
    scraper.save_results(movies, output_file)

    print("\n" + "="*80)
    print(f"Total VOSE movies found: {len(movies)}")
    print("="*80)


if __name__ == "__main__":
    main()
