# Frontend Verification Checklist

## Quick Start - Backend + Frontend

### Terminal 1: Start Backend API
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers"
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
🚀 Starting VOSE Movies API...
✅ Database initialized
```

### Terminal 2: Verify Backend API
```bash
# Quick health check
curl http://localhost:8000/health

# Check data counts
echo "Showtimes:" && curl -s http://localhost:8000/showtimes/today | jq 'length'
echo "Movies:" && curl -s http://localhost:8000/movies/ | jq 'length'
echo "Cinemas:" && curl -s http://localhost:8000/cinemas/ | jq 'length'
```

Expected output:
```
{"status":"healthy","service":"vose-movies-api"}
Showtimes: 8
Movies: 14
Cinemas: 2
```

### Terminal 3: Start Frontend (React Native/Expo)
```bash
cd "/media/squareyes/Evo Plus 2a/AI/APPS/VOSEMovies-dev"
npm start
# or
npx expo start
```

---

## Verification Steps

### ✅ Step 1: Backend API Health
- [ ] Backend is running on port 8000
- [ ] Health endpoint responds: `curl http://localhost:8000/health`
- [ ] Swagger docs accessible: http://localhost:8000/docs
- [ ] CORS is enabled (allows all origins for dev)

### ✅ Step 2: Data Availability
- [ ] Showtimes endpoint returns data: `curl http://localhost:8000/showtimes/today`
- [ ] Movies endpoint returns data: `curl http://localhost:8000/movies/`
- [ ] Cinemas endpoint returns data: `curl http://localhost:8000/cinemas/`
- [ ] Islands endpoint returns data: `curl http://localhost:8000/cinemas/islands`

**Current Data in Database:**
- 8 showtimes today
- 14 movies total
- 2 cinemas (CineCiutat, Aficine)
- Islands: Mallorca, Unknown

### ✅ Step 3: Frontend Can Fetch Data

**Option A: Test in Browser Console (Expo Web)**
```javascript
// Open browser console on your Expo dev page
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(data => console.log('✅ Backend connected:', data))
  .catch(err => console.error('❌ Connection failed:', err));

// Test showtimes endpoint
fetch('http://localhost:8000/showtimes/today')
  .then(r => r.json())
  .then(data => console.log(`✅ Found ${data.length} showtimes:`, data))
  .catch(err => console.error('❌ Failed:', err));
```

**Option B: Use the Backend API Service**

Add this test to your app (temporary):
```typescript
import { backendApi } from './src/services/api/backendApi';

// In your component
useEffect(() => {
  async function test() {
    try {
      const health = await backendApi.healthCheck();
      console.log('✅ Backend connected:', health);

      const showtimes = await backendApi.getShowtimesToday();
      console.log(`✅ Found ${showtimes.length} showtimes`);

      const cinemas = await backendApi.getCinemas();
      console.log(`✅ Found ${cinemas.length} cinemas:`, cinemas);
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
    }
  }
  test();
}, []);
```

### ✅ Step 4: Integration with ShowtimeDataService

**To fully integrate, update `src/services/data/ShowtimeDataService.ts`:**

```typescript
import { backendApi, BackendShowtime } from '../api/backendApi';

private async fetchFreshData(): Promise<ShowtimeData> {
  try {
    console.log('[ShowtimeData] 🎬 Fetching from backend API...');

    // Get data from backend
    const backendShowtimes = await backendApi.getShowtimesUpcoming();

    // Transform to app format
    const transformedShowtimes: ScrapedShowtime[] = backendShowtimes.map(st => ({
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

    this.cachedData = data;
    await this.saveToStorage(data);

    console.log(`[ShowtimeData] ✅ Loaded ${data.totalShowtimes} showtimes (${voseShowtimes} VOSE)`);
    return data;

  } catch (error) {
    console.error('[ShowtimeData] ❌ Backend API failed, falling back to scrapers:', error);
    // Fallback to existing scraper code
    return await this.fetchFromScrapers();
  }
}

// Add fallback method (rename existing method)
private async fetchFromScrapers(): Promise<ShowtimeData> {
  // Your existing scraping code here
  const result = await this.orchestrator.executeFullScraping([...]);
  // ... rest of existing code
}
```

---

## Troubleshooting

### Backend not responding?
```bash
# Check if backend is running
lsof -ti:8000

# If running, test manually
curl http://localhost:8000/health

# If not running, start it
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers"
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### CORS errors?
Backend is configured to allow all origins. If you still see CORS errors:
1. Check backend logs for errors
2. Verify you're using `http://localhost:8000` (not `127.0.0.1`)
3. Restart backend after CORS changes

### No data in database?
```bash
# Run scraper to populate database
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers"
python scrapers/unified_scraper_db.py
```

### Frontend can't connect?
1. Verify backend URL in `src/services/api/backendApi.ts` is `http://localhost:8000`
2. Check that both backend and frontend are running
3. Test backend manually with curl first
4. Check React Native dev console for errors

---

## Expected Results

When everything is working:
1. ✅ Backend API responds to all endpoints
2. ✅ Frontend can fetch data from backend
3. ✅ App displays movies and showtimes from database
4. ✅ No more client-side scraping needed
5. ✅ Data loads faster (from database vs live scraping)

---

## Next Steps After Verification

Once you confirm the frontend can access the backend:

1. **Update ShowtimeDataService** to use backend API by default
2. **Remove or disable** client-side scrapers (keep as fallback if desired)
3. **Set up automated scraping** with cron job (every 2 hours)
4. **Deploy backend** to production server
5. **Update production config** in backendApi.ts

---

## Quick Command Reference

**Start Backend:**
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers"
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Test Backend:**
```bash
curl http://localhost:8000/health
curl http://localhost:8000/showtimes/today | jq
curl http://localhost:8000/docs  # Open in browser
```

**Refresh Data:**
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers"
python scrapers/unified_scraper_db.py
```

**Start Frontend:**
```bash
cd "/media/squareyes/Evo Plus 2a/AI/APPS/VOSEMovies-dev"
npm start
```
