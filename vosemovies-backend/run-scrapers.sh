#!/bin/bash
# VOSE Movies Scraper Script

echo "🎬 Running VOSE Movies Scrapers..."
echo "=================================="

# Check if in correct directory
if [ ! -f "scrapers/unified_scraper_db.py" ]; then
    echo "❌ Error: Must run from vosemovies-backend directory"
    exit 1
fi

# Activate virtual environment
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    exit 1
fi

source venv/bin/activate

# Run scrapers
echo "✓ Starting unified scraper..."
echo ""
PYTHONPATH=. python3 scrapers/unified_scraper_db.py

# Fetch TMDB metadata for movies without it
echo ""
echo "=================================="
echo "✓ Fetching TMDB metadata (posters, ratings, cast, etc.)..."
echo ""
PYTHONPATH=. python3 scrapers/fetch_movie_metadata.py

echo ""
echo "=================================="
echo "✓ Scraping complete!"
echo ""
echo "Verify data with:"
echo "  curl http://localhost:8000/showtimes/today | python3 -m json.tool"
