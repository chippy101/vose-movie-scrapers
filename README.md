# VOSE Movies Scrapers - Balearic Islands

Web scrapers for finding **VOSE** (Versión Original Subtitulada en Español - Original Version with Spanish Subtitles) movie showtimes across the Balearic Islands (Mallorca, Menorca, Ibiza).

## 🎯 Overview

This project provides Python scrapers to extract VOSE movie showtimes from cinema websites in the Balearic Islands:

- **CineCiutat** (Palma de Mallorca) - Simple, dedicated VOSE cinema
- **Aficine** (All Balearic Islands) - Multi-cinema chain covering Mallorca, Menorca, and Ibiza

**Coverage**: ~95-98% of all VOSE movies in the Balearics

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install ChromeDriver

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install chromium-chromedriver
```

**macOS**:
```bash
brew install chromedriver
```

**Verify**:
```bash
chromedriver --version
```

### 3. Run Scrapers

```bash
cd scrapers

# Run all scrapers (recommended)
python unified_scraper.py

# Run individual scrapers
python cineciutat_scraper.py  # Palma only
python aficine_scraper.py     # All islands
```

## 📁 Project Structure

```
vose-movies-scrapers/
├── scrapers/
│   ├── cineciutat_scraper.py     # CineCiutat (Palma)
│   ├── aficine_scraper.py        # Aficine (all islands)
│   └── unified_scraper.py        # Combined scraper
├── data/
│   └── cinema/                   # Output directory
├── requirements.txt              # Python dependencies
├── README.md                     # This file
└── ANALYSIS.md                   # Detailed technical analysis
```

## 🏛️ Cinema Sources

### CineCiutat (PRIMARY)
- **URL**: https://cineciutat.org/en/movies
- **Coverage**: Palma de Mallorca
- **Best for**: Quick testing, ~90% of Palma VOSE movies
- **Run time**: ~30 seconds

### Aficine (COMPLETE COVERAGE)
- **URL**: https://aficine.com/en/billboard/original-version-v-o-s-e/
- **Coverage**: ALL Balearic Islands
  - Mallorca: Ocimax Palma, Rívoli, Augusta, Manacor
  - Menorca: Multiple locations
  - Ibiza: Multiple locations
- **Best for**: Complete island coverage
- **Run time**: 2-5 minutes (visits each movie page)

## 📊 Output

Results saved to `data/cinema/`:

### JSON Files
- `vose_latest.json` - Latest scraping results
- `vose_all_YYYYMMDD_HHMMSS.json` - Timestamped backup
- `cineciutat_vose.json` - CineCiutat specific
- `aficine_vose.json` - Aficine specific

### HTML Report
- `vose_report_YYYYMMDD_HHMMSS.html` - Human-readable report grouped by island

### JSON Structure
```json
[
  {
    "title": "Oppenheimer",
    "cinema": "CineCiutat",
    "location": "Palma de Mallorca",
    "island": "Mallorca",
    "version": "VOSE",
    "showtimes": ["18:00", "20:30", "23:00"],
    "link": "https://cineciutat.org/en/movies/oppenheimer",
    "scraped_at": "2025-10-28T14:30:00"
  }
]
```

## 🔧 Usage Options

### Unified Scraper

```bash
# Run all scrapers
python unified_scraper.py

# Run only CineCiutat
python unified_scraper.py --cineciutat

# Run only Aficine
python unified_scraper.py --aficine

# Custom output directory
python unified_scraper.py --output /path/to/output

# Show browser window (non-headless)
python unified_scraper.py --headless=False
```

### Individual Scrapers

```bash
# CineCiutat (fastest, Palma only)
python cineciutat_scraper.py

