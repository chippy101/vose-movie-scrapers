# PopcornPal (VoseMovies)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Android](https://img.shields.io/badge/Platform-Android-green.svg)](https://reactnative.dev/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

> Find VOSE (Original Version with Spanish Subtitles) movie showtimes across all cinemas in Mallorca, Menorca, and Ibiza.

## Overview

PopcornPal helps English-speaking residents and tourists in the Balearic Islands discover movies in their original language with Spanish subtitles. Instead of checking multiple cinema websites, get all VOSE showtimes in one convenient app.

**Features:**
- 🎬 Real-time VOSE showtimes from all major cinemas
- 🗓️ Week-ahead schedule viewing
- 🏝️ Filter by island (Mallorca, Menorca, Ibiza)
- 🎭 Cinema-specific filtering
- 🗺️ Interactive cinema map with MapLibre (no API key needed)
- 🌐 Offline support with smart caching (6hr fresh / 24hr stale)
- 📱 Native Android app (React Native with Expo)
- 🔄 Auto-updating showtime data via Selenium scrapers

**Supported Cinemas:**
- CineCiutat (Palma, Mallorca)
- Ocimax Palma (Mallorca)
- Rívoli (Palma, Mallorca)
- Augusta (Palma, Mallorca)
- Aficine Manacor (Mallorca)
- Ocimax Maó (Menorca)
- Multicines Eivissa (Ibiza)

## Technology Stack

