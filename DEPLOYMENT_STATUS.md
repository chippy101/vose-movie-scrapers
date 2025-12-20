# PopcornPal Deployment Status

**Last Updated**: 2024-12-20
**Status**: Ready for cloud deployment (Render blocked by paid tier requirement)

---

## Current Situation

### ✅ What's Working
- **Backend API**: Fully functional locally on port 8000
- **Scrapers**: Successfully scraping cinema data
- **Frontend**: React Native app working on emulator and physical devices
- **Local Database**: SQLite database populated with data
- **GitHub**: All code pushed to `chippy101/vose-movie-scrapers`

### ✅ What's Ready
- **render.yaml**: Fixed and ready for deployment (uses `startCommand` for cron, removed conflicting env vars)
- **Environment configs**: `.env.example` files for both backend and frontend
- **APK builds**: Can build production APKs locally

### ❌ Blocker
- **Render.com requires paid account** for cron jobs ($7/month minimum)
- Free tier only allows 1 PostgreSQL database + 1 web service (no cron jobs)

---

## Next Steps (When You Resume)

### Option A: Use Alternative Cloud Platform (Recommended)
Platforms with better free tiers:
1. **Railway.app** - Has free tier with cron jobs
2. **Fly.io** - Free PostgreSQL + cron via scheduled processes
3. **DigitalOcean App Platform** - $5/month, includes everything
4. **Python Anywhere** - Free tier with scheduled tasks

### Option B: Run Scraper Manually
1. Deploy backend to Render (web service only)
2. Keep scraper running locally or trigger manually
3. Build APK pointing to Render URL

### Option C: Pay for Render
- Upgrade database to $7/month (removes 30-day expiration + adds backups)
- Enables cron job creation

---

## Configuration Summary

### Backend (Render)
- **Service Name**: vose-movie-scrapers (already exists)
- **Database**: popcornpal-db (already exists)
- **Region**: Frankfurt (closest to Balearic Islands)
- **Runtime**: Python 3.10
- **Required Env Vars**:
  - `TMDB_API_KEY` - Your TMDB API key (set in Render dashboard)
  - `CORS_ORIGINS` - Set to `*` for testing
  - `DATABASE_URL` - Auto-provided by Render
  - `SCRAPER_HEADLESS=True`

### Frontend
**For Production APK**, update `.env`:
```bash
EXPO_PUBLIC_BACKEND_URL=https://vose-movie-scrapers.onrender.com
EXPO_PUBLIC_TMDB_API_KEY=your_key_here
```

Then build:
```bash
cd vosemovies-frontend
cd android && ./gradlew :app:assembleRelease
# APK at: android/app/build/outputs/apk/release/app-release.apk
```

---

## Files Modified (Latest Session)

### render.yaml
- ✅ Changed `command:` to `startCommand:` for cron job
- ✅ Removed conflicting `API_PORT` env var (had both `sync: false` and `value`)
- ✅ Fixed multi-line command to single-line with `&&`

### Commits Made
```
993f8d8 - fix: Remove API_PORT env var with conflicting sync and value
fff4601 - fix: Use startCommand instead of command for cron job
b84dcb0 - fix: Change cron job command to single-line format for Render
```

---

## Quick Commands Reference

### Test Backend Locally
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./start-backend.sh
curl http://localhost:8000/health
```

### Run Scrapers Locally
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./run-scrapers.sh
```

### Check What's in Database
```bash
cd vosemovies-backend
sqlite3 vose_movies.db "SELECT COUNT(*) FROM showtimes;"
```

### Test Frontend
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"
npx expo start
# Press 'a' for Android
```

---

## Alternative Deployment Plan (Railway)

If you choose Railway instead of Render:

1. **Sign up**: https://railway.app
2. **Import from GitHub**: Connect `chippy101/vose-movie-scrapers`
3. **Add PostgreSQL**: Click "New" → "Database" → "PostgreSQL"
4. **Deploy Backend**:
   - Root directory: `vosemovies-backend`
   - Build command: `pip install -r requirements.txt && pip install -r api/requirements.txt`
   - Start command: `PYTHONPATH=. uvicorn api.main:app --host 0.0.0.0 --port $PORT`
5. **Add Cron (via Railway Cron plugin or scheduled task)**

---

## Contact Info / Resources
- **GitHub Repo**: https://github.com/chippy101/vose-movie-scrapers
- **TMDB API**: https://www.themoviedb.org/settings/api
- **Render Docs**: https://render.com/docs
- **Railway Docs**: https://docs.railway.app

---

**When you're ready to continue, start here:**
1. Decide on cloud platform (Railway, Fly.io, or pay for Render)
2. Deploy backend + database
3. Manually trigger scraper once to populate database
4. Build production APK with cloud URL
5. Test on physical device
6. Submit to Play Store

Good luck! 🍿
