# New Scrapers Created! 🎉

Two new scrapers have been created for additional cinema sources in Mallorca.

## 📍 New Scrapers

### 1. Cines Moix Negre (`moix_negre_scraper.py`)

**URL:** https://cinesmoixnegre.sacatuentrada.es/es/hoy

**Features:**
- Scrapes showtimes from sacatuentrada.es ticketing platform
- Flexible HTML parsing to handle different page structures
- Automatic VOSE detection

**Status:** ✅ Ready to test

---

### 2. Majorca Daily Bulletin (`majorca_bulletin_scraper.py`)

**URL:** https://www.majorcadailybulletin.com/holiday/attractions.html

**Features:**
- 🔥 **DYNAMIC ARTICLE DISCOVERY** - Automatically finds the latest "Films in English" article
- Handles weekly URL changes (articles are published weekly with different URLs)
- Searches attractions section for article matching "films" + "english"
- Extracts cinema names and movie showtimes from article text
- Covers ALL Mallorca cinemas showing English/VOSE films

**Status:** ✅ Ready to test

**How it works:**
1. Visits `/holiday/attractions.html`
2. Searches for latest article containing "films" and "english"
3. Clicks on the article
4. Parses cinema listings and showtimes
5. Returns structured data

---

## 🧪 Testing the Scrapers

### Test Individually

```bash
cd /media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend/scrapers

# Test Cines Moix Negre
python3 moix_negre_scraper.py

# Test Majorca Daily Bulletin
python3 majorca_bulletin_scraper.py
```

Each will create a JSON file with the results.

### Enable in Configuration

To add them to the unified scraper, edit `cinema_sources.json`:

```json
{
  "id": "cines_moix_negre",
  "enabled": true,  // Change this to true
  ...
}
```

---

## 🔧 Integration with Unified Scraper

To integrate these into the main scraping system:

### Option 1: Quick Integration (Recommended)

Edit `unified_scraper_db.py` to import and use these scrapers:

```python
# At the top with other imports
from moix_negre_scraper import CinesMoixNegreScraper
from majorca_bulletin_scraper import MajorcaDailyBulletinScraper

# In the scrape_all() method, add:
# Scrape Cines Moix Negre
if include_moix_negre:  # Add this parameter
    print("\n" + "-"*80)
    print("SCRAPING: Cines Moix Negre")
    print("-"*80)
    try:
        scraper = CinesMoixNegreScraper(headless=self.headless)
        movies = scraper.scrape()
        self.all_movies.extend(movies)
        print(f"✓ Moix Negre: {len(movies)} VOSE movies found")
    except Exception as e:
        print(f"✗ Moix Negre scraper failed: {e}")

# Scrape Majorca Daily Bulletin
if include_bulletin:  # Add this parameter
    print("\n" + "-"*80)
    print("SCRAPING: Majorca Daily Bulletin")
    print("-"*80)
    try:
        scraper = MajorcaDailyBulletinScraper(headless=self.headless)
        movies = scraper.scrape()
        self.all_movies.extend(movies)
        print(f"✓ Bulletin: {len(movies)} movie listings found")
    except Exception as e:
        print(f"✗ Bulletin scraper failed: {e}")
```

### Option 2: Future Enhancement

Create a dynamic scraper loader that reads from `cinema_sources.json` and automatically loads all enabled scrapers.

---

## 🎯 Key Features

### Cines Moix Negre
- ✅ Static URL (doesn't change)
- ✅ Real-time showtime data
- ✅ Handles cookie consent
- ⚠️ May need HTML selector updates if site changes

### Majorca Daily Bulletin
- ✅ **Dynamic URL handling** - No manual updates needed!
- ✅ Automatically finds latest article
- ✅ Covers multiple cinemas
- ✅ Weekly article discovery
- ⚠️ Relies on article text structure - may need adjustments if format changes

---

## 📊 Expected Output Format

Both scrapers return data in this format:

```json
{
  "title": "Movie Title",
  "link": "https://...",  // May be null for Bulletin
  "showtimes": [
    {"date": "2025-11-18", "time": "19:30"},
    {"date": "2025-11-18", "time": "21:45"}
  ],
  "cinema": "Cinema Name",
  "location": "City",
  "island": "Mallorca",
  "version": "VOSE",
  "raw_text": "...",
  "scraped_at": "2025-11-18T12:00:00"
}
```

This matches the format expected by the unified scraper and database service.

---

## 🐛 Troubleshooting

### Moix Negre Returns No Results

1. Check if URL is still correct: https://cinesmoixnegre.sacatuentrada.es/es/hoy
2. Visit the URL in a browser - does it show movies?
3. Check HTML class names - the site may have changed structure
4. Run with `headless=False` to see what the browser sees

### Bulletin Can't Find Article

1. Check that https://www.majorcadailybulletin.com/holiday/attractions.html exists
2. Look for the "Films in English" article manually - is it there?
3. Check the article title format - may need to update search patterns
4. The scraper will show which links it's checking

### No VOSE Movies Found

- Check the `is_vose()` function in `vose_markers.py`
- The cinema may use different terminology (VO, V.O., Original Version, etc.)
- Add new markers to `vose_markers.py` if needed

---

## 📝 Next Steps

1. **Test both scrapers individually** to verify they work
2. **Review the output JSON** to ensure data quality
3. **Integrate into unified_scraper_db.py** once confident
4. **Enable in cinema_sources.json** when ready for production
5. **Monitor first few runs** to catch any edge cases

---

## 🔮 Future Enhancements

Possible improvements:

- [ ] Add date range support (not just today) for Moix Negre
- [ ] Extract movie genres/ratings from Bulletin articles
- [ ] Add retry logic for failed article discovery
- [ ] Cache discovered article URLs for faster subsequent runs
- [ ] Add email notifications when Bulletin article updates
- [ ] Support multiple language versions (English/Spanish)

---

**Created:** 2025-11-18
**Status:** Ready for testing
**Maintainer:** VoseMovies Scraper Team
