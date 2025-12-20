# VoseMovies - Original Version Movie Finder for Balearic Islands

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Android](https://img.shields.io/badge/Platform-Android-green.svg)](https://reactnative.dev/)
[![Backend: FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)

> Find VOSE (Original Version with Spanish Subtitles) movie showtimes across all cinemas in Mallorca, Menorca, and Ibiza.

## Overview

VoseMovies helps English-speaking residents and tourists in the Balearic Islands discover movies in their original language with Spanish subtitles. Instead of checking multiple cinema websites, get all VOSE showtimes in one convenient app.

**Features:**
- 🎬 Real-time VOSE showtimes from all major cinemas
- 🗓️ Week-ahead schedule viewing
- 🏝️ Filter by island (Mallorca, Menorca, Ibiza)
- 🎭 Cinema-specific filtering
- 🌐 Offline support with smart caching
- 📱 Native Android app (React Native)
- 🔄 Auto-updating showtime data

**Supported Cinemas:**
- CineCiutat (Palma, Mallorca)
- Ocimax Palma (Mallorca)
- Rívoli (Palma, Mallorca)
- Augusta (Palma, Mallorca)
- Aficine Manacor (Mallorca)
- Ocimax Maó (Menorca)
- Multicines Eivissa (Ibiza)

## Screenshots

*[Screenshots to be added before Play Store submission]*

## Technology Stack

### Frontend
- **Framework:** React Native with Expo
- **Language:** TypeScript
- **UI:** React Native components with custom styling
- **State Management:** React Hooks
- **API Client:** Fetch API with caching

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** SQLite (production: PostgreSQL recommended)
- **Web Scraping:** Selenium + BeautifulSoup4
- **External APIs:** TMDB API (movie metadata)

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- ChromeDriver (for web scraping)
- Android Studio (for development)
- TMDB API key ([Get one free](https://www.themoviedb.org/settings/api))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vosemovies.git
   cd vosemovies
   ```

2. **Backend Setup**
   ```bash
   cd vosemovies-backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r api/requirements.txt

   # Configure environment
   cp .env.example .env
   # Edit .env and add your TMDB_API_KEY

   # Start backend
   ./start-backend.sh
   ```

3. **Frontend Setup**
   ```bash
   cd ../vosemovies-frontend
   npm install

   # Start Expo development server
   npx expo start
   ```

4. **Run Scrapers** (populate database)
   ```bash
   cd ../vosemovies-backend
   ./run-scrapers.sh
   ```

5. **Open in Android Emulator**
   - Press `a` in Expo terminal to launch Android emulator

## Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions
- **[API Documentation](./API_DOCUMENTATION.md)** - Backend API endpoints
- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Privacy Policy](./PRIVACY_POLICY.md)** - Data handling and privacy
- **[Terms of Service](./TERMS_OF_SERVICE.md)** - Usage terms

## Project Structure

```
vosemovies/
├── vosemovies-backend/        # Python FastAPI backend
│   ├── api/                   # API routes and models
│   ├── scrapers/              # Cinema website scrapers
│   ├── vose_movies.db         # SQLite database
│   └── requirements.txt
├── vosemovies-frontend/       # React Native Expo app
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── components/        # Reusable components
│   │   └── services/          # API clients
│   └── package.json
└── release-docs/              # Public release documentation
```

## Configuration

### Backend Environment Variables
```bash
# Required
TMDB_API_KEY=your_tmdb_api_key_here

# Optional (defaults provided)
API_HOST=0.0.0.0
API_PORT=8000
DATABASE_URL=sqlite:///./vose_movies.db
SCRAPER_HEADLESS=true
```

### Frontend API URL
Edit `src/services/api/backendApi.ts`:
```typescript
// Development (Android Emulator)
BASE_URL: 'http://10.0.2.2:8000'

// Production
BASE_URL: 'https://your-backend-domain.com'
```

## Data Sources

This app aggregates publicly available showtime information from:
- CineCiutat: https://cineciutat.org
- Aficine: https://aficine.com

**Legal Compliance:**
- Respects robots.txt directives
- Implements polite scraping (rate limiting, delays)
- Provides proper attribution
- Links back to official cinema websites

**TMDB Attribution:**
This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Privacy & Data

VoseMovies respects user privacy:
- **No user accounts** - App works without registration
- **No personal data collection** - No emails, names, or tracking
- **Local data only** - Cached showtimes stored on device only
- **No analytics** - No usage tracking or telemetry

See [Privacy Policy](./PRIVACY_POLICY.md) for complete details.

## Support

- **Bug Reports:** [GitHub Issues](https://github.com/yourusername/vosemovies/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/yourusername/vosemovies/discussions)
- **Email:** support@vosemovies.com *(replace with actual email)*

## Roadmap

- [ ] iOS version
- [ ] Push notifications for new VOSE releases
- [ ] User favorites/bookmarks
- [ ] Calendar integration (ICS export)
- [ ] Additional cinemas (as VOSE offerings expand)
- [ ] Dark mode theme

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Acknowledgments

- Cinema data: CineCiutat, Aficine
- Movie metadata: The Movie Database (TMDB)
- Built with: React Native, Expo, FastAPI, Selenium

## Disclaimer

VoseMovies is an independent project not affiliated with any cinema chain. Showtime data is provided for informational purposes only. Always verify showtimes on official cinema websites before making plans.

---

**Made with ❤️ for the English-speaking community in the Balearic Islands**

*Last Updated: November 2025*
