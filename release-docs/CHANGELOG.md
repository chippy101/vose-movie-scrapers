# Changelog

All notable changes to VoseMovies will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- iOS app version
- Push notifications for new VOSE releases
- User favorites/bookmarks
- Dark mode theme
- Calendar export (ICS format)

## [1.0.0] - 2025-11-11

### 🎉 Initial Release

First public release of VoseMovies - VOSE movie finder for the Balearic Islands!

### Added

**Core Features:**
- Real-time VOSE showtime aggregation from multiple cinemas
- Week-ahead schedule viewing (8 days)
- Filter by island (Mallorca, Menorca, Ibiza)
- Filter by cinema
- Offline support with smart caching (24-hour TTL)
- Pull-to-refresh functionality
- Native Android app (React Native/Expo)

**Supported Cinemas:**
- CineCiutat (Palma, Mallorca) - Full week support (8 days)
- Ocimax Palma (Mallorca)
- Rívoli (Palma, Mallorca)
- Augusta (Palma, Mallorca)
- Aficine Manacor (Mallorca)
- Ocimax Maó (Menorca)
- Multicines Eivissa (Ibiza)

**Backend:**
- FastAPI REST API (Python 3.10+)
- SQLite database with automatic initialization
- Automated web scraping (Selenium + BeautifulSoup4)
- TMDB integration for movie metadata (posters, ratings, descriptions)
- Health check endpoint (`/health`)
- Showtime API endpoints (today, upcoming, by date, by island)
- CORS configuration for mobile app access

**Frontend:**
- React Native with Expo
- TypeScript for type safety
- Custom showtime cards with movie posters
- Date-grouped showtime display
- Cinema information display
- Empty state handling
- Loading states and error handling
- Responsive layout for various Android devices

**Developer Tools:**
- Startup scripts (`start-backend.sh`, `run-scrapers.sh`)
- Comprehensive development documentation
- Environment variable configuration
- Docker-ready structure (planned)

**Documentation:**
- README with quick start guide
- PRIVACY_POLICY compliant with GDPR
- TERMS_OF_SERVICE
- CONTRIBUTING guidelines
- CODE_OF_CONDUCT
- SECURITY policy
- API documentation
- Deployment guide

### Technical Details

**Backend Stack:**
- FastAPI 0.104+
- SQLAlchemy 2.0+
- Selenium 4.15+
- BeautifulSoup4 4.12+
- Python 3.10+

**Frontend Stack:**
- React Native 0.72+
- Expo SDK 49+
- TypeScript 5.0+
- React 18+

**Database Schema:**
- Movies table (title, TMDB metadata)
- Cinemas table (name, location, island)
- Showtimes table (date, time, movie, cinema)
- Scraper runs log

**API Endpoints:**
- `GET /` - API info
- `GET /health` - Health check
- `GET /showtimes/today` - Today's showtimes
- `GET /showtimes/upcoming?days=7` - Next N days
- `GET /showtimes/?island=Mallorca` - Filter by island
- `GET /cinemas/` - All cinemas
- `GET /cinemas/islands` - List islands
- `GET /movies/` - All movies

### Security
- No user data collection (privacy-first design)
- HTTPS-only API calls in production
- Environment variable configuration for secrets
- Parameterized SQL queries (SQLAlchemy ORM)
- CORS properly configured
- No embedded API keys in mobile app

### Known Limitations
- Android only (iOS planned for future)
- Requires internet connection for initial data fetch
- Showtime accuracy depends on upstream cinema websites
- CineCiutat: 8 days of data
- Aficine: Variable dates (VOSE offered selectively)
- No user accounts or push notifications

---

## Version History Legend

### Types of Changes
- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security vulnerability fixes

### Version Numbering
- **Major (X.0.0)** - Incompatible API changes or major feature overhauls
- **Minor (1.X.0)** - New features, backward-compatible
- **Patch (1.0.X)** - Bug fixes, backward-compatible

---

## Future Releases

### [1.1.0] - Planned (Q1 2026)
- Add push notifications for new VOSE releases
- Implement user favorites (local storage only)
- Dark mode theme
- Calendar export (ICS format)
- Deep linking support

### [1.2.0] - Planned (Q2 2026)
- iOS version
- Additional cinema scrapers (as new VOSE offerings expand)
- Improved offline support
- Advanced filtering (genre, rating)

### [2.0.0] - Planned (Q3 2026)
- Backend user accounts (optional)
- Cloud-synced favorites
- Push notification preferences
- Trailer integration
- Social sharing features

---

**Upgrade Instructions:** Always check release notes before upgrading for breaking changes or required migration steps.

**Download:** Latest release available at https://github.com/yourusername/vosemovies/releases

[Unreleased]: https://github.com/yourusername/vosemovies/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/vosemovies/releases/tag/v1.0.0
