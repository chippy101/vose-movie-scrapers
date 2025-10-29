#!/usr/bin/env python3
"""
Aficine VOSE Movie Scraper with Selenium
Scrapes ALL Aficine cinemas across Balearic Islands (Mallorca, Menorca, Ibiza)
Handles cookie wall and navigates through individual movie pages for showtimes
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

class AficineScraper:
    """Selenium-based scraper for Aficine VOSE movies across all Balearic Islands"""

    def __init__(self, headless: bool = True):
        self.base_url = "https://aficine.com"
        self.vose_url = f"{self.base_url}/en/billboard/original-version-v-o-s-e/"
        self.headless = headless
        self.driver = None

    def init_driver(self):
        """Initialize Selenium WebDriver"""
        chrome_options = Options()

        if self.headless:
            chrome_options.add_argument('--headless=new')

        # Anti-detection settings
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        except Exception as e:
            print(f"Error initializing Chrome driver: {e}")
            print("Install ChromeDriver: sudo apt-get install chromium-chromedriver")
            sys.exit(1)

    def handle_cookie_wall(self):
        """Handle cookie consent banner"""
        try:
            # Common cookie button selectors
            cookie_selectors = [
                "//button[contains(text(), 'Accept')]",
                "//button[contains(text(), 'Aceptar')]",
                "//button[contains(text(), 'Acceptar')]",
                "//a[contains(text(), 'Accept')]",
                "//a[contains(@class, 'accept')]",
                "//button[contains(@class, 'accept')]",
                "//*[@id='cookie-accept']",
                "//*[contains(@class, 'cookie')]//button"
            ]

            for selector in cookie_selectors:
                try:
                    cookie_button = WebDriverWait(self.driver, 3).until(
                        EC.element_to_be_clickable((By.XPATH, selector))
                    )
                    cookie_button.click()
                    print("✓ Cookie banner accepted")
                    time.sleep(1)
                    return
                except TimeoutException:
                    continue

            print("No cookie banner found (may have been accepted previously)")

        except Exception as e:
            print(f"Cookie handling info: {e}")

    def scrape(self) -> List[Dict]:
        """Main scraping method"""
        print(f"Scraping Aficine VOSE movies from {self.vose_url}")
        print("This covers ALL Aficine cinemas across Balearic Islands")

        try:
            self.init_driver()

            # Navigate to VOSE page
            print("Loading VOSE billboard page...")
            self.driver.get(self.vose_url)
            time.sleep(3)

            # Handle cookie wall
            self.handle_cookie_wall()

            # Wait for movie posters/cards to load
            print("Waiting for movie listings...")
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "a"))
                )
            except TimeoutException:
                print("Warning: Page may not have loaded completely")

            # Get movie links from main page
            movie_links = self.extract_movie_links()
            print(f"Found {len(movie_links)} VOSE movies to process")

            # Visit each movie page to get detailed showtimes
            all_movies = []
            for i, link in enumerate(movie_links, 1):
                print(f"\nProcessing movie {i}/{len(movie_links)}: {link}")
                movie_data = self.get_movie_details(link)
                if movie_data:
                    all_movies.extend(movie_data)  # Can return multiple entries (one per cinema)
                time.sleep(2)  # Polite delay between requests

            return all_movies

        finally:
            if self.driver:
                self.driver.quit()

    def extract_movie_links(self) -> List[str]:
        """Extract movie page links from VOSE billboard"""
        html = self.driver.page_source
        soup = BeautifulSoup(html, 'html.parser')

        # Save for debugging
        os.makedirs('/tmp', exist_ok=True)
        with open('/tmp/aficine_vose_page.html', 'w', encoding='utf-8') as f:
            f.write(html)

        links = []

        # Try multiple selectors for movie links
        selectors = [
            ('a', lambda x: x and 'movie' in str(x).lower()),
            ('a', lambda x: x and 'film' in str(x).lower()),
            ('a', lambda x: x and 'pelicula' in str(x).lower()),
        ]

        for tag, class_filter in selectors:
            elements = soup.find_all(tag, class_=class_filter, href=True)
            for elem in elements:
                href = elem['href']
                if not href.startswith('http'):
                    href = f"{self.base_url}{href}"
                if href not in links:
                    links.append(href)

        # If no specific selectors work, try finding all links with movie posters
        if not links:
            img_links = soup.find_all('a', href=True)
            for link in img_links:
                if link.find('img'):  # Has an image (likely a poster)
                    href = link['href']
                    if not href.startswith('http'):
                        href = f"{self.base_url}{href}"
                    if '/movie/' in href or '/pelicula/' in href:
                        if href not in links:
                            links.append(href)

        return links

    def get_movie_details(self, url: str) -> List[Dict]:
        """Get detailed showtimes from individual movie page"""
        try:
            self.driver.get(url)
            time.sleep(2)

            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')

            # Extract movie title
            title_elem = soup.find(['h1', 'h2'], class_=lambda x: x and 'title' in str(x).lower())
            if not title_elem:
                title_elem = soup.find(['h1', 'h2'])
            title = title_elem.get_text(strip=True) if title_elem else "Unknown Title"

            # Extract showtimes grouped by cinema
            movies_by_cinema = []

            # Try to find cinema/location containers
            cinema_sections = soup.find_all(['div', 'section'], class_=lambda x: x and ('cinema' in str(x).lower() or 'location' in str(x).lower()))

            if not cinema_sections:
                # Fallback: look for any section with showtimes
                cinema_sections = soup.find_all(['div', 'section'], class_=lambda x: x and 'session' in str(x).lower())

            for section in cinema_sections:
                # Extract cinema name
                cinema_elem = section.find(['h3', 'h4', 'h5', 'span'], class_=lambda x: x and 'cinema' in str(x).lower())
                cinema_name = cinema_elem.get_text(strip=True) if cinema_elem else "Aficine"

                # Determine island location
                location = self._determine_location(cinema_name, section.get_text())

                # Extract showtimes
                showtimes = []
                time_elements = section.find_all(['time', 'span', 'button'], class_=lambda x: x and ('time' in str(x).lower() or 'session' in str(x).lower()))

                for elem in time_elements:
                    time_text = elem.get_text(strip=True)
                    if time_text and ':' in time_text:
                        showtimes.append(time_text)

                if showtimes:
                    movies_by_cinema.append({
                        'title': title,
                        'link': url,
                        'cinema': cinema_name,
                        'location': location,
                        'island': self._get_island(location),
                        'showtimes': showtimes,
                        'version': 'VOSE',
                        'scraped_at': datetime.now().isoformat()
                    })

            # If no cinema sections found, create single entry
            if not movies_by_cinema:
                # Try to extract any showtimes
                all_times = soup.find_all(['time', 'span', 'button'])
                showtimes = []
                for elem in all_times:
                    time_text = elem.get_text(strip=True)
                    if time_text and ':' in time_text and len(time_text) <= 10:
                        showtimes.append(time_text)

                if showtimes or title != "Unknown Title":
                    movies_by_cinema.append({
                        'title': title,
                        'link': url,
                        'cinema': 'Aficine (location TBD)',
                        'location': 'Balearic Islands',
                        'island': 'Unknown',
                        'showtimes': showtimes,
                        'version': 'VOSE',
                        'scraped_at': datetime.now().isoformat()
                    })

            return movies_by_cinema

        except Exception as e:
            print(f"Error getting movie details from {url}: {e}")
            return []

    def _determine_location(self, cinema_name: str, text: str) -> str:
        """Determine specific location from cinema name and text"""
        text_lower = text.lower()
        cinema_lower = cinema_name.lower()

        # Known Mallorca locations
        if any(loc in cinema_lower for loc in ['palma', 'ocimax', 'rivoli', 'rívoli', 'augusta', 'manacor']):
            if 'ocimax' in cinema_lower or 'palma' in cinema_lower:
                return 'Palma de Mallorca'
            elif 'manacor' in cinema_lower:
                return 'Manacor, Mallorca'
            else:
                return 'Mallorca'

        # Menorca
        if 'menorca' in text_lower or 'mahón' in text_lower or 'maó' in text_lower or 'ciutadella' in text_lower:
            return 'Menorca'

        # Ibiza
        if 'ibiza' in text_lower or 'eivissa' in text_lower:
            return 'Ibiza'

        return 'Balearic Islands'

    def _get_island(self, location: str) -> str:
        """Extract island name from location"""
        location_lower = location.lower()
        if 'mallorca' in location_lower or 'palma' in location_lower or 'manacor' in location_lower:
            return 'Mallorca'
        elif 'menorca' in location_lower:
            return 'Menorca'
        elif 'ibiza' in location_lower or 'eivissa' in location_lower:
            return 'Ibiza'
        else:
            return 'Unknown'

    def save_results(self, movies: List[Dict], output_file: str = None):
        """Save results to JSON"""
        if output_file is None:
            output_file = f"aficine_vose_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        os.makedirs(os.path.dirname(output_file) if os.path.dirname(output_file) else '.', exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(movies, f, ensure_ascii=False, indent=2)

        print(f"\nSaved {len(movies)} movie entries to {output_file}")


def main():
    """Run the scraper"""
    scraper = AficineScraper(headless=True)
    movies = scraper.scrape()

    # Display results grouped by island
    print("\n" + "="*80)
    print("VOSE MOVIES AT AFICINE CINEMAS - ALL BALEARIC ISLANDS")
    print("="*80)

    # Group by island
    by_island = {}
    for movie in movies:
        island = movie.get('island', 'Unknown')
        if island not in by_island:
            by_island[island] = []
        by_island[island].append(movie)

    for island, island_movies in sorted(by_island.items()):
        print(f"\n{'='*80}")
        print(f"{island.upper()}")
        print(f"{'='*80}")

        for i, movie in enumerate(island_movies, 1):
            print(f"\n{i}. {movie['title']}")
            print(f"   Cinema: {movie['cinema']}")
            print(f"   Location: {movie['location']}")
            if movie['showtimes']:
                print(f"   Showtimes: {', '.join(movie['showtimes'])}")

    # Save to file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(os.path.dirname(script_dir), 'data', 'cinema')
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, 'aficine_vose.json')
    scraper.save_results(movies, output_file)

    print("\n" + "="*80)
    print(f"Total VOSE movie entries found: {len(movies)}")
    print(f"Islands covered: {len(by_island)}")
    print("="*80)


if __name__ == "__main__":
    main()
