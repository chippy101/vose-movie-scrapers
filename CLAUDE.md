# CLAUDE.md: Project Memory for PopcornPal (VoseMovies)

## Project Overview
- **Name**: PopcornPal (VoseMovies) – React Native app for finding VOSE movie showtimes in the Balearic Islands
- **Purpose**: Help English speakers find movies in original language with Spanish subtitles across Mallorca, Menorca, and Ibiza
- **Tech Stack**: React Native (Expo) + Python FastAPI + Supabase PostgreSQL + Selenium scrapers + TMDB API
- **Current Phase**: Production deployment to Render and multi-device testing
- **Repository**: https://github.com/chippy101/vose-movie-scrapers.git (unified monorepo)

## Repository Structure (Unified Monorepo)
```
/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/
├── README.md                    # Main project documentation
├── CLAUDE.md                    # This file - AI assistant memory
├── render.yaml                  # Render.com deployment config
├── .gitignore                   # Unified monorepo gitignore
│
├── vosemovies-backend/          # Python FastAPI backend
│   ├── api/                     # Routes, models, database config
│   │   ├── database/           # SQLAlchemy (PostgreSQL + SQLite support)
│   │   ├── models/             # Database models
│   │   ├── routers/            # API endpoints
│   │   └── requirements.txt    # API dependencies (includes psycopg2)
│   ├── scrapers/                # Cinema website scrapers
│   ├── tests/                   # Pytest test suite
│   ├── .env.example            # Development environment template
│   └── .env.production.example # Production environment template
│
├── vosemovies-frontend/         # React Native Expo app
│   ├── src/
│   │   ├── screens/            # Home, Showtimes, Cinema screens
│   │   ├── components/         # MapLibre maps, reusable UI
│   │   ├── services/api/       # backendApi.ts, tmdbApi.ts
│   │   └── config/             # environment.ts
│   ├── .env.example            # Development environment template
│   └── .env.production.example # Production environment template
│
├── docs/                        # Consolidated documentation
│   ├── DEPLOYMENT.md           # Render deployment guide
│   ├── SECURITY.md             # API keys & CORS configuration
│   └── CONTRIBUTING.md         # Contribution guidelines
│
└── delete/                      # Archived docs from completed phases
```

## Quick Commands

### Backend
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./start-backend.sh              # Start API on port 8000
./run-scrapers.sh               # Populate database
curl http://localhost:8000/health  # Check status
```

### Frontend
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"
npx expo start                  # Development server
# Press 'a' for Android emulator
```

### APK Build (for testing)
```bash
cd vosemovies-frontend
# 1. Update .env: EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000 (emulator) or http://192.168.x.x:8000 (device)
# 2. Clean and build:
rm -rf android/app/build/generated/assets/createBundleReleaseJsAndAssets/
cd android && ./gradlew :app:createBundleReleaseJsAndAssets :app:assembleRelease
# 3. APK at: android/app/build/outputs/apk/release/app-release.apk
```

## Key Configuration

### Backend URL (Frontend)
**Location**: `vosemovies-frontend/.env`
- **Emulator**: `http://10.0.2.2:8000` (Android special alias)
- **Physical Device (local)**: `http://192.168.x.x:8000` (your network IP)
- **Production**: `https://popcornpal-api.onrender.com` (or your Render URL)

### TMDB API Key
**Required in both**:
- `vosemovies-backend/.env` → `TMDB_API_KEY`
- `vosemovies-frontend/.env` → `EXPO_PUBLIC_TMDB_API_KEY`

