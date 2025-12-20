# FastAPI Backend Setup Guide

## Overview

This backend provides a REST API for VOSE movie showtimes in the Balearic Islands. It consists of:

1. **FastAPI REST API** - Serves cached movie data to mobile app
2. **PostgreSQL Database** - Stores movies, cinemas, and showtimes
3. **Python Scrapers** - Scrape cinema websites every 2-6 hours

## Architecture

```
Mobile App (React Native)
    ↓ HTTP Requests
FastAPI Backend (api/)
    ↓ SQLAlchemy ORM
PostgreSQL Database
    ↑ Writes data
Python Scrapers (scrapers/)
    ↑ Scrapes
Cinema Websites
```

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- ChromeDriver (for scrapers)

## Step 1: Install PostgreSQL

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

### Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE vose_movies;
CREATE USER vose_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE vose_movies TO vose_user;

# Grant schema privileges (PostgreSQL 15+)
\c vose_movies
GRANT ALL ON SCHEMA public TO vose_user;

\q
```

## Step 2: Install Python Dependencies

```bash
# Install API dependencies
pip install -r api/requirements.txt

# Install scraper dependencies (if not already installed)
pip install -r requirements.txt

# Install ChromeDriver for scrapers
sudo apt install chromium-chromedriver  # Ubuntu
brew install chromedriver              # macOS
```

## Step 3: Configure Environment

```bash
# Copy example environment file
cp api/.env.example api/.env

# Edit api/.env with your database credentials
nano api/.env
```

**api/.env**:
```env
DATABASE_URL=postgresql://vose_user:your_secure_password@localhost:5432/vose_movies
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
SCRAPER_HEADLESS=True
SCRAPER_INTERVAL_HOURS=4
```

## Step 4: Initialize Database

```bash
# Run from project root
python -c "from api.database.config import init_db; init_db()"

# Verify tables were created
psql -U vose_user -d vose_movies -c "\dt"
```

Expected output:
```
             List of relations
 Schema |     Name      | Type  |   Owner
--------+---------------+-------+-----------
 public | cinemas       | table | vose_user
 public | movies        | table | vose_user
 public | scraper_runs  | table | vose_user
 public | showtimes     | table | vose_user
```

## Step 5: Test Scraper → Database Flow

```bash
# Run the database-integrated scraper
cd scrapers
python unified_scraper_db.py

# Expected output:
# ✓ CineCiutat: X VOSE movies found
# ✓ Aficine: Y VOSE movie entries found
# ✓ Marked Z old showtimes as inactive
# Movies processed: X
# Cinemas processed: Y
# Showtimes added: Z
```

Verify data in database:
```bash
psql -U vose_user -d vose_movies

-- Check movies
SELECT COUNT(*) FROM movies;

-- Check cinemas
SELECT name, island FROM cinemas;

-- Check active showtimes
SELECT
    m.title,
    c.name as cinema,
    s.showtime_date,
    s.showtime_time
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN cinemas c ON s.cinema_id = c.id
WHERE s.is_active = true
ORDER BY s.showtime_date, s.showtime_time
LIMIT 10;
```

## Step 6: Start FastAPI Server

```bash
# From project root
cd api
python main.py

# Or use uvicorn directly
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Server should start at: **http://localhost:8000**

## Step 7: Test API Endpoints

### In Browser

1. **API Documentation**: http://localhost:8000/docs
2. **Health Check**: http://localhost:8000/health
3. **Get Islands**: http://localhost:8000/cinemas/islands
4. **Today's Showtimes**: http://localhost:8000/showtimes/today

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Get all islands
curl http://localhost:8000/cinemas/islands

# Get all cinemas
curl http://localhost:8000/cinemas/

# Get today's showtimes for Mallorca
curl "http://localhost:8000/showtimes/today?island=Mallorca"

# Get all showtimes (paginated)
curl "http://localhost:8000/showtimes/?limit=20"

# Get upcoming showtimes for next 7 days
curl "http://localhost:8000/showtimes/upcoming?days=7&island=Mallorca"

# Get specific movie showtimes
curl http://localhost:8000/movies/1/showtimes
```

## Step 8: Set Up Automated Scraping

### Option A: Cron Job (Linux/macOS)

```bash
# Edit crontab
crontab -e