### Frontend
- **Framework:** React Native 0.81.5 with Expo 54.0.23
- **Language:** TypeScript (strict mode)
- **Navigation:** React Navigation (Bottom Tabs + Native Stack)
- **Maps:** MapLibre (OpenFreeMap tiles - free, no API key)
- **Caching:** AsyncStorage with stale-while-revalidate strategy
- **External APIs:** TMDB API (movie posters, ratings, metadata)

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Web Scraping:** Selenium + BeautifulSoup4
- **ORM:** SQLAlchemy
- **CORS:** Configurable for development/production

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- ChromeDriver (for web scraping)
- Android Studio (for development)
- TMDB API key ([Get one free](https://www.themoviedb.org/settings/api))

### Backend Setup

```bash
cd vosemovies-backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r api/requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your TMDB_API_KEY

# Start backend (creates DB automatically)
./start-backend.sh

# In another terminal, populate database
./run-scrapers.sh
```

Backend will be available at `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend Setup

```bash
cd vosemovies-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env:
# - Add TMDB_API_KEY (same as backend)
# - Set EXPO_PUBLIC_BACKEND_URL (see below)

# Start Expo development server
npx expo start

# Press 'a' to launch Android emulator
```

**Backend URL Configuration:**
- **Android Emulator:** `http://10.0.2.2:8000` (special emulator alias)
- **Physical Device:** `http://192.168.x.x:8000` (your network IP - find with `ip addr`)
- **Production:** `https://your-backend-domain.com`

### Building APK for Testing

```bash
cd vosemovies-frontend

# Clean previous builds
rm -rf android/app/build/generated/assets/createBundleReleaseJsAndAssets/

# Build release APK
cd android
./gradlew :app:assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk

# Install on device/emulator
adb install app/build/outputs/apk/release/app-release.apk
```

## Project Structure

```
popcornpal/
├── vosemovies-backend/          # Python FastAPI backend
│   ├── api/                     # Routes, models, database config
│   │   ├── routes/             # API endpoints (showtimes, cinemas, movies)
│   │   ├── models.py           # SQLAlchemy models
│   │   └── database.py         # Database configuration
│   ├── scrapers/                # Cinema website scrapers
│   │   ├── cineciutat_scraper.py
│   │   ├── aficine_scraper.py
│   │   └── run_all_scrapers.py
│   ├── tests/                   # Pytest test suite
│   ├── vose_movies.db          # SQLite database (dev)
│   ├── requirements.txt        # Scraper dependencies
│   └── api/requirements.txt    # API dependencies
│
├── vosemovies-frontend/         # React Native Expo app
│   ├── src/
│   │   ├── screens/            # Home, Showtimes, Cinema screens
│   │   ├── components/         # Reusable UI components
│   │   ├── services/api/       # backendApi.ts, tmdbApi.ts
│   │   └── config/             # environment.ts (API URL config)
│   ├── android/                # Native Android build files
│   └── package.json
│
├── docs/                        # Documentation
│   ├── DEPLOYMENT.md           # Production deployment guide
│   ├── SECURITY.md             # Security configuration (CORS, API keys)
│   └── CONTRIBUTING.md         # Contribution guidelines
│
├── delete/                      # Archived documentation from completed phases
└── CLAUDE.md                   # AI assistant project memory
```

## API Endpoints

- `GET /health` - Health check
- `GET /showtimes/today` - Today's VOSE showtimes
- `GET /showtimes/upcoming?days=7` - Upcoming showtimes (default 7 days)
- `GET /showtimes/?island=Mallorca` - Filter by island
- `GET /cinemas/` - All cinemas
- `GET /movies/` - All movies
- `GET /docs` - Interactive API documentation (Swagger)

## Configuration

### Backend Environment Variables
```bash
# Required
TMDB_API_KEY=your_tmdb_api_key_here

# Optional (defaults provided)
API_HOST=0.0.0.0
API_PORT=8000
DATABASE_URL=sqlite:///./vose_movies.db  # Use PostgreSQL in production
ENVIRONMENT=development  # Set to "production" for prod
SCRAPER_HEADLESS=True
SCRAPER_INTERVAL_HOURS=4

# Production CORS (comma-separated, no spaces)
# CORS_ORIGINS=https://your-frontend-domain.com
```

### Frontend Environment Variables
```bash
# Required
EXPO_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000  # Or production URL
```

## Data Sources & Legal Compliance

This app aggregates publicly available showtime information from:
- **CineCiutat:** https://cineciutat.org
- **Aficine:** https://aficine.com

**Legal Compliance:**
- ✅ Respects robots.txt directives
- ✅ Implements polite scraping (rate limiting, delays)
- ✅ Provides proper attribution
- ✅ Links back to official cinema websites

**TMDB Attribution:**
This product uses the TMDB API but is not endorsed or certified by TMDB.

## Development Guidelines

### Backend (Python)
- Follow PEP 8 style guide
- Use type hints and docstrings
- Use SQLAlchemy ORM (no raw SQL)
- Write tests for new features (pytest)

### Frontend (TypeScript)
- Strict TypeScript (no `any` without justification)
- Functional components with hooks
- Test on both emulator and physical devices
- Use existing component patterns

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment to Render
- [Security Setup](docs/SECURITY.md) - CORS, API keys, environment config
- [Contributing Guidelines](docs/CONTRIBUTING.md) - How to contribute
- [Privacy Policy](docs/PRIVACY_POLICY.md) - Data handling and privacy
- [Terms of Service](docs/TERMS_OF_SERVICE.md) - Usage terms

## Current Status

**Phase:** Production Deployment Preparation
- ✅ Core functionality complete (backend + frontend)
- ✅ TMDB integration (posters, ratings, cast)
- ✅ MapLibre implementation (no API key needed)
- ✅ Offline caching with stale-while-revalidate
- ✅ Android APK builds working on emulator and physical devices
- ✅ Error handling and connection diagnostics
- 🚀 **Next:** Deploy to Render, test from multiple mobile devices

## Troubleshooting

```bash
# Backend won't start (port already in use)
lsof -i :8000
kill -9 <PID>

# Get your network IP (for physical device testing)
ip addr show | grep "inet " | grep -v "127.0.0.1" | head -1

# Clear Expo cache
cd vosemovies-frontend && npx expo start -c

# Reset database
cd vosemovies-backend && rm vose_movies.db && ./start-backend.sh

# Test backend from phone browser
# Open: http://192.168.x.x:8000/health (use your actual IP)
```

## Privacy & Data

PopcornPal respects user privacy:
- **No user accounts** - App works without registration
- **No personal data collection** - No emails, names, or tracking
- **Local data only** - Cached showtimes stored on device only
- **No analytics** - No usage tracking or telemetry

See [Privacy Policy](docs/PRIVACY_POLICY.md) for complete details.

## Support

- **Bug Reports:** [GitHub Issues](https://github.com/chippy101/vose-movie-scrapers/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/chippy101/vose-movie-scrapers/discussions)

## Roadmap

- [ ] Deploy backend to Render with PostgreSQL
- [ ] Test from multiple physical Android devices
- [ ] iOS version
- [ ] Push notifications for new VOSE releases
- [ ] User favorites/bookmarks
- [ ] Calendar integration (ICS export)
- [ ] Additional cinemas (as VOSE offerings expand)

## License

This project is licensed under the MIT License - see the [LICENSE](release-docs/LICENSE) file for details.

## Acknowledgments

- **Cinema data:** CineCiutat, Aficine, and participating cinema chains
- **Movie metadata:** The Movie Database (TMDB)
- **Maps:** MapLibre + OpenFreeMap
- **Built with:** React Native, Expo, FastAPI, Selenium, SQLAlchemy

## Disclaimer

PopcornPal is an independent project not affiliated with any cinema chain. Showtime data is provided for informational purposes only. Always verify showtimes on official cinema websites before making plans.

---

**Made with ❤️ for the English-speaking community in the Balearic Islands**

*Last Updated: December 2025*
