# Backend API Integration Guide

## Overview

The VOSE Movies app now has a Python FastAPI backend that handles all web scraping and data management. The frontend can consume this data via REST API instead of running scrapers client-side.

## Backend Setup

### Location
Backend code is located at: `/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers/`

### Starting the Backend

```bash
cd /media/squareyes/Evo\ Plus\ 2a/AI/AI_Projects/vose-movies-scrapers
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

The API will be available at: `http://localhost:8000`

API Documentation (Swagger UI): `http://localhost:8000/docs`

### Running the Scraper

To populate the database with fresh data:

```bash
cd /media/squareyes/Evo\ Plus\ 2a/AI/AI_Projects/vose-movies-scrapers
python scrapers/unified_scraper_db.py
```

This scrapes both CineCiutat and Aficine cinemas and stores results in PostgreSQL.

## Frontend Integration

### Backend API Service

A new service has been created at `/src/services/api/backendApi.ts` that provides:

```typescript
import { backendApi } from './src/services/api/backendApi';

// Get today's showtimes
const showtimes = await backendApi.getShowtimesToday();

// Get upcoming showtimes (next 7 days)
const upcoming = await backendApi.getShowtimesUpcoming();

// Get all showtimes with filters
const filtered = await backendApi.getShowtimes({
  island: 'Mallorca',
  cinema: 'CineCiutat',
  date: '2025-10-31'
});

// Get all movies
const movies = await backendApi.getMovies();

// Get all cinemas
const cinemas = await backendApi.getCinemas();

// Get list of islands
const islands = await backendApi.getIslands();

// Health check
const health = await backendApi.healthCheck();
```

### Updating ShowtimeDataService

To use the backend API instead of client-side scraping, update `/src/services/data/ShowtimeDataService.ts`:

**Option 1: Replace scraping with API calls**
```typescript
import { backendApi } from '../api/backendApi';

private async fetchFreshData(): Promise<ShowtimeData> {
  try {
    console.log('[ShowtimeData] 🎬 Fetching from backend API...');

    // Get data from backend instead of scraping
    const showtimes = await backendApi.getShowtimesUpcoming();

    // Transform backend format to app format
    const transformedShowtimes: ScrapedShowtime[] = showtimes.map(st => ({
      movieTitle: st.title,
      cinema: st.cinema_name,
      location: st.cinema_location,
      island: st.island,
      time: st.showtime_time,
      date: st.showtime_date,
      language: st.version,
      isVOSE: st.version === 'VOSE',
      url: st.link,
      source: 'backend-api' as ScrapingSource
    }));

    const voseShowtimes = transformedShowtimes.filter(s => s.isVOSE).length;

    const data: ShowtimeData = {
      showtimes: transformedShowtimes,
      lastUpdated: new Date(),
      totalShowtimes: transformedShowtimes.length,
      voseShowtimes,
      sources: ['backend-api']
    };

    // Cache and store
    this.cachedData = data;
    await this.saveToStorage(data);

    return data;
  } catch (error) {
    console.error('[ShowtimeData] Backend API error:', error);
    // Fallback to scraping if backend is unavailable
    return await this.fetchFromScrapers();
  }
}
```

**Option 2: Hybrid approach (fallback to scraping)**

Keep both methods and try backend first, fall back to scraping if it fails.

## API Endpoints

### Health
- `GET /health` - Health check

### Showtimes
- `GET /showtimes/` - All showtimes (with optional filters: island, cinema, date)
- `GET /showtimes/today` - Today's showtimes
- `GET /showtimes/upcoming` - Upcoming showtimes (next 7 days)

### Movies
- `GET /movies/` - All movies
- `GET /movies/{movie_id}` - Specific movie
- `GET /movies/{movie_id}/showtimes` - Showtimes for a movie

### Cinemas
- `GET /cinemas/` - All cinemas
- `GET /cinemas/islands` - List of islands
- `GET /cinemas/{cinema_id}` - Specific cinema

## Database

### Connection
PostgreSQL database running locally. Connection details in `/api/database/config.py`

### Tables
- `movies` - Movie information
- `cinemas` - Cinema information
- `showtimes` - Showtime schedules
- `scraper_runs` - Scraper execution logs

### Viewing Data

```bash
psql -U postgres -d vose_movies
```

```sql
-- View all showtimes
SELECT * FROM showtimes WHERE is_active = true ORDER BY showtime_date, showtime_time;

-- View cinemas
SELECT * FROM cinemas;

-- View scraper runs
SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 10;
```

## Testing

### Test Backend API
```bash
curl http://localhost:8000/health
curl http://localhost:8000/showtimes/today
curl http://localhost:8000/cinemas/
```

### Verify Integration
1. Start backend: `uvicorn api.main:app --host 0.0.0.0 --port 8000`
2. Run scraper to populate data: `python scrapers/unified_scraper_db.py`
3. Test API endpoints work
4. Update frontend to use `backendApi` service
5. Test frontend displays data correctly

## Current Status

✅ Backend API running (port 8000)
✅ Database configured and working
✅ Scrapers functional (CineCiutat + Aficine)
✅ API service created for frontend (`src/services/api/backendApi.ts`)
⏸️ ShowtimeDataService needs update to use backend API
⏸️ Frontend UI testing with backend data

## Next Steps

1. Update `ShowtimeDataService.ts` to use backend API
2. Test frontend with live backend data
3. Set up automated scraper cron job
4. Deploy backend to production server
5. Update frontend `BACKEND_CONFIG.BASE_URL` for production

## Production Deployment

For production, you'll need to:
1. Deploy backend to a server (e.g., AWS, DigitalOcean, Heroku)
2. Set up PostgreSQL database on that server
3. Configure CORS for your frontend domain
4. Update `BACKEND_CONFIG.BASE_URL` in `backendApi.ts`
5. Set up automated scraping (cron job every 2 hours)
6. Add monitoring and error alerts