### Database Configuration
**Development**: `DATABASE_URL=sqlite:///./vose_movies.db` (automatic)
**Production**: Supabase PostgreSQL (FREE tier)
- Connection string format: `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
- Get from: Supabase Dashboard → Settings → Database (Session Mode)
- Set manually in Render dashboard for both services (api + scrapers)
- Features: 500MB database, 5GB bandwidth/month, automatic backups, Supabase Studio UI
- Documentation: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#supabase-setup-current-production-setup)

## API Endpoints
- `/health` - Health check
- `/showtimes/today` - Today's VOSE showtimes
- `/showtimes/upcoming?days=7` - Next N days
- `/showtimes/?island=Mallorca` - Filter by island
- `/cinemas/` - All cinemas
- `/movies/` - All movies
- `/docs` - Interactive API documentation

## Development Guidelines

### Backend (Python)
- Follow PEP 8, use type hints and docstrings
- Use SQLAlchemy ORM (no raw SQL)
- SQLite for dev, PostgreSQL for production

### Frontend (TypeScript)
- Strict TypeScript (no `any` without justification)
- Functional components with hooks
- Test on both emulator and physical devices

### Important Notes
- **Database**: Supabase PostgreSQL (FREE tier) - 500MB database, unlimited API requests, automatic backups
- **Supabase Studio**: Built-in UI for database management at https://supabase.com/dashboard
- **CORS**: Auto-configured for dev (localhost origins) - must set `CORS_ORIGINS` for production
- **Scrapers**: Run every 4 hours via Render cron job
- **Offline Support**: App uses 6hr fresh / 24hr stale caching
- **TMDB Attribution**: Display "Data provided by TMDB" per API terms
- **Maps**: MapLibre with OpenFreeMap (no API key needed)
- **Future Feature**: Supabase real-time subscriptions for live showtime updates (optional)

## Current Phase: Production Deployment & Testing

### ✅ Completed
- Core functionality (backend API, scrapers, frontend)
- TMDB integration (posters, ratings, metadata)
- Offline caching with stale-while-revalidate
- Android builds working on emulator and physical devices
- Error handling and connection diagnostics
- Migration to Supabase PostgreSQL (FREE tier)
- Render.com deployment configuration updated

### 🚀 Active Tasks
1. **Backend Deployment**
   - ✅ Configured Render.com deployment
   - ✅ Migrated to Supabase PostgreSQL
   - 🔄 Set DATABASE_URL in Render dashboard (manual step)
   - 🔄 Deploy and verify Supabase connection
   - 🔄 Run initial scraper to populate database
   - Restrict CORS to frontend domain

2. **Play Store Release**
   - Add privacy policy and terms of service
   - Optimize APK/AAB size
   - Test on multiple Android devices
   - Set up Play Console account

3. **Feature Enhancements**
   - User favorites/bookmarks
   - Push notifications
   - Calendar export (ICS)
   - iOS support

4. **Testing & Monitoring**
   - Add unit tests (pytest, Jest)
   - Set up CI/CD pipeline
   - Add error tracking (Sentry)
   - Implement analytics

## Troubleshooting Quick Reference

```bash
# Backend won't start
lsof -i :8000
kill -9 <PID>

# Get network IP
ip addr show | grep "inet " | grep -v "127.0.0.1" | head -1

# Clear Expo cache
cd vosemovies-frontend && npx expo start -c

# Reset database
cd vosemovies-backend && rm vose_movies.db && ./start-backend.sh

# Test backend from phone browser
http://192.168.x.x:8000/health
```

## Documentation
- **Main README**: [README.md](README.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Security Setup**: [docs/SECURITY.md](docs/SECURITY.md) (CORS + API keys)
- **Contributing**: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- **Archived Docs**: [ARCHIVED.md](ARCHIVED.md) → `delete/` folder

## Git History (Migrated to Monorepo)
Previous repositories merged into unified monorepo:
- Backend: `https://github.com/chippy101/vose-movie-scrapers.git` (10 commits)
- Frontend: Local only (2 commits)

History preserved in: `GIT_HISTORY_BACKEND.txt` and `GIT_HISTORY_FRONTEND.txt`

---

**Last Updated**: 2025-12-20
**Project Status**: Active Development - Production Deployment Phase
**Current Milestone**: Deploy to Render and test from multiple devices

**Note**: This is the living source of truth for AI assistants. Update as project evolves.