# Aficine (slower, complete coverage)
python aficine_scraper.py
```

## 🔍 How It Works

### Anti-Bot Protection
All cinema sites have anti-bot measures (403 Forbidden on direct requests). Solution:
- **Selenium WebDriver** with anti-detection settings
- Realistic browser headers
- Cookie wall handling
- Disabled automation flags

### Scraping Flow

**CineCiutat**:
1. Load movies page
2. Accept cookie consent
3. Parse VOSE movie containers
4. Extract titles, showtimes, links

**Aficine**:
1. Load VOSE billboard page
2. Handle cookie wall
3. Extract movie links (10-20 movies)
4. Visit each movie page individually
5. Extract showtimes grouped by cinema
6. Determine island from cinema name

## 🐛 Troubleshooting

### "Error initializing Chrome driver"

**Solution**: Install ChromeDriver
```bash
sudo apt-get install chromium-chromedriver  # Ubuntu
brew install chromedriver                   # macOS
```

### "403 Forbidden" or "Access Denied"

**Cause**: Site blocking automated requests

**Solution**: Use Selenium scrapers (not simple HTTP requests)

### No movies found

**Debug**:
1. Check HTML files in `/tmp/`:
   - `/tmp/cineciutat_raw.html`
   - `/tmp/aficine_vose_page.html`
2. Check screenshot: `/tmp/cineciutat_screenshot.png`
3. Run in non-headless mode:
   ```python
   scraper = CineCiutatScraper(headless=False)
   ```

### Slow scraping

**Expected**: Aficine visits each movie page with 2-second delays (polite scraping)

## 📈 Scheduling (Optional)

### Linux/macOS (Cron)
```bash
# Daily at 10 AM
0 10 * * * cd /path/to/vose-movies-scrapers/scrapers && python unified_scraper.py
```

### Windows (Task Scheduler)
Create a task to run `unified_scraper.py` daily at 10:00 AM

## 🔮 Future Enhancements

- [ ] Database storage (SQLite/PostgreSQL)
- [ ] Web API (Flask/FastAPI)
- [ ] Change detection & notifications
- [ ] Mobile app frontend
- [ ] Additional cinema sources (if needed)
- [ ] Mainland Spain coverage (Barcelona, Valencia)

## 📚 Documentation

- **README.md** (this file) - Quick start and usage
- **ANALYSIS.md** - Detailed technical analysis, architecture, challenges

## 🎬 Cinema Coverage

| Cinema | Location | Island | Scraper |
|--------|----------|--------|---------|
| CineCiutat | Palma | Mallorca | cineciutat_scraper.py |
| Aficine Ocimax | Palma | Mallorca | aficine_scraper.py |
| Aficine Rívoli | Palma | Mallorca | aficine_scraper.py |
| Aficine Augusta | Mallorca | Mallorca | aficine_scraper.py |
| Aficine Manacor | Manacor | Mallorca | aficine_scraper.py |
| Aficine | Various | Menorca | aficine_scraper.py |
| Aficine | Various | Ibiza | aficine_scraper.py |

**Total**: 7+ cinema locations across 3 islands

## 💡 Tips

1. **Start with CineCiutat** - Faster, good for testing setup
2. **Use unified scraper** - Gets everything in one run
3. **Check HTML reports** - Easier to read than JSON
4. **Schedule daily** - Automated updates via cron/Task Scheduler

## 🛠️ Technical Stack

- **Python 3.8+**
- **Selenium** - Browser automation
- **BeautifulSoup4** - HTML parsing
- **ChromeDriver** - Headless Chrome browser

## 📄 License

Free and open source. Use for personal, educational, or commercial purposes.

## 🤝 Contributing

Contributions welcome! Ideas:
- Additional cinema sources
- Improved selectors (if sites change)
- New features (filters, notifications, etc.)

## ⚠️ Disclaimer

This project is for educational purposes. Respect cinema websites' terms of service. Use reasonable scraping intervals (2-3 second delays) to avoid server overload.

---

**Version**: 1.0
**Last Updated**: 2025-10-28
**Status**: Production Ready ✅
