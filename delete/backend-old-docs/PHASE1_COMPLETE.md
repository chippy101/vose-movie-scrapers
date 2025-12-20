# Phase 1 Complete: FastAPI Backend ✅

## What We Built

You now have a complete **FastAPI backend with PostgreSQL** that serves VOSE movie showtimes to your React Native mobile app.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  React Native Mobile App                    │
│  /media/squareyes/Evo Plus 2a/AI/APPS/VOSEMovies-dev             │
│  (Your existing frontend)                   │
└──────────────┬──────────────────────────────┘
               │ HTTP REST API
               ▼
┌─────────────────────────────────────────────┐
│  FastAPI Backend (Port 8000)                │
│  - GET /showtimes (with filters)            │
│  - GET /movies                              │
│  - GET /cinemas                             │
│  - Auto-generated Swagger docs at /docs     │
└──────────────┬──────────────────────────────┘
               │ SQLAlchemy ORM
               ▼
┌─────────────────────────────────────────────┐
│  PostgreSQL Database                        │
│  - movies (title, link)                     │
│  - cinemas (name, location, island)         │
│  - showtimes (date, time, is_active)        │
│  - scraper_runs (monitoring/logging)        │
└──────────────▲──────────────────────────────┘
               │ Writes every 4-6 hours
               │
┌──────────────┴──────────────────────────────┐
│  Python Scrapers (Cron Job)                 │
│  - unified_scraper_db.py                    │
│  - cineciutat_scraper.py                    │
│  - aficine_scraper.py                       │
└──────────────┬──────────────────────────────┘
               │ Selenium + BeautifulSoup
               ▼
┌─────────────────────────────────────────────┐
│  Cinema Websites                            │
│  - https://cineciutat.org                   │
│  - https://aficine.com                      │
└─────────────────────────────────────────────┘
```

## What's Included

### 1. Database Layer
- **Location**: `api/database/`
- **Files**:
  - `config.py` - Database connection and session management
- **Models** (`api/models/`):
  - `movie.py` - Movie entity
  - `cinema.py` - Cinema entity
  - `showtime.py` - Showtime junction table
  - `scraper_run.py` - Scraper execution logging

### 2. API Layer
- **Location**: `api/`
- **Main**: `api/main.py` - FastAPI app with CORS
- **Routers** (`api/routers/`):
  - `showtimes.py` - Main endpoint for mobile app
    - `GET /showtimes/` - Filter by island, cinema, date
    - `GET /showtimes/today` - Today's showtimes
    - `GET /showtimes/upcoming?days=7` - Upcoming week
  - `movies.py` - Movie endpoints
    - `GET /movies/` - All movies
    - `GET /movies/{id}/showtimes` - Showtimes for a movie
  - `cinemas.py` - Cinema endpoints
    - `GET /cinemas/` - All cinemas
    - `GET /cinemas/islands` - List of islands

### 3. Business Logic
- **Location**: `api/services/`
- **Files**:
  - `scraper_service.py` - Handles scraper → database operations
    - `get_or_create_movie()` - Deduplication
    - `get_or_create_cinema()` - Deduplication
    - `process_scraped_data()` - Bulk insert from scrapers
    - `mark_old_showtimes_inactive()` - Data cleanup

### 4. Data Validation
- **Location**: `api/schemas/`
- **Files**:
  - `movie.py` - Movie Pydantic schemas
  - `cinema.py` - Cinema Pydantic schemas
  - `showtime.py` - Showtime Pydantic schemas
- Automatic request/response validation

### 5. Modified Scrapers
- **Location**: `scrapers/`
- **New File**: `unified_scraper_db.py`
  - Runs CineCiutat + Aficine scrapers
  - Writes to PostgreSQL instead of JSON
  - Logs execution to `scraper_runs` table
  - Marks old showtimes as inactive

### 6. Documentation
- `BACKEND_SETUP.md` - Step-by-step setup guide
- `DEPLOYMENT.md` - Railway and DigitalOcean deployment
- `DATABASE_SCHEMA.md` - Database design and queries
- `setup_backend.sh` - Automated setup script

## Key Features

✅ **RESTful API** with FastAPI
✅ **PostgreSQL database** with proper schema
✅ **Automatic API docs** at `/docs` (Swagger UI)
✅ **Data deduplication** (no duplicate movies/cinemas)
✅ **Inactive showtime cleanup** (old dates marked inactive)
✅ **Scraper monitoring** (logs execution stats)
✅ **CORS enabled** for mobile app
✅ **Filtering** by island, cinema, date
✅ **Pagination** support
✅ **Error handling** and logging

## Quick Start

### 1. Install Dependencies
```bash
pip install -r api/requirements.txt
pip install -r requirements.txt
```

### 2. Set Up Database
```bash
# Create PostgreSQL database
sudo -u postgres psql -c "CREATE DATABASE vose_movies;"
sudo -u postgres psql -c "CREATE USER vose_user WITH PASSWORD 'vose_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vose_movies TO vose_user;"

