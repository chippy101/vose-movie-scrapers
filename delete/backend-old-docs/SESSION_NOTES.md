# Session Notes - VOSE Movies Scrapers

> **Last Updated**: 2025-11-10
> **Status**: Active Development
> **Current Phase**: Backend + Frontend Integration Complete

**📖 See [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) for detailed server startup instructions**

---

## 🎯 Current State

### Backend Server
- **Status**: ✅ RUNNING on http://localhost:8000
- **Process**: Background task (uvicorn with auto-reload)
- **Database**: PostgreSQL - vose_movies
- **API Docs**: http://localhost:8000/docs

### Frontend
- **Status**: ✅ RUNNING on http://localhost:8081 (separate terminal)
- **Framework**: React Native / Expo

### Recent Commits (Pushed to GitHub)
```
1892a97 - Remove api/.env from version control
44d1ee8 - Update .gitignore and environment templates for security
9f9f74c - Add TMDB integration for movie metadata
a6ff5f0 - Add frontend changes documentation
d16e7a1 - Phase 1 Complete: Backend API + Stealth Scrapers
```

---

## 📋 What Was Just Completed

### 1. TMDB Integration (✅ Complete)
- Added TMDB metadata fields to Movie model
  - `tmdb_id`, `poster_url`, `backdrop_url`, `overview`, `rating`
  - `release_year`, `runtime`, `genres`, `certification`
- Created `api/services/tmdb_service.py` for API integration
- Updated API endpoints to return TMDB metadata in responses
- Created `scrapers/fetch_movie_metadata.py` for backfilling existing movies

**Files Modified**:
- `api/models/movie.py` - Added TMDB columns
- `api/routers/showtimes.py` - Include metadata in queries
- `api/schemas/showtime.py` - MovieShowtimeResponse schema extended
- `api/services/tmdb_service.py` - NEW: TMDB API service
- `scrapers/fetch_movie_metadata.py` - NEW: Backfill script

### 2. Security Improvements (✅ Complete)
- Removed `api/.env` from version control (contained credentials)
- Updated `.gitignore` to prevent future sensitive file commits
  - Blocks: `.env`, `*token*`, `.expo/`, secrets
- Created `.env.example` templates with TMDB_API_KEY placeholder
- Added `requests` library to requirements.txt

### 3. Scraper Improvements (✅ Complete)
- Aficine scraper now uses cinema ID mapping for accurate cinema names
- Deduplicates showtimes while preserving order

### 4. Multi-Day Scraping (✅ Complete - 2025-11-09)
- **Aficine scraper** extracts dates from HTML title attributes
  - Parses "día DD-MM-YYYY a las HH:MM" format
  - Converts to ISO format: `{"date": "2025-11-09", "time": "18:00"}`
  - Deduplicates based on date+time combination
- **CineCiutat scraper** uses same date/time object format
  - Falls back to today's date if no date in HTML
- **Scraper service** handles new format
  - Parses date from `YYYY-MM-DD` string
  - Backward compatible with old time-only format
  - Automatically uses actual dates instead of hardcoded today()

**Verification Results**:
- Database now contains showtimes across 3 weeks:
  - Nov 9 (today): 8 showtimes
  - Nov 14: 4 showtimes
  - Nov 21: 3 showtimes
- API returns multi-day data correctly with TMDB metadata
- Natural 2-3 week limit based on cinema website availability

**Files Modified**:
- `scrapers/aficine_scraper.py` - Date extraction from title attribute
- `scrapers/cineciutat_scraper.py` - Date/time object format
- `api/services/scraper_service.py` - Date parsing logic

### 5. Developer Experience (✅ Complete - 2025-11-09)
- Created `/resume` slash command at `.claude/commands/resume.md`
- Automatically checks session notes, git status, and starts backend
- Provides concise summary on session start

---

## 🔧 Technical Details

### Environment Variables
```bash
# .env (root)
TMDB_API_KEY=8265bd1679663a7ea12ac168da84d2e8  # Active key
DATABASE_URL=postgresql://vose_user:vose_pass@localhost:5432/vose_movies
```

### Database Schema
```sql
-- Movies: title, link, tmdb_id, poster_url, backdrop_url, overview, rating,
--         release_year, runtime, genres, certification
-- Cinemas: name, location, island, address, website
-- Showtimes: movie_id, cinema_id, showtime_date, showtime_time, version, is_active
```

