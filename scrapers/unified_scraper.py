#!/usr/bin/env python3
"""
Unified VOSE Movie Scraper for Balearic Islands
Combines CineCiutat + Aficine scrapers for complete VOSE coverage

Usage:
    python unified_scraper.py              # Run all scrapers
    python unified_scraper.py --cineciutat # Run only CineCiutat
    python unified_scraper.py --aficine    # Run only Aficine
"""

import argparse
import json
import os
from datetime import datetime
from typing import List, Dict
import sys

# Import individual scrapers
try:
    from cineciutat_scraper import CineCiutatScraper
    from aficine_scraper import AficineScraper
except ImportError:
    print("Error: Make sure cineciutat_scraper.py and aficine_scraper.py are in the same directory")
    sys.exit(1)


class UnifiedVOSEScraper:
    """Unified scraper combining all VOSE cinema sources"""

    def __init__(self, headless: bool = True):
        self.headless = headless
        self.all_movies = []

    def scrape_all(self, include_cineciutat: bool = True, include_aficine: bool = True):
        """Run all enabled scrapers"""
        print("="*80)
        print("UNIFIED VOSE MOVIE SCRAPER FOR BALEARIC ISLANDS")
        print("="*80)

        # Scrape CineCiutat
        if include_cineciutat:
            print("\n" + "-"*80)
            print("SCRAPING: CineCiutat (Palma)")
            print("-"*80)
            try:
                scraper = CineCiutatScraper(headless=self.headless)
                movies = scraper.scrape()
                self.all_movies.extend(movies)
                print(f"✓ CineCiutat: {len(movies)} VOSE movies found")
            except Exception as e:
                print(f"✗ CineCiutat scraper failed: {e}")

        # Scrape Aficine
        if include_aficine:
            print("\n" + "-"*80)
            print("SCRAPING: Aficine (All Balearic Islands)")
            print("-"*80)
            try:
                scraper = AficineScraper(headless=self.headless)
                movies = scraper.scrape()
                self.all_movies.extend(movies)
                print(f"✓ Aficine: {len(movies)} VOSE movie entries found")
            except Exception as e:
                print(f"✗ Aficine scraper failed: {e}")

        return self.all_movies

    def deduplicate_movies(self) -> List[Dict]:
        """Remove duplicate movies based on title and cinema"""
        seen = set()
        unique_movies = []

        for movie in self.all_movies:
            # Create unique key from title and cinema
            key = f"{movie['title'].lower()}|{movie['cinema'].lower()}"

            if key not in seen:
                seen.add(key)
                unique_movies.append(movie)

        return unique_movies

    def generate_summary(self, movies: List[Dict]):
        """Generate summary statistics"""
        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)

        # Total count
        print(f"\nTotal VOSE movies/sessions: {len(movies)}")

        # By cinema
        by_cinema = {}
        for movie in movies:
            cinema = movie.get('cinema', 'Unknown')
            by_cinema[cinema] = by_cinema.get(cinema, 0) + 1

        print(f"\nBy Cinema:")
        for cinema, count in sorted(by_cinema.items()):
            print(f"  {cinema}: {count}")

        # By island (if available)
        by_island = {}
        for movie in movies:
            island = movie.get('island', movie.get('location', 'Unknown'))
            if 'Mallorca' in island or 'Palma' in island:
                island = 'Mallorca'
            elif 'Menorca' in island:
                island = 'Menorca'
            elif 'Ibiza' in island:
                island = 'Ibiza'
            by_island[island] = by_island.get(island, 0) + 1

        print(f"\nBy Island:")
        for island, count in sorted(by_island.items()):
            print(f"  {island}: {count}")

    def save_results(self, movies: List[Dict], output_dir: str = None):
        """Save combined results"""
        if output_dir is None:
            # Get the data/cinema directory relative to the script
            script_dir = os.path.dirname(os.path.abspath(__file__))
            output_dir = os.path.join(os.path.dirname(script_dir), 'data', 'cinema')

        os.makedirs(output_dir, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        # Save full results
        full_output = os.path.join(output_dir, f"vose_all_{timestamp}.json")
        with open(full_output, 'w', encoding='utf-8') as f:
            json.dump(movies, f, ensure_ascii=False, indent=2)
        print(f"\n✓ Saved full results to: {full_output}")

        # Save latest as well (for easy reference)
        latest_output = os.path.join(output_dir, "vose_latest.json")
        with open(latest_output, 'w', encoding='utf-8') as f:
            json.dump(movies, f, ensure_ascii=False, indent=2)
        print(f"✓ Saved latest results to: {latest_output}")

        # Generate HTML report
        html_output = os.path.join(output_dir, f"vose_report_{timestamp}.html")
        self.generate_html_report(movies, html_output)
        print(f"✓ Saved HTML report to: {html_output}")

    def generate_html_report(self, movies: List[Dict], output_file: str):
        """Generate human-readable HTML report"""
        html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VOSE Movies - Balearic Islands</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        h1 { color: #2c3e50; }
        .island { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; }
        .island h2 { color: #3498db; margin-top: 0; }
        .movie { margin: 15px 0; padding: 12px; background: #ecf0f1; border-left: 4px solid #3498db; }
        .movie h3 { margin: 0 0 8px 0; color: #2c3e50; }
        .info { margin: 5px 0; color: #555; }
        .showtimes { font-weight: bold; color: #e74c3c; }
        .timestamp { color: #7f8c8d; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>🎬 VOSE Movies in Balearic Islands</h1>
    <p class="timestamp">Generated: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """</p>
"""

        # Group by island
        by_island = {}
        for movie in movies:
            island = movie.get('island', movie.get('location', 'Other'))
            if 'Mallorca' in island or 'Palma' in island:
                island = 'Mallorca'
            elif 'Menorca' in island:
                island = 'Menorca'
            elif 'Ibiza' in island:
                island = 'Ibiza'
            else:
                island = 'Other'

            if island not in by_island:
                by_island[island] = []
            by_island[island].append(movie)

        # Generate HTML for each island
        for island in ['Mallorca', 'Menorca', 'Ibiza', 'Other']:
            if island not in by_island:
                continue

            island_movies = by_island[island]
            html += f'\n<div class="island">\n<h2>{island} ({len(island_movies)} movies)</h2>\n'

            for movie in island_movies:
                html += '<div class="movie">\n'
                html += f'<h3>{movie["title"]}</h3>\n'
                html += f'<div class="info">🏛️ {movie["cinema"]}</div>\n'
                html += f'<div class="info">📍 {movie.get("location", "N/A")}</div>\n'

                if movie.get('showtimes'):
                    html += f'<div class="info showtimes">🕐 {", ".join(movie["showtimes"])}</div>\n'

                if movie.get('link'):
                    html += f'<div class="info"><a href="{movie["link"]}" target="_blank">More info</a></div>\n'

                html += '</div>\n'

            html += '</div>\n'

        html += """
</body>
</html>
"""

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Scrape VOSE movies from Balearic cinemas')
    parser.add_argument('--cineciutat', action='store_true', help='Scrape only CineCiutat')
    parser.add_argument('--aficine', action='store_true', help='Scrape only Aficine')
    parser.add_argument('--headless', action='store_true', default=True, help='Run in headless mode (default: True)')
    parser.add_argument('--output', type=str, help='Output directory (default: ../data/cinema)')

    args = parser.parse_args()

    # Determine which scrapers to run
    include_cineciutat = True
    include_aficine = True

    if args.cineciutat or args.aficine:
        include_cineciutat = args.cineciutat
        include_aficine = args.aficine

    # Run scrapers
    scraper = UnifiedVOSEScraper(headless=args.headless)
    movies = scraper.scrape_all(
        include_cineciutat=include_cineciutat,
        include_aficine=include_aficine
    )

    # Deduplicate
    unique_movies = scraper.deduplicate_movies()
    print(f"\n→ Deduplicated: {len(movies)} → {len(unique_movies)} unique movies")

    # Generate summary
    scraper.generate_summary(unique_movies)

    # Save results
    scraper.save_results(unique_movies, args.output)

    print("\n" + "="*80)
    print("✓ SCRAPING COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()
