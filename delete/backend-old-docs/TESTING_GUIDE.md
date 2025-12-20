# Testing Guide - Verify Scrapers & Data Quality

This guide shows you how to test the entire system locally to verify scrapers are pulling correct, reliable data.

## Prerequisites

Make sure you have:
- PostgreSQL installed and running
- Python dependencies installed
- ChromeDriver installed

## Test Flow

```
1. Set up database
2. Run scrapers (scrape live websites)
3. Check database has real data
4. Start API server
5. Test API endpoints
6. Verify data quality
```

## Step-by-Step Testing

### 1. Set Up Test Database

```bash
# Create database
sudo -u postgres psql << EOF
CREATE DATABASE vose_movies;
CREATE USER vose_user WITH PASSWORD 'vose_pass';
GRANT ALL PRIVILEGES ON DATABASE vose_movies TO vose_user;
\c vose_movies
GRANT ALL ON SCHEMA public TO vose_user;
\q
EOF

# Configure environment
cp api/.env.example api/.env

# Edit api/.env - make sure DATABASE_URL is correct
nano api/.env
```

**Verify `api/.env`**:
```env
DATABASE_URL=postgresql://vose_user:vose_pass@localhost:5432/vose_movies
```

### 2. Initialize Database Tables

```bash
python3 -c "from api.database.config import init_db; init_db()"

# Verify tables were created
psql -U vose_user -d vose_movies -c "\dt"
```

**Expected output**:
```
             List of relations
 Schema |     Name      | Type  |   Owner
--------+---------------+-------+-----------
 public | cinemas       | table | vose_user
 public | movies        | table | vose_user
 public | scraper_runs  | table | vose_user
 public | showtimes     | table | vose_user
```

### 3. Run Scrapers (Live Test!)

This will scrape the actual cinema websites right now:

```bash
cd scrapers

# Run with visible browser (recommended for first test)
python3 unified_scraper_db.py --headless=False

# Or run headless (no browser window)
python3 unified_scraper_db.py
```

**Watch for**:
- Browser opens (if not headless)
- CineCiutat website loads
- Aficine website loads
- Console shows progress

**Expected output**:
```
================================================================================
UNIFIED VOSE MOVIE SCRAPER FOR BALEARIC ISLANDS
Database Mode - Writing to PostgreSQL
================================================================================

--------------------------------------------------------------------------------
SCRAPING: CineCiutat (Palma)
--------------------------------------------------------------------------------
Initializing Chrome driver for CineCiutat...
Loading page: https://cineciutat.org/en/movies
Accepting cookie consent...
Extracting VOSE movies...
✓ CineCiutat: 8 VOSE movies found

--------------------------------------------------------------------------------
SCRAPING: Aficine (All Balearic Islands)
--------------------------------------------------------------------------------
Initializing Chrome driver for Aficine...
Loading VOSE billboard: https://aficine.com/en/billboard/original-version-v-o-s-e/
Found 12 movie links
Processing movie 1/12: Oppenheimer
Processing movie 2/12: The Holdovers
...
✓ Aficine: 45 VOSE movie entries found

→ Total scraped: 53 movie entries in 142.3s

================================================================================
SAVING TO DATABASE
================================================================================

→ Marking old showtimes as inactive...
✓ Marked 0 old showtimes as inactive

→ Processing 53 movie entries...

--------------------------------------------------------------------------------
DATABASE SAVE RESULTS
--------------------------------------------------------------------------------
Movies processed: 12
Cinemas processed: 7
Showtimes added: 53

✓ Logged scraper run: unified - success

================================================================================
✓ SCRAPING COMPLETE - DATA SAVED TO DATABASE
================================================================================
```

**If scraping fails**, see "Troubleshooting" section below.

### 4. Verify Data in Database

Now check that real data was saved:

```bash
psql -U vose_user -d vose_movies
```

**In PostgreSQL shell**:

