#!/usr/bin/env python3
"""
Majorca Daily Bulletin Films Scraper
Scrapes "Films in English across Mallorca" listings
IMPORTANT: Uses DYNAMIC article discovery - URLs change weekly!
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
from typing import List, Dict, Optional
import time
import os
import sys
import re

# Import stealth configuration
try:
    from stealth_config import StealthConfig, get_debug_mode
except ImportError:
    print("Warning: stealth_config.py not found, using basic configuration")
    StealthConfig = None
    get_debug_mode = lambda: False


class MajorcaDailyBulletinScraper:
    """
    Scraper for Majorca Daily Bulletin Films in English listings

    KEY FEATURE: Dynamically finds the latest article URL since it changes weekly
    """

    def __init__(self, headless: bool = True):
        self.base_url = "https://www.majorcadailybulletin.com"
        self.attractions_url = f"{self.base_url}/holiday/attractions.html"
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

    def find_latest_films_article(self) -> Optional[str]:
        """
        Dynamically find the latest "Films in English across Mallorca" article
        Returns: URL of the latest article, or None if not found
        """
        print(f"🔍 Searching for latest Films article on {self.attractions_url}")

        try:
            self.driver.get(self.attractions_url)
            time.sleep(3)

            # Handle cookie consent
            try:
                cookie_button = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Accept') or contains(text(), 'Aceptar')]"))
                )
                cookie_button.click()
                time.sleep(1)
            except TimeoutException:
                pass

            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')

            # Search for article links containing "films" and "english" keywords
            search_patterns = [
                r'films?.*(english|across\s+mallorca)',
                r'(english|original).+films?',
                r'showtimes?.*(english|mallorca)',
            ]

            # Find all article links
            article_links = soup.find_all('a', href=True)

            print(f"Found {len(article_links)} total links, searching for Films article...")

            candidates = []
            for link in article_links:
                href = link.get('href', '')
                text = link.get_text(strip=True).lower()
                title = link.get('title', '').lower()

                # Check if link text or title matches our patterns
                combined_text = f"{text} {title}"

                for pattern in search_patterns:
                    if re.search(pattern, combined_text, re.IGNORECASE):
                        # Make sure it's under /holiday/attractions/
                        if '/holiday/attractions/' in href:
                            full_url = href if href.startswith('http') else f"{self.base_url}{href}"
                            candidates.append({
                                'url': full_url,
                                'text': text,
                                'title': title
                            })
                            break

            if not candidates:
                print("❌ No Films article found in attractions section")
                return None

            # If multiple candidates, prefer the most recent one
            # Usually the first one in the list is the most recent
            latest = candidates[0]
            print(f"✅ Found article: '{latest['text'] or latest['title']}'")
            print(f"   URL: {latest['url']}")

            return latest['url']

        except Exception as e:
            print(f"❌ Error finding article: {e}")
            return None

    def scrape(self) -> List[Dict]:
        """Main scraping method with dynamic article discovery"""
        print("="*80)
        print("MAJORCA DAILY BULLETIN - Films in English Scraper")
        print("="*80)

        try:
            self.init_driver()

            # Step 1: Find the latest article URL dynamically
            article_url = self.find_latest_films_article()

            if not article_url:
                print("\n❌ Could not find the Films article. Exiting.")
                return []

            # Step 2: Scrape the article
            print(f"\n📄 Scraping article: {article_url}")
            self.driver.get(article_url)
            time.sleep(5)  # Give more time for content to load

            # Wait for article content to load
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.TAG_NAME, "article"))
                )
                print("✓ Article element found")
            except TimeoutException:
                print("⚠ Timeout waiting for article, proceeding anyway")

            html = self.driver.page_source
            movies = self.parse_article(html)

            print(f"\n✅ Found {len(movies)} movie listings")
            return movies

        finally:
            if self.driver:
                self.driver.quit()

    def parse_article(self, html: str) -> List[Dict]:
        """Parse the Films in English article for movie listings"""
        soup = BeautifulSoup(html, 'html.parser')
        movies = []

        # Find the main article content - try multiple selectors
        article = (
            soup.find('article') or
            soup.find('div', class_=re.compile(r'article-body|article-content|post-content|entry-content', re.I)) or
            soup.find('div', class_=re.compile(r'article|content|body', re.I)) or
            soup.find('div', {'id': re.compile(r'article|content', re.I)}) or
            soup.find('main')  # Fallback to main tag
        )

        if not article:
            print("❌ Could not find article content")
            print(f"Page title: {soup.find('title').get_text() if soup.find('title') else 'N/A'}")
            return []

        # Get all text content, preserving structure
        article_text = article.get_text('\n', strip=True)
        lines = article_text.split('\n')

        # Debug: print(f"\n📝 Article has {len(lines)} lines")

        current_movie = None

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line or len(line) < 5:
                i += 1
                continue

            # Pattern 1: Movie title with year - could be with or without markdown headers
            # Examples: "#### Movie Title (2025)" or just "Movie Title (2025)"
            header_match = re.match(r'^#+?\s*(.+?)\s*\((\d{4})\)\s*$', line)
            if header_match:
                current_movie = header_match.group(1).strip()
                print(f"  🎬 Found movie: {current_movie}")
                continue

            # Also try without markdown symbols (rendered HTML)
            title_match = re.match(r'^([A-Z][^(]+?)\s*\((\d{4})\)\s*$', line)
            if title_match and not current_movie:
                # Check if this looks like a movie title (starts with capital, has year)
                potential_title = title_match.group(1).strip()
                if len(potential_title) > 3 and not any(keyword in potential_title.lower() for keyword in ['starring', 'director', 'plot', 'rated']):
                    current_movie = potential_title
                    print(f"  🎬 Found movie: {current_movie}")
                    continue

            # Pattern 2: Showtime line - may be split across multiple lines
            # Line 1: "Showtimes at"
            # Line 2: "Cinema Name"
            # Line 3: "in Location: times"
            if re.match(r'(?:\*\s*)?Showtimes?\s+at\s*$', line, re.IGNORECASE) and current_movie:
                # This is a multi-line showtime, combine next 2 lines
                if i + 2 < len(lines):
                    cinema_name = lines[i + 1].strip().replace('**', '')
                    location_time_line = lines[i + 2].strip()

                    # Parse "in Location: times"
                    location_match = re.match(r'in\s+(.+?):\s*(.+)', location_time_line, re.IGNORECASE)
                    if location_match:
                        location = location_match.group(1).strip()
                        times_text = location_match.group(2).strip()

                        print(f"    📍 Cinema: {cinema_name} ({location})")
                        print(f"       Times: {times_text}")

                        # Parse times - handle both 12-hour (7.30pm) and 24-hour (19:30) formats
                        times = []

                        # Match 12-hour format: 7.30pm, 10.00am, 8.45pm
                        twelve_hour_times = re.findall(r'(\d{1,2})\.(\d{2})\s*(am|pm)', times_text, re.IGNORECASE)
                        for hour, minute, meridiem in twelve_hour_times:
                            hour = int(hour)
                            if meridiem.lower() == 'pm' and hour != 12:
                                hour += 12
                            elif meridiem.lower() == 'am' and hour == 12:
                                hour = 0
                            times.append(f"{hour:02d}:{minute}")

                        # Also match 24-hour format: 19:30
                        twenty_four_hour_times = re.findall(r'(\d{1,2}):(\d{2})', times_text)
                        for hour, minute in twenty_four_hour_times:
                            time_str = f"{int(hour):02d}:{minute}"
                            if time_str not in times:  # Avoid duplicates
                                times.append(time_str)

                        if times:
                            # Use today's date as default
                            today = datetime.now().strftime('%Y-%m-%d')
                            showtimes = [{'date': today, 'time': t} for t in times]

                            movies.append({
                                'title': current_movie,
                                'link': None,  # Articles don't have direct links
                                'showtimes': showtimes,
                                'cinema': cinema_name,
                                'location': location,
                                'island': 'Mallorca',
                                'version': 'VOSE',
                                'raw_text': f"{line} {cinema_name} {location_time_line}",
                                'scraped_at': datetime.now().isoformat()
                            })
                            print(f"       ✓ Added {len(times)} showtimes")

                        # Skip the next 2 lines we just processed
                        i += 3
                        continue

            i += 1

        return movies

    def save_results(self, movies: List[Dict], output_file: str = None):
        """Save results to JSON"""
        if output_file is None:
            output_file = f"bulletin_films_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(movies, f, ensure_ascii=False, indent=2)

        print(f"\n💾 Saved {len(movies)} movies to {output_file}")


def main():
    """Run the scraper"""
    scraper = MajorcaDailyBulletinScraper(headless=True)
    movies = scraper.scrape()

    if movies:
        scraper.save_results(movies)
        print("\n✅ Scraping completed successfully")
    else:
        print("\n❌ No movies found")


if __name__ == "__main__":
    main()