# Add this line to run every 4 hours
0 */4 * * * cd /path/to/vose-movies-scrapers/scrapers && /usr/bin/python3 unified_scraper_db.py >> /tmp/vose_scraper.log 2>&1

# Or every 6 hours at specific times (6am, 12pm, 6pm, 12am)
0 6,12,18,0 * * * cd /path/to/vose-movies-scrapers/scrapers && /usr/bin/python3 unified_scraper_db.py >> /tmp/vose_scraper.log 2>&1
```

### Option B: systemd Timer (Linux)

Create `/etc/systemd/system/vose-scraper.service`:
```ini
[Unit]
Description=VOSE Movies Scraper
After=network.target postgresql.service

[Service]
Type=oneshot
User=your_username
WorkingDirectory=/path/to/vose-movies-scrapers/scrapers
ExecStart=/usr/bin/python3 unified_scraper_db.py
StandardOutput=journal
StandardError=journal
```

Create `/etc/systemd/system/vose-scraper.timer`:
```ini
[Unit]
Description=Run VOSE Scraper every 4 hours

[Timer]
OnBootSec=5min
OnUnitActiveSec=4h
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable vose-scraper.timer
sudo systemctl start vose-scraper.timer
sudo systemctl status vose-scraper.timer
```

## API Endpoints Reference

### Showtimes (Main Endpoints)

- `GET /showtimes/` - Get all active showtimes with filters
  - Query params: `island`, `cinema_id`, `showtime_date`, `from_date`, `skip`, `limit`
- `GET /showtimes/today` - Today's showtimes only
  - Query params: `island`, `cinema_id`
- `GET /showtimes/upcoming?days=7` - Upcoming showtimes
  - Query params: `days`, `island`, `cinema_id`

### Movies

- `GET /movies/` - Get all movies
- `GET /movies/{id}` - Get specific movie
- `GET /movies/{id}/showtimes` - Get showtimes for a movie

### Cinemas

- `GET /cinemas/` - Get all cinemas
  - Query params: `island`, `skip`, `limit`
- `GET /cinemas/islands` - Get list of islands
- `GET /cinemas/{id}` - Get specific cinema

### System

- `GET /` - API info
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /redoc` - Alternative API documentation

## Database Maintenance

### Clean up old showtimes

```sql
-- Manually mark old showtimes as inactive
UPDATE showtimes SET is_active = false WHERE showtime_date < CURRENT_DATE;

-- Delete very old inactive showtimes (older than 30 days)
DELETE FROM showtimes WHERE is_active = false AND showtime_date < CURRENT_DATE - INTERVAL '30 days';
```

### View scraper run history

```sql
SELECT
    scraper_name,
    status,
    movies_found,
    showtimes_found,
    started_at,
    duration_seconds
FROM scraper_runs
ORDER BY started_at DESC
LIMIT 10;
```

## Troubleshooting

### Database connection errors

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U vose_user -d vose_movies -h localhost

# Check DATABASE_URL in api/.env
cat api/.env | grep DATABASE_URL
```

### Scraper fails

```bash
# Check ChromeDriver is installed
chromedriver --version

# Run scraper in non-headless mode to see browser
cd scrapers
python unified_scraper_db.py --headless=False

# Check scraper logs
psql -U vose_user -d vose_movies -c "SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 5;"
```

### API not accessible from mobile app

```bash
# Check CORS settings in api/.env
cat api/.env | grep CORS_ORIGINS

# Add your mobile app's development server URL
CORS_ORIGINS=http://localhost:19006,exp://192.168.1.x:8081

# Restart API server
```

## Next Steps

1. **Connect Mobile App**: Update your React Native app's API base URL to `http://your-server-ip:8000`
2. **Deploy**: See DEPLOYMENT.md for Railway or DigitalOcean deployment
3. **Monitor**: Set up logging and monitoring for production

## Security Notes for Production

1. Change default database password
2. Use environment variables for secrets (never commit `.env`)
3. Enable SSL/HTTPS for API
4. Restrict CORS origins to your mobile app's domain
5. Add rate limiting to API endpoints
6. Use a reverse proxy (nginx) in production
