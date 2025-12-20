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
    # Fallback if import fails
    def is_vose(text):
        return 'vose' in text.lower() or 'ov ' in text.lower()
    VOSE_MARKERS = ['vose', 'ov']

# Import stealth configuration
try:
    from stealth_config import StealthConfig, get_debug_mode
except ImportError:
    print("Warning: stealth_config.py not found, using basic configuration")
    StealthConfig = None
    get_debug_mode = lambda: False

class CineCiutatScraper:
    """Selenium-based scraper for CineCiutat VOSE movies"""

    def __init__(self, headless: bool = True):
        self.base_url = "https://cineciutat.org"
        self.movies_url = f"{self.base_url}/en/movies"
        self.headless = headless
        self.driver = None

    def init_driver(self):
        """Initialize Selenium WebDriver with comprehensive stealth settings"""
        try:
            if StealthConfig:
                # Use advanced stealth configuration
                chrome_options, user_agent = StealthConfig.get_stealth_chrome_options(
                    headless=self.headless,
                    debug_mode=get_debug_mode()
                )
            else:
                # Fallback to basic configuration
                chrome_options = Options()
                if self.headless:
                    chrome_options.add_argument('--headless=new')
                chrome_options.add_argument('--disable-blink-features=AutomationControlled')
                chrome_options.add_argument('--no-sandbox')
                chrome_options.add_argument('--disable-dev-shm-usage')
                chrome_options.add_argument('--window-size=1920,1080')
                user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
                chrome_options.add_argument(f'--user-agent={user_agent}')
                chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
                chrome_options.add_experimental_option('useAutomationExtension', False)

            self.driver = webdriver.Chrome(options=chrome_options)

            # Apply stealth scripts to hide automation
            if StealthConfig:
                StealthConfig.apply_stealth_scripts(self.driver)
            else:
                # Fallback: just hide webdriver property
                self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

            # Set user agent via CDP for extra safety
            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
                "userAgent": user_agent
            })

        except Exception as e:
            print(f"Error initializing Chrome driver: {e}")
            print("Make sure ChromeDriver is installed:")
            print("  Ubuntu: sudo apt-get install chromium-chromedriver")
            print("  macOS: brew install chromedriver")
            sys.exit(1)

    def scrape(self) -> List[Dict]:
        """Main scraping method - iterates through multiple dates by URL"""
        print(f"Scraping CineCiutat VOSE movies from {self.movies_url}")

        try:
            self.init_driver()
            all_movies = []

            # Handle cookie consent on first page load
            print("Loading page...")
            self.driver.get(self.movies_url)

            # Wait for page to load
            if StealthConfig:
                StealthConfig.random_delay(2.0, 4.0)
            else:
                time.sleep(3)

            # Handle cookie consent if present
            try:
                cookie_button = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Aceptar')]"))
                )
                cookie_button.click()
                print("✓ Cookie consent accepted")
                if StealthConfig:
                    StealthConfig.random_delay(0.5, 1.5)
                else:
                    time.sleep(1)
            except TimeoutException:
                print("No cookie banner found or already accepted")

            # Generate list of dates for the next 8 days
            today = datetime.now()
            dates_to_scrape = [today + timedelta(days=i) for i in range(8)]

            print(f"Scraping {len(dates_to_scrape)} dates...")

            # Scrape each date
            for date_obj in dates_to_scrape:
                try:
                    date_str = date_obj.strftime('%Y-%m-%d')
                    date_display = date_obj.strftime('%a %d %b')
                    print(f"\n→ Scraping date: {date_display} ({date_str})")

                    # Navigate to the date-specific URL
                    date_url = f"{self.movies_url}?date={date_str}"
                    self.driver.get(date_url)

                    # Wait for content to load
                    if StealthConfig:
                        StealthConfig.random_delay(1.5, 2.5)
                    else:
                        time.sleep(2)

                    # Parse movies for this date
                    date_movies = self._scrape_current_page_with_date(date_str)
                    print(f"  Found {len(date_movies)} VOSE movies")
                    all_movies.extend(date_movies)

                except Exception as e:
                    print(f"Error processing date {date_str}: {e}")
                    continue

            # Remove duplicates (same movie+time+date)
            unique_movies = self._deduplicate_movies(all_movies)
            print(f"\n→ Total: {len(unique_movies)} unique VOSE movie showtimes across all dates")

            return unique_movies

        finally:
            if self.driver:
                self.driver.quit()

    def _scrape_current_page(self) -> List[Dict]:
        """Scrape movies from the currently displayed page"""
        # Wait for movie listings to load
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "article"))
            )
        except TimeoutException:
            print("Warning: No article elements found, trying alternative selectors")

        # Get page source
        html = self.driver.page_source

        # Parse the HTML
        movies = self.parse_movies(html)
        return movies

    def _scrape_current_page_with_date(self, date_str: str) -> List[Dict]:
        """Scrape movies from the currently displayed page and set all showtimes to the given date"""
        # Wait for movie listings to load
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "article"))
            )
        except TimeoutException:
            pass  # Continue anyway

        # Get page source
        html = self.driver.page_source

        # Parse the HTML
        movies = self.parse_movies(html)

        # Override all showtime dates with the current date being scraped
        for movie in movies:
            for showtime in movie.get('showtimes', []):
                showtime['date'] = date_str

        return movies

    def _deduplicate_movies(self, movies: List[Dict]) -> List[Dict]:
        """Remove duplicate movie showtime entries"""
        seen = set()
        unique = []

        for movie in movies:
            # Create a unique key for each showtime
            for showtime in movie.get('showtimes', []):
                key = (movie['title'], showtime['date'], showtime['time'], movie['cinema'])
                if key not in seen:
                    seen.add(key)
                    # Create a new movie entry for each unique showtime
                    unique.append({
                        **movie,
                        'showtimes': [showtime]
                    })

        return unique

    def parse_movies(self, html: str) -> List[Dict]:
        """Parse HTML to extract VOSE movies with dates"""
        soup = BeautifulSoup(html, 'html.parser')
        movies = []

        # Look for c-card-movie divs (new website structure)
        movie_containers = soup.find_all('div', class_='c-card-movie')

        if not movie_containers:
            # Fallback to old selectors
            selectors = [
                ('article', lambda x: x and 'movie' in str(x).lower()),
                ('div', lambda x: x and 'movie' in str(x).lower()),
            ]

            for tag, class_filter in selectors:
                movie_containers = soup.find_all(tag, class_=class_filter)
                if movie_containers:
                    break

        print(f"Found {len(movie_containers)} movie containers")
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
        """
        Check if movie is in VOSE version using comprehensive marker list
        VOSE = Versión Original Subtitulada en Español (Original Version with Spanish Subtitles)
        """
        text = container.get_text()
        return is_vose(text)

    def _extract_movie_data(self, container) -> Dict:
        """Extract movie details from container"""
        try:
            # Title - look for c-card-movie__title first, then fallback
            title_elem = (
                container.find('div', class_='c-card-movie__title') or
                container.find(['h1', 'h2', 'h3', 'h4']) or
                container.find('a', class_=lambda x: x and 'title' in str(x).lower())
            )
            title = title_elem.get_text(strip=True) if title_elem else None

            if not title:
                return None

            # Link - look for "See details" link or first href
            link_elem = (
                container.find('a', string=lambda x: x and 'details' in str(x).lower()) or
                container.find('a', href=lambda x: x and '/movie/' in str(x))
            )
            link = link_elem['href'] if link_elem else None
            if link and not link.startswith('http'):
                link = f"{self.base_url}{link}"

            # Showtimes - look for date-grouped showtimes
            showtimes = []

            # Look for date headers and associated times
            # CineCiutat groups showtimes by date like "Tuesday 11 November"
            current_date = None

            # Get all children to process in order
            for elem in container.descendants:
                if not hasattr(elem, 'name'):
                    continue

                # Check if this is a date header
                elem_text = elem.get_text(strip=True) if hasattr(elem, 'get_text') else ''

                # Look for date patterns like "Tuesday 11 November" or "Wed 12 Nov"
                date_match = re.search(r'(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', elem_text, re.IGNORECASE)

                if date_match:
                    # Parse the date
                    try:
                        current_year = datetime.now().year
                        day = int(date_match.group(2))
                        month_str = date_match.group(3)

                        # Convert month name to number
                        month_map = {
                            'jan': 1, 'january': 1,
                            'feb': 2, 'february': 2,
                            'mar': 3, 'march': 3,
                            'apr': 4, 'april': 4,
                            'may': 5,
                            'jun': 6, 'june': 6,
                            'jul': 7, 'july': 7,
                            'aug': 8, 'august': 8,
                            'sep': 9, 'september': 9,
                            'oct': 10, 'october': 10,
                            'nov': 11, 'november': 11,
                            'dec': 12, 'december': 12
                        }
                        month = month_map.get(month_str.lower(), None)

                        if month:
                            current_date = datetime(current_year, month, day).strftime('%Y-%m-%d')
                    except (ValueError, AttributeError):
                        pass

                # Check if this is a time element
                if elem.name in ['div', 'span', 'time'] and 'time' in str(elem.get('class', '')).lower():
                    time_text = elem.get_text(strip=True)
                    if time_text and ':' in time_text and len(time_text) <= 8:  # Looks like a time (e.g., "20:30")
                        # Use the most recent date header, or today if none found
                        showtime_date = current_date if current_date else datetime.now().strftime('%Y-%m-%d')
                        showtimes.append({
                            'date': showtime_date,
                            'time': time_text
                        })

            # If no showtimes found with new method, try old method as fallback
            if not showtimes:
                time_elements = container.find_all('div', class_='c-card-movie__time')
                if not time_elements:
                    time_elements = container.find_all(['time', 'span', 'div'], class_=lambda x: x and 'time' in str(x).lower())

                today_date = datetime.now().strftime('%Y-%m-%d')
                for elem in time_elements:
                    time_text = elem.get_text(strip=True)
                    if time_text and ':' in time_text:
                        showtimes.append({
                            'date': today_date,
                            'time': time_text
                        })

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