# Initialize tables
python -c "from api.database.config import init_db; init_db()"
```

### 3. Configure Environment
```bash
cp api/.env.example api/.env
# Edit api/.env with your database credentials
```

### 4. Run Initial Scrape
```bash
cd scrapers
python unified_scraper_db.py
```

### 5. Start API Server
```bash
cd api
python main.py
```

API running at: **http://localhost:8000**

API docs: **http://localhost:8000/docs**

## Example API Calls

### Get Today's Showtimes for Mallorca
```bash
curl "http://localhost:8000/showtimes/today?island=Mallorca"
```

**Response**:
```json
[
  {
    "id": 1,
    "title": "Oppenheimer",
    "link": "https://cineciutat.org/movies/oppenheimer",
    "cinema_name": "CineCiutat",
    "cinema_location": "Palma de Mallorca",
    "island": "Mallorca",
    "showtime_date": "2025-10-30",
    "showtime_time": "18:00:00",
    "version": "VOSE",
    "scraped_at": "2025-10-30T10:00:00"
  }
]
```

### Get All Islands
```bash
curl "http://localhost:8000/cinemas/islands"
```

**Response**:
```json
["Ibiza", "Mallorca", "Menorca"]
```

### Get Upcoming Week
```bash
curl "http://localhost:8000/showtimes/upcoming?days=7&island=Mallorca"
```

## Cost Analysis

### Traditional Scrapers (Your Choice ✅)
- **Development**: $0 (existing Python code)
- **Hosting**: $5-10/month (Railway/DigitalOcean)
- **Database**: Included
- **Monthly Cost**: **$5-10/month**
- **Per User**: $0 (fixed cost)
- **Scalability**: Unlimited users with cached data

### AI Agents Alternative (Not Chosen)
- **Development**: High complexity
- **API Calls**: $0.10-1.00 per scrape
- **Frequency**: Every user interaction or periodic
- **Monthly Cost**: **$100-1000+/month**
- **Per User**: $1-10/month depending on usage
- **Scalability**: Cost increases linearly with users

**You made the right choice!** 🎉

## Next Steps (Phase 2)

### Mobile App Integration

Update your React Native app at `/media/squareyes/Evo Plus 2a/AI/APPS/VOSEMovies-dev`:

1. **Create API client** (`src/services/api.ts`):
```typescript
const API_BASE_URL = 'http://localhost:8000';  // or your deployed URL

export async function getTodayShowtimes(island?: string) {
  const params = island ? `?island=${island}` : '';
  const response = await fetch(`${API_BASE_URL}/showtimes/today${params}`);
  return response.json();
}

export async function getUpcomingShowtimes(days = 7, island?: string) {
  const params = new URLSearchParams({ days: String(days) });
  if (island) params.append('island', island);
  const response = await fetch(`${API_BASE_URL}/showtimes/upcoming?${params}`);
  return response.json();
}

export async function getIslands() {
  const response = await fetch(`${API_BASE_URL}/cinemas/islands`);
  return response.json();
}
```

2. **Update screens to fetch from API** instead of scraping directly

3. **Add loading states and error handling**

4. **Test with local API** (`http://localhost:8000`)

5. **Deploy backend** (see DEPLOYMENT.md)

6. **Update API URL** in mobile app to production URL

7. **Test mobile app** with production API

8. **Publish to Google Play Store**

## Deployment Recommendations

### For Testing/Development
- **Railway Free Tier** - $0/month, 500 hours
- Quick setup, GitHub integration
- Good for testing

### For Production
- **DigitalOcean Droplet** - $6/month
- Full control, native cron jobs
- Better for 24/7 operation
- Recommended!

See `DEPLOYMENT.md` for detailed instructions.

## Monitoring

### Check Scraper Runs
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

### Check Active Showtimes
```sql
SELECT COUNT(*) FROM showtimes WHERE is_active = true;
```

### API Health Check
```bash
curl http://localhost:8000/health
```

## File Structure Summary

```
vose-movies-scrapers/
├── api/
│   ├── database/
│   │   └── config.py                 # Database connection
│   ├── models/                       # SQLAlchemy models
│   │   ├── movie.py
│   │   ├── cinema.py
│   │   ├── showtime.py
│   │   └── scraper_run.py
│   ├── routers/                      # API endpoints
│   │   ├── movies.py
│   │   ├── cinemas.py
│   │   └── showtimes.py
│   ├── schemas/                      # Pydantic validation
│   │   ├── movie.py
│   │   ├── cinema.py
│   │   └── showtime.py
│   ├── services/                     # Business logic
│   │   └── scraper_service.py
│   ├── main.py                       # FastAPI app
│   ├── requirements.txt              # API dependencies
│   └── .env.example                  # Environment template
├── scrapers/
│   ├── cineciutat_scraper.py        # Original scraper
│   ├── aficine_scraper.py           # Original scraper
│   ├── unified_scraper.py           # Original JSON scraper
│   └── unified_scraper_db.py        # NEW: Database scraper
├── BACKEND_SETUP.md                  # Setup instructions
├── DEPLOYMENT.md                     # Deployment guide
├── DATABASE_SCHEMA.md                # Database design
├── setup_backend.sh                  # Automated setup
└── PHASE1_COMPLETE.md               # This file
```

## Success Criteria ✅

- [x] FastAPI backend created
- [x] PostgreSQL database schema designed
- [x] SQLAlchemy models implemented
- [x] REST API endpoints working
- [x] Scrapers writing to database
- [x] Data deduplication working
- [x] Automatic cleanup of old showtimes
- [x] API documentation auto-generated
- [x] CORS configured for mobile app
- [x] Setup and deployment guides written

## Questions?

1. Test the API locally: `http://localhost:8000/docs`
2. Run a test scrape: `cd scrapers && python unified_scraper_db.py`
3. Check the database: `psql -U vose_user -d vose_movies`
4. Read the guides: `BACKEND_SETUP.md`, `DEPLOYMENT.md`

**Phase 1 is complete!** 🚀 Ready for mobile app integration and deployment.