```sql
-- Check how many movies were found
SELECT COUNT(*) as total_movies FROM movies;

-- See actual movie titles
SELECT id, title FROM movies LIMIT 10;

-- Check cinemas by island
SELECT name, location, island FROM cinemas ORDER BY island, name;

-- See today's showtimes (the real test!)
SELECT
    m.title,
    c.name as cinema,
    c.island,
    s.showtime_date,
    s.showtime_time,
    s.is_active
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN cinemas c ON s.cinema_id = c.id
WHERE s.is_active = true
ORDER BY s.showtime_date, s.showtime_time
LIMIT 20;

-- Check scraper run status
SELECT
    scraper_name,
    status,
    movies_found,
    showtimes_found,
    started_at,
    duration_seconds
FROM scraper_runs
ORDER BY started_at DESC;

-- Exit
\q
```

**What to look for**:
- ✅ Movie titles look correct (real movies currently playing)
- ✅ Cinema names are real (CineCiutat, Ocimax, Rívoli, etc.)
- ✅ Islands are correct (Mallorca, Menorca, Ibiza)
- ✅ Showtimes are realistic (18:00, 20:30, etc.)
- ✅ Dates are today or upcoming days

### 5. Start API Server

```bash
cd ../api
python3 main.py
```

**Expected output**:
```
🚀 Starting VOSE Movies API...
✅ Database initialized
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

API is now running at: **http://localhost:8000**

### 6. Test API Endpoints

Open another terminal and test:

#### Health Check
```bash
curl http://localhost:8000/health
```

**Expected**:
```json
{"status":"healthy","service":"vose-movies-api"}
```

#### Get Islands
```bash
curl http://localhost:8000/cinemas/islands
```

**Expected**:
```json
["Ibiza","Mallorca","Menorca"]
```

#### Today's Showtimes for Mallorca
```bash
curl "http://localhost:8000/showtimes/today?island=Mallorca" | json_pp
```

**Expected**: Array of real showtimes:
```json
[
  {
    "id": 1,
    "title": "Oppenheimer",
    "link": "https://cineciutat.org/en/movies/oppenheimer",
    "cinema_name": "CineCiutat",
    "cinema_location": "Palma de Mallorca",
    "island": "Mallorca",
    "showtime_date": "2025-10-30",
    "showtime_time": "18:00:00",
    "version": "VOSE",
    "scraped_at": "2025-10-30T10:30:00"
  },
  ...
]
```

#### Get All Movies
```bash
curl http://localhost:8000/movies/ | json_pp
```

#### Get Upcoming 7 Days
```bash
curl "http://localhost:8000/showtimes/upcoming?days=7&island=Mallorca" | json_pp
```

### 7. Test with Browser (Interactive Docs)

Open in browser: **http://localhost:8000/docs**

This is Swagger UI - you can test all endpoints interactively:

1. Click on an endpoint (e.g., `GET /showtimes/today`)
2. Click "Try it out"
3. Enter parameters (e.g., `island: Mallorca`)
4. Click "Execute"
5. See real response with actual data

**Try these**:
- `GET /cinemas/islands` - Should show Mallorca, Menorca, Ibiza
- `GET /showtimes/today?island=Mallorca` - Real showtimes
- `GET /movies/` - Real movie titles

## Data Quality Checks

### Check 1: Are Movies Real?

```bash
curl http://localhost:8000/movies/ | json_pp
```

✅ **Good**: Titles like "Oppenheimer", "The Holdovers", "Poor Things"
❌ **Bad**: Empty array, error messages, garbage data

### Check 2: Are Cinemas Correct?

```bash
curl http://localhost:8000/cinemas/ | json_pp
```

✅ **Good**: Real cinema names (CineCiutat, Ocimax, Rívoli)
❌ **Bad**: No cinemas, weird names

### Check 3: Are Showtimes Today or Future?

```bash
curl "http://localhost:8000/showtimes/today?island=Mallorca" | json_pp
```

✅ **Good**: Dates are today, times are realistic (18:00, 20:30)
❌ **Bad**: Old dates, weird times (25:99)

### Check 4: Do Links Work?

Pick a movie link from the API response and visit it in browser.

✅ **Good**: Link goes to actual movie page on cinema website
❌ **Bad**: 404 error, broken link

### Check 5: Multiple Islands Working?

```bash
# Mallorca
curl "http://localhost:8000/showtimes/today?island=Mallorca" | json_pp

# Menorca
curl "http://localhost:8000/showtimes/today?island=Menorca" | json_pp