### Key API Endpoints
- `GET /showtimes` - Main endpoint with filters (island, cinema, date)
- `GET /showtimes/today` - Today's showtimes
- `GET /showtimes/upcoming?days=7` - Next N days
- `GET /movies` - All movies
- `GET /cinemas` - All cinemas

### Scrapers
- `aficine_scraper.py` - Covers ALL Balearic Islands (Mallorca, Menorca, Ibiza)
- `cineciutat_scraper.py` - CineCiutat Palma only
- `unified_scraper_db.py` - Runs all scrapers and saves to DB

---

## 📝 TODO / Next Steps

### Completed ✅
- [x] **Multi-Day Scraping**: Extract dates from cinema websites (2025-11-09)
- [x] Test multi-day scraping and verify API responses (2025-11-09)
- [x] Create `/resume` command for session startup (2025-11-09)
- [x] **Frontend-Backend Integration**: Fixed connectivity issues (2025-11-10)
  - Verified emulator uses `10.0.2.2:8000` for localhost access
  - Created comprehensive startup guide (STARTUP_GUIDE.md)
  - Added quick-start scripts (start-backend.sh, run-scrapers.sh)
  - Documented physical device configuration steps

### Immediate Priority
- [ ] **Database Migration**: Create Alembic migration for TMDB fields
  ```bash
  cd api
  alembic revision --autogenerate -m "Add TMDB metadata fields"
  alembic upgrade head
  ```

### TMDB Metadata
- [ ] Run backfill script to fetch metadata for existing movies
  ```bash
  python scrapers/fetch_movie_metadata.py
  ```

### Frontend
- [ ] Verify TMDB metadata appears in frontend (posters, ratings, etc.)
- [ ] Test multi-day date display in app
- [ ] Add date range picker if needed

### Nice to Have
- [ ] Add pagination to API endpoints for large result sets
- [ ] Add caching layer for frequently accessed data
- [ ] Set up automated scraper scheduling (cron job)

---

## 🚨 Important Notes

1. **Sensitive Files**: Never commit `.env`, `*token*` files
2. **TMDB API Key**: Free tier has rate limits (check usage)
3. **Scraper Rate Limiting**: Set to 15 requests/min to avoid detection
4. **Background Server**: Currently running - check with `ps aux | grep uvicorn`

---

## 📂 Project Structure
```
vose-movies-scrapers/
├── api/                  # FastAPI backend
│   ├── models/          # SQLAlchemy models
│   ├── routers/         # API endpoints
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic (scraper_service, tmdb_service)
│   ├── database/        # DB config
│   └── main.py          # FastAPI app
├── scrapers/            # Web scrapers
│   ├── aficine_scraper.py
│   ├── cineciutat_scraper.py
│   ├── unified_scraper_db.py
│   ├── fetch_movie_metadata.py
│   └── stealth_config.py
├── data/cinema/         # Scraped JSON output
├── .env                 # Environment variables (ignored)
└── requirements.txt     # Python dependencies
```

---

## 🔗 Useful Commands

```bash
# Quick start scripts (NEW - 2025-11-10)
./start-backend.sh          # Start FastAPI backend
./run-scrapers.sh           # Run scrapers to populate data

# Frontend (separate terminal)
cd "/media/squareyes/Evo Plus 2a/AI/APPS/VOSEMovies-dev"
npx expo start              # Press 'a' for Android emulator

# Manual backend start
source venv/bin/activate
PYTHONPATH=. python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Manual scraper run
source venv/bin/activate
PYTHONPATH=. python3 scrapers/unified_scraper_db.py

# Fetch TMDB metadata
source venv/bin/activate
python scrapers/fetch_movie_metadata.py

# Database migrations
cd api && alembic upgrade head

# Check running processes
ps aux | grep uvicorn

# Test API endpoints
curl "http://localhost:8000/showtimes/today" | python3 -m json.tool
curl "http://localhost:8000/showtimes/upcoming?days=7" | python3 -m json.tool
curl "http://localhost:8000/showtimes/?island=Mallorca"
```

**📖 Full Documentation**: See [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) for comprehensive setup instructions

---

**Repository**: https://github.com/chippy101/vose-movie-scrapers
**Branch**: main (5 commits pushed)
