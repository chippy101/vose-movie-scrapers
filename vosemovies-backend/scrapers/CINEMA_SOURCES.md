# Cinema Sources Configuration Guide

## Overview

Cinema sources are now centrally managed in `cinema_sources.json`. This makes it easy to:
- Add new cinema sources
- Update URLs when cinema websites change
- Enable/disable scrapers without code changes
- Track which cinemas are being scraped

## Quick Start

### View Current Configuration

```bash
cd scrapers
python3 cinema_config.py
```

This shows all configured cinemas, their URLs, and status (enabled/disabled).

### Add a New Cinema

Edit `cinema_sources.json` and add a new entry to the `cinemas` array:

```json
{
  "id": "my_cinema",
  "name": "My Cinema Name",
  "location": "City Name",
  "island": "Mallorca",
  "url": "https://mycinema.com/showtimes",
  "scraper_class": "MyCinemaScraper",
  "scraper_file": "my_cinema_scraper.py",
  "enabled": false,
  "notes": "TODO: Create scraper for this cinema"
}
```

### Update a Cinema URL

Simply edit the `url` field in `cinema_sources.json`:

```json
{
  "id": "cineciutat",
  "url": "https://cineciutat.org/en/NEW-PATH-HERE",
  ...
}
```

### Enable/Disable a Cinema

Change the `enabled` field:

```json
{
  "id": "cines_moix_negre",
  "enabled": true,  // Change to true to enable
  ...
}
```

## Currently Configured Cinemas

### ✅ Enabled (Active)

1. **CineCiutat** - Palma de Mallorca
   - URL: https://cineciutat.org/en/movies
   - Scraper: `cineciutat_scraper.py`
   - Status: Fully functional

2. **Aficine** - Multiple locations across all islands
   - URL: https://aficine.com/en/billboard/original-version-v-o-s-e/
   - Scraper: `aficine_scraper.py`
   - Status: Fully functional

### ❌ Disabled (Pending Implementation)

3. **Cines Moix Negre** - Mallorca
   - URL: https://cinesmoixnegre.sacatuentrada.es/es/hoy
   - Scraper: TODO - Needs to be created
   - Platform: sacatuentrada.es
   - Notes: This cinema uses a ticketing platform, may need different scraping approach

4. **Majorca Daily Bulletin** - Mallorca-wide listings
   - URL: https://www.majorcadailybulletin.com/holiday/attractions.html
   - Scraper: TODO - Needs to be created
   - Path: Holiday → Attractions → Films in English across Mallorca
   - Notes: Aggregated listings from multiple cinemas

## Configuration File Structure

### Cinema Entry Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `id` | Yes | Unique identifier (lowercase, underscores) | `"cineciutat"` |
| `name` | Yes | Human-readable cinema name | `"CineCiutat"` |
| `location` | Yes | City/area name | `"Palma de Mallorca"` |
| `island` | Yes | Island name | `"Mallorca"`, `"Menorca"`, `"Ibiza"`, `"Formentera"` |
| `url` | Yes | Main URL to scrape | `"https://..."` |
| `scraper_class` | Yes | Python class name for scraper | `"CineCiutatScraper"` |
| `scraper_file` | Yes | Python file containing scraper | `"cineciutat_scraper.py"` |
| `enabled` | Yes | Whether to use this scraper | `true` or `false` |
| `notes` | No | Additional information | Any string |

### Global Settings

The `scraper_settings` section contains defaults used by all scrapers:

```json
"scraper_settings": {
  "user_agent": "Mozilla/5.0 ...",
  "request_delay_seconds": 2,
  "max_retries": 3,
  "timeout_seconds": 30,
  "headless": true
}
```

## Creating a New Scraper

### Step 1: Add to Configuration

Add the cinema to `cinema_sources.json` with `enabled: false`

### Step 2: Create Scraper File

Create a new Python file (e.g., `my_cinema_scraper.py`):

```python
#!/usr/bin/env python3
"""
My Cinema Scraper
Scrapes VOSE movies from My Cinema
"""
from selenium import webdriver
from typing import List, Dict
from datetime import datetime

class MyCinemaScraper:
    def __init__(self, headless: bool = True):
        self.base_url = "https://mycinema.com"
        self.headless = headless
        self.driver = None

    def scrape(self) -> List[Dict]:
        """Main scraping method - returns list of movies"""
        movies = []
        # Your scraping logic here
        return movies
```

### Step 3: Add to Unified Scraper

Edit `unified_scraper_db.py` to import and use your new scraper:

```python
from my_cinema_scraper import MyCinemaScraper

# In scrape_all method:
if include_my_cinema:
    scraper = MyCinemaScraper(headless=self.headless)
    movies = scraper.scrape()
    self.all_movies.extend(movies)
```

### Step 4: Test

```bash
cd vosemovies-backend
./run-scrapers.sh
```

### Step 5: Enable

Once working, set `enabled: true` in `cinema_sources.json`

## Common Tasks

### Update All Cinema URLs at Once

Edit `cinema_sources.json` and update the `url` fields as needed. No code changes required!

### Temporarily Disable a Cinema

Set `enabled: false` for that cinema in the JSON file.

### Add Notes/Documentation

Use the `notes` field to document anything important about a cinema source.

### Check Which Scrapers Are Running

```bash
cd scrapers
python3 cinema_config.py
```

Look for entries marked "✓ ENABLED"

## Integration with Code

### Load Configuration in Python

```python
from cinema_config import load_cinema_config

config = load_cinema_config()

# Get all enabled cinemas
enabled = config.get_enabled_cinemas()

# Get specific cinema URL
url = config.get_cinema_url("cineciutat")

# Check if cinema is enabled
if config.is_cinema_enabled("aficine"):
    # Run scraper
    pass
```

### Programmatically Update Configuration

```python
from cinema_config import load_cinema_config

config = load_cinema_config()

# Enable a cinema
config.enable_cinema("cines_moix_negre")

# Update cinema URL
config.update_cinema("cineciutat", {
    "url": "https://new-url.com"
})

# Add new cinema
config.add_cinema({
    "id": "new_cinema",
    "name": "New Cinema",
    "location": "Palma",
    "island": "Mallorca",
    "url": "https://newcinema.com",
    "scraper_class": "NewCinemaScraper",
    "scraper_file": "new_cinema_scraper.py",
    "enabled": false
})
```

## Troubleshooting

### Cinema URL Changed

1. Find the cinema in `cinema_sources.json`
2. Update the `url` field
3. Save the file
4. Run scrapers again: `./run-scrapers.sh`

### Scraper Returning No Results

1. Check if cinema is enabled: `python3 cinema_config.py`
2. Verify URL is correct (visit it in a browser)
3. Check scraper logs for errors
4. Website HTML structure may have changed - scraper needs updating

### Adding a Cinema Without a Scraper Yet

Add it with `enabled: false` and a note in the `notes` field explaining what needs to be done.

## Future Enhancements

Potential improvements to the configuration system:

- [ ] Web UI for managing cinema sources
- [ ] Automatic URL health checks
- [ ] Scraper success/failure statistics per cinema
- [ ] Auto-discovery of new cinemas
- [ ] Email alerts when URLs change/break
- [ ] A/B testing different scraping strategies per cinema

---

**Last Updated:** 2025-11-18
**Maintainer:** VoseMovies Backend Team