# Ibiza
curl "http://localhost:8000/showtimes/today?island=Ibiza" | json_pp
```

✅ **Good**: All islands return data (if movies available)
❌ **Bad**: Some islands return empty

**Note**: It's normal if Menorca or Ibiza have fewer results - they have fewer cinemas.

## Troubleshooting

### Scraper fails with "403 Forbidden"

**Cause**: Website blocking automated requests

**Solution**: Already handled by Selenium with anti-detection. If still fails:
```bash
# Run in non-headless mode to see what's happening
cd scrapers
python3 unified_scraper_db.py --headless=False
```

### Scraper fails with "ChromeDriver not found"

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install chromium-chromedriver

# macOS
brew install chromedriver

# Verify
chromedriver --version
```

### No showtimes found

**Possible causes**:
1. Cinema websites are down (temporary)
2. No VOSE movies today (rare but possible)
3. Scraper selectors need updating (if cinema redesigned website)

**Debug**:
```bash
# Check scraper logs
psql -U vose_user -d vose_movies -c "SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 1;"

# Run scraper with visible browser
cd scrapers
python3 unified_scraper_db.py --headless=False
```

### Database connection fails

**Check PostgreSQL is running**:
```bash
sudo systemctl status postgresql

# If not running:
sudo systemctl start postgresql
```

**Test connection**:
```bash
psql -U vose_user -d vose_movies -h localhost
```

If fails, check `api/.env` has correct DATABASE_URL.

### API returns empty data

**Cause**: Scraper hasn't run yet

**Solution**:
```bash
cd scrapers
python3 unified_scraper_db.py
```

## Manual Data Verification

### Compare with Live Website

1. **Visit**: https://cineciutat.org/en/movies
2. **Check**: Are the movies in your database the same as on the website?
3. **Verify**: Do the showtimes match?

This is the ultimate test - your scrapers should return the same data you see on the cinema websites.

### Example Manual Check

**Website shows**:
- Movie: "Oppenheimer"
- Cinema: CineCiutat
- Time: 18:00, 20:30

**Your API should return**:
```json
{
  "title": "Oppenheimer",
  "cinema_name": "CineCiutat",
  "showtime_time": "18:00:00"
}
```

## Success Criteria

Your backend is working correctly if:

- [x] Scrapers run without errors
- [x] Database has real movie data
- [x] Movie titles are actual current movies
- [x] Cinema names are real (CineCiutat, Aficine locations)
- [x] Showtimes are today or upcoming days
- [x] Times are realistic (not 25:99 or similar)
- [x] API endpoints return data
- [x] Multiple islands return data
- [x] Data matches live cinema websites
- [x] Swagger docs work at /docs

## Automated Testing Script

Want to test everything at once?

```bash
#!/bin/bash
# test_backend.sh

echo "Testing VOSE Movies Backend..."

echo "1. Testing database connection..."
psql -U vose_user -d vose_movies -c "SELECT 1;" > /dev/null && echo "✓ Database OK" || echo "✗ Database failed"

echo "2. Testing API health..."
curl -s http://localhost:8000/health | grep "healthy" > /dev/null && echo "✓ API OK" || echo "✗ API failed"

echo "3. Testing data..."
COUNT=$(psql -U vose_user -d vose_movies -t -c "SELECT COUNT(*) FROM movies;")
echo "Movies in database: $COUNT"
[ "$COUNT" -gt 0 ] && echo "✓ Has data" || echo "✗ No data - run scraper"

echo "4. Testing endpoints..."
curl -s "http://localhost:8000/showtimes/today?island=Mallorca" | grep -q "title" && echo "✓ Showtimes endpoint OK" || echo "✗ Showtimes endpoint failed"

echo "Done!"
```

Save as `test_backend.sh`, make executable, and run:
```bash
chmod +x test_backend.sh
./test_backend.sh
```

## Next Steps After Successful Testing

Once all tests pass:

1. ✅ Backend works locally
2. **Deploy** to Railway or DigitalOcean (see DEPLOYMENT.md)
3. **Set up cron job** to run scrapers every 4 hours
4. **Update mobile app** to call your API
5. **Test mobile app** with real data
6. **Launch** to Google Play Store 🚀

---

**Remember**: The scrapers pull LIVE data from cinema websites, so you're testing with real, current movie showtimes!
