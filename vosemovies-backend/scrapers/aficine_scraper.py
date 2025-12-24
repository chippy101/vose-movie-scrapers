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

# Import stealth configuration
try:
    from stealth_config import StealthConfig, RateLimiter, get_debug_mode
except ImportError:
    print("Warning: stealth_config.py not found, using basic configuration")
    StealthConfig = None
    RateLimiter = None
    get_debug_mode = lambda: False

# Import TMDB service for language verification
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'api'))
try:
    from services.tmdb_service import TMDBService
except ImportError:
    print("Warning: TMDBService not found, language verification disabled")
    TMDBService = None

class AficineScraper:
    """Selenium-based scraper for Aficine VOSE movies across all Balearic Islands"""

    def __init__(self, headless: bool = True):
        self.base_url = "https://aficine.com"
        self.vose_url = f"{self.base_url}/en/billboard/original-version-v-o-s-e/"
        self.headless = headless
        self.driver = None
        # Rate limiter: max 15 requests/minute (very polite)
        self.rate_limiter = RateLimiter(requests_per_minute=15) if RateLimiter else None
        # TMDB service for language verification
        self.tmdb = TMDBService() if TMDBService else None

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
                chrome_options.add_argument('--disable-gpu')  # Required for Render
                chrome_options.add_argument('--remote-debugging-port=9222')  # Fix DevToolsActivePort error
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
                    if StealthConfig:
                        StealthConfig.random_delay(0.5, 1.5)
                    else:
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

            # Wait with random delay (mimics human behavior)
            if StealthConfig:
                StealthConfig.random_delay(2.0, 4.0)
            else:
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

                # Apply rate limiting to be respectful
                if self.rate_limiter:
                    self.rate_limiter.wait()

                movie_data = self.get_movie_details(link)
                if movie_data:
                    all_movies.extend(movie_data)  # Can return multiple entries (one per cinema)

                # Random delay between movie pages (mimics human browsing)
                if StealthConfig:
                    StealthConfig.random_delay(1.5, 3.5)
                else:
                    time.sleep(2)

            return all_movies

        finally:
            if self.driver:
                self.driver.quit()

    def extract_movie_links(self) -> List[str]:
        """Extract movie page links from VOSE billboard"""
        html = self.driver.page_source
        soup = BeautifulSoup(html, 'html.parser')

        # Save for debugging (only in debug mode)
        if get_debug_mode():
            os.makedirs('/tmp', exist_ok=True)
            with open('/tmp/aficine_vose_page.html', 'w', encoding='utf-8') as f:
                f.write(html)
            print("Saved debug HTML to /tmp/aficine_vose_page.html")

        links = []

        # Find all links that match the movie URL pattern with VOSE filter
        all_links = soup.find_all('a', href=True)
        for link in all_links:
            href = link['href']
            if not href.startswith('http'):
                href = f"{self.base_url}{href}"

            # Look for movie URLs with VOSE filter, avoiding duplicates
            if '/pelicula' in href and 'vose=true' in href:
                # Extract the base movie URL (remove query params except cineId and vose)
                base_href = href.split('?')[0] + '?' + '&'.join([
                    p for p in href.split('?')[1].split('&')
                    if 'cineId' in p or 'vose' in p
                ]) if '?' in href else href

                if base_href not in links:
                    links.append(base_href)

        return links

    # Cinema ID mapping from URL parameter to actual cinema name
    CINEMA_ID_MAP = {
        '17': 'Ocimax Palma',
        '19': 'Rívoli Palma',
        '20': 'Augusta Palma',
        '21': 'Aficine Manacor',
        '18': 'Ocimax Maó',
        '22': 'Multicines Eivissa'
    }

    def get_movie_details(self, url: str) -> List[Dict]:
        """Get detailed showtimes from individual movie page across all available dates"""
        try:
            # Extract cinema ID from URL to determine cinema name
            cinema_name_from_url = None
            if 'cineId=' in url:
                try:
                    cinema_id = url.split('cineId=')[1].split('&')[0]
                    cinema_name_from_url = self.CINEMA_ID_MAP.get(cinema_id)
                    print(f"[Aficine] Detected cineId={cinema_id} -> {cinema_name_from_url}")
                except:
                    pass

            self.driver.get(url)

            # Wait with random delay
            if StealthConfig:
                StealthConfig.random_delay(1.5, 3.0)
            else:
                time.sleep(2)

            # Aficine does not support URL date parameters or date navigation buttons
            # Each movie page shows VOSE showtimes for specific dates only (not all 7 days)
            # Simply scrape the current page to get all available VOSE showtimes
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            all_movies_all_dates = self._parse_movie_showtimes(soup, cinema_name_from_url, url)

            return all_movies_all_dates

        except Exception as e:
            print(f"Error getting movie details from {url}: {e}")
            return []

    def _parse_movie_showtimes(self, soup, cinema_name_from_url: str = None, url: str = "") -> List[Dict]:
        """Parse showtimes from BeautifulSoup object for a single date"""
        try:
            # Extract movie title
            title_elem = soup.find(['h1', 'h2'])
            title = title_elem.get_text(strip=True) if title_elem else "Unknown Title"

            # Verify this is an English movie using TMDB
            if self.tmdb and title != "Unknown Title":
                if not self.tmdb.is_english_movie(title):
                    print(f"  ✗ Skipping non-English movie: {title}")
                    return []  # Skip non-English movies
                print(f"  ✓ Verified English movie: {title}")

            # Extract showtimes grouped by cinema
            movies_by_cinema = []

            # Find all cinema name containers
            cinema_divs = soup.find_all('div', class_='nombre-cine')

            # Group buttons by cinema by checking their proximity to cinema name divs
            for cinema_div in cinema_divs:
                # Get cinema name
                cinema_h6 = cinema_div.find('h6')
                cinema_name = cinema_h6.get_text(strip=True) if cinema_h6 else (cinema_name_from_url or "Aficine")

                # Find showtime buttons that belong to THIS cinema only
                # Strategy: Find the next sibling container after cinema name, or go up ONE level max
                parent_container = cinema_div.find_parent('div')

                if not parent_container:
                    # Fallback: Look for next sibling sections
                    parent_container = cinema_div.find_next_sibling('div')

                if not parent_container:
                    # Last resort: use cinema_div itself
                    parent_container = cinema_div

                # Find ALL VOSE showtime buttons within THIS cinema's section only
                # Stop searching when we hit another cinema name div
                showtime_buttons = []

                # Get all buttons in this container
                all_buttons_in_section = parent_container.find_all('a', class_='aficine-btn-pase-vose')

                # Filter out buttons that come after the next cinema div (if any)
                next_cinema_div = cinema_div.find_next('div', class_='nombre-cine')

                for button in all_buttons_in_section:
                    # If there's a next cinema div, make sure this button comes before it
                    if next_cinema_div:
                        # Check if button appears before next cinema in document order
                        # This is a simple heuristic: convert to string positions
                        button_pos = str(soup).find(str(button))
                        next_cinema_pos = str(soup).find(str(next_cinema_div))
                        if button_pos < next_cinema_pos:
                            showtime_buttons.append(button)
                    else:
                        # No next cinema, so all remaining buttons belong to this cinema
                        showtime_buttons.append(button)

                showtimes = []
                for button in showtime_buttons:
                    # Extract date and time from title attribute: "Tu entrada para el día 31-10-2025 a las 15:30"
                    title_attr = button.get('title', '')
                    if 'día' in title_attr and 'a las' in title_attr:
                        try:
                            # Extract date: "31-10-2025"
                            date_part = title_attr.split('día')[-1].split('a las')[0].strip()
                            # Extract time: "15:30"
                            time_part = title_attr.split('a las')[-1].strip()

                            if ':' in time_part and '-' in date_part:
                                # Parse date from DD-MM-YYYY to YYYY-MM-DD
                                day, month, year = date_part.split('-')
                                iso_date = f"{year}-{month}-{day}"

                                showtimes.append({
                                    'date': iso_date,
                                    'time': time_part
                                })
                        except Exception as e:
                            print(f"Warning: Could not parse date/time from '{title_attr}': {e}")
                            # Fallback to just time with today's date
                            if 'a las' in title_attr:
                                time_part = title_attr.split('a las')[-1].strip()
                                if ':' in time_part:
                                    showtimes.append({
                                        'date': datetime.now().strftime('%Y-%m-%d'),
                                        'time': time_part
                                    })

                # Deduplicate showtimes while preserving order
                seen = set()
                unique_showtimes = []
                unique_dates = set()
                for st in showtimes:
                    key = f"{st['date']}_{st['time']}"
                    if key not in seen:
                        seen.add(key)
                        unique_showtimes.append(st)
                        unique_dates.add(st['date'])
                showtimes = unique_showtimes


                if showtimes:
                    # Determine location from cinema name
                    location = self._determine_location(cinema_name, '')

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

            # If no cinema sections found, create fallback entry with cinema from URL
            if not movies_by_cinema and title != "Unknown Title":
                fallback_cinema = cinema_name_from_url or 'Aficine'
                fallback_location = self._determine_location(fallback_cinema, '')

                movies_by_cinema.append({
                    'title': title,
                    'link': url,
                    'cinema': fallback_cinema,
                    'location': fallback_location,
                    'island': self._get_island(fallback_location),
                    'showtimes': [],
                    'version': 'VOSE',
                    'scraped_at': datetime.now().isoformat()
                })

            return movies_by_cinema

        except Exception as e:
            print(f"Error getting movie details from {url}: {e}")
            return []

    def _determine_location(self, cinema_name: str, text: str) -> str:
        """Determine specific location from cinema name and text"""
        cinema_lower = cinema_name.lower()

        # Ocimax Palma
        if 'ocimax palma' in cinema_lower or ('ocimax' in cinema_lower and 'palma' in cinema_lower):
            return 'Palma de Mallorca'

        # Manacor
        if 'manacor' in cinema_lower:
            return 'Manacor, Mallorca'

        # Augusta (Palma)
        if 'augusta' in cinema_lower:
            return 'Palma de Mallorca'

        # Rívoli (Palma)
        if 'rivoli' in cinema_lower or 'rívoli' in cinema_lower:
            return 'Palma de Mallorca'

        # Ocimax Maó / Menorca
        if 'maó' in cinema_lower or 'mahón' in cinema_lower or ('ocimax' in cinema_lower and 'mao' in cinema_lower):
            return 'Maó, Menorca'

        # Eivissa/Ibiza
        if 'eivissa' in cinema_lower or 'ibiza' in cinema_lower:
            return 'Eivissa, Ibiza'

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
                # Showtimes is a list of dicts with 'date' and 'time' keys
                showtime_strs = [f"{s['date']} {s['time']}" for s in movie['showtimes']]
                print(f"   Showtimes: {', '.join(showtime_strs)}")

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
