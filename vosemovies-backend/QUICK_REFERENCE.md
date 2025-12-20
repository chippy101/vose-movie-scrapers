# VOSE Movies - Quick Reference Card

## 📁 Project Locations

### Backend (This Project)
```
/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend/
```

### Mobile App (React Native)
```
/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend/
```

## 🚀 Quick Start Commands

### Start Backend API
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./start-backend.sh
```
**API URL**: `http://localhost:8000`
**Docs**: `http://localhost:8000/docs`

### Run Scraper
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./run-scrapers.sh
```

### Start Frontend
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"
npx expo start
# Press 'a' to launch Android emulator
```

### Check Database (SQLite)
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
sqlite3 vose_movies.db
```

## 📡 API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `/health` | Health check | `curl http://localhost:8000/health` |
| `/cinemas/islands` | Get islands | `curl http://localhost:8000/cinemas/islands` |
| `/showtimes/today?island=Mallorca` | Today's showtimes | `curl "http://localhost:8000/showtimes/today?island=Mallorca"` |
| `/showtimes/upcoming?days=7` | Upcoming week | `curl "http://localhost:8000/showtimes/upcoming?days=7"` |
| `/movies/` | All movies | `curl http://localhost:8000/movies/` |
| `/cinemas/` | All cinemas | `curl http://localhost:8000/cinemas/` |
| `/docs` | Interactive docs | Open in browser |

## 🗄️ Database Queries (SQLite)

```bash
# Open SQLite database
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
sqlite3 vose_movies.db
```

```sql
-- Show all movies
SELECT title FROM movies;

-- Show today's showtimes
SELECT m.title, c.name, s.showtime_time
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN cinemas c ON s.cinema_id = c.id
WHERE DATE(s.showtime_date) = DATE('now') AND s.is_active = 1
ORDER BY s.showtime_time;

-- Check scraper runs
SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 5;

-- Exit SQLite
.quit
```

## 🔧 Troubleshooting

### Scraper Issues
```bash
# Run scraper manually to debug
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
source venv/bin/activate
PYTHONPATH=. python3 scrapers/unified_scraper_db.py

# Check ChromeDriver
chromedriver --version
```

### Database Issues
```bash
# Reset database (⚠️ Deletes all data)
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
rm vose_movies.db
./start-backend.sh
# Then run scrapers to repopulate
./run-scrapers.sh
```

### API Issues
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check port is free
lsof -i :8000

# Kill process on port 8000 if needed
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## 📱 Mobile App Integration

**Mobile App Location**: `/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend`

### API Client Example
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://localhost:8000';

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
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SUCCESS_SUMMARY.md` | What's working & current status |
| `BACKEND_SETUP.md` | Complete setup guide |
| `DEPLOYMENT.md` | Deploy to Railway/DigitalOcean |
| `TESTING_GUIDE.md` | How to test everything |
| `DATABASE_SCHEMA.md` | Database design |
| `PHASE1_COMPLETE.md` | Implementation details |
| `PROJECT_STATUS.md` | Overall project status |
| `QUICK_REFERENCE.md` | This file |

## ✅ Current Status

- **Backend**: ✅ Running with live data
- **Database**: ✅ 7 movies, 12 showtimes
- **API**: ✅ http://localhost:8000
- **Scrapers**: ✅ Working with 100+ VOSE markers
- **Mobile App**: 📱 Ready to connect at `/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend`

## 💰 Cost

- **Development**: Free
- **Production**: $5-10/month (Railway or DigitalOcean)
- **Scalability**: Unlimited users, fixed cost

## 🎯 Next Steps

1. ✅ Backend working with live data
2. 📱 Connect React Native app to API
3. 🚀 Deploy backend to production
4. ⏰ Set up cron job (every 4 hours)
5. 📲 Publish to Google Play Store

---

**Need Help?** Read the relevant documentation file above or check `BACKEND_SETUP.md` for detailed instructions.
