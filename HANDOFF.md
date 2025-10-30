# VOSE Movies Scraper - Project Handoff Document

## Current Status (2025-10-30)

### What We Have
- **Repository**: `chippy101/vose-movie-scrapers` on GitHub
- **Branch**: `main` (9 files uploaded and synced)
- **Technology**: Python 3.8+ with Selenium + BeautifulSoup4
- **Scrapers**: 3 working Python scrapers (traditional, NOT AI agents)

### Files in Repository
```
├── .gitignore
├── README.md
├── ANALYSIS.md
├── SUMMARY.md
├── requirements.txt
├── scrapers/
│   ├── aficine_scraper.py      # Scrapes Aficine (all Balearic Islands)
│   ├── cineciutat_scraper.py   # Scrapes CineCiutat (Palma)
│   └── unified_scraper.py      # Combines both scrapers
└── data/
    └── cinema/
        └── .gitkeep
```

## NEW GOAL: Google Play Store Mobile App

### User wants to publish a mobile app that shows VOSE movies in Balearic Islands

## Architecture Decision: Traditional Scrapers vs AI Agents

### ✅ DECISION: Keep Traditional Scrapers (NOT AI agents)

**Reasoning:**
- **Cost**: Traditional scrapers = $5-20/month VPS vs AI agents = $100s-1000s/month
- **Speed**: Cached results = instant API responses vs real-time AI = slow
- **Scalability**: Cost stays flat as users grow vs cost grows per user with AI
- **Reliability**: Predictable behavior vs inconsistent AI responses
- **Google Play**: No special disclosures needed

### Why AI Agents Would Be Wrong Here:
1. Cinema websites are stable (don't change layout frequently)
2. Can't run Python/AI agents on mobile devices anyway
3. High API costs scale with user count ($0.10-0.50 per scrape)
4. Slower user experience (waiting for AI to scrape)
5. Backend needed regardless (so no architecture benefit)

---

## Required Architecture for Mobile App

```
┌──────────────────────────────────────────┐
│  MOBILE APP                              │
│  (React Native / Flutter / Native)      │
│  - User interface                        │
│  - Shows VOSE movies by island           │
│  - Search, filter, favorites             │
│  - Push notifications                    │
└──────────────┬───────────────────────────┘
               │ HTTPS REST API
               ↓
┌──────────────────────────────────────────┐
│  BACKEND API SERVER                      │
│  (FastAPI / Node.js / Django)            │
│  - REST endpoints (GET /api/movies)      │
│  - Authentication (optional)             │
│  - Caching layer (Redis)                 │
│  - Database queries                      │
└──────────────┬───────────────────────────┘
               │ Internal calls
               ↓
┌──────────────────────────────────────────┐
│  DATABASE                                │
│  (PostgreSQL / MongoDB / SQLite)         │
│  - Stores scraped movie data             │
│  - Updated every 2-6 hours               │
└──────────────┬───────────────────────────┘
               │ Populated by
               ↓
┌──────────────────────────────────────────┐
│  SCRAPER SERVICE (EXISTING PYTHON CODE)  │
│  - Cron job runs every 2-6 hours         │
│  - unified_scraper.py                    │
│  - Writes results to database            │
│  - Traditional scrapers (current code)   │
└──────────────────────────────────────────┘
```

## Key Principle: Mobile App NEVER Scrapes Directly

- Scraping happens on backend server (scheduled)
- Results cached in database
- Mobile app only fetches cached data via API
- Users get instant results
- Scraping cost independent of user count

---

## Next Steps (Priority Order)

### Phase 1: Backend API Development
**Goal**: Make scraped data available via REST API

Tasks:
1. Choose backend framework (FastAPI recommended for Python)
2. Set up database (PostgreSQL or MongoDB)
3. Modify scrapers to write to database instead of JSON files
4. Create REST API endpoints:
   - `GET /api/movies` - All VOSE movies
   - `GET /api/movies?island=Mallorca` - Filter by island
   - `GET /api/movies?cinema=CineCiutat` - Filter by cinema
5. Add caching layer (Redis) for performance
6. Set up cron job to run scrapers every 2-6 hours

**Location**: `/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers`

### Phase 2: Deploy Backend to Cloud
**Goal**: Backend accessible via public URL

Options:
- **Railway** (easiest, free tier)
- **DigitalOcean App Platform** ($5-12/month)
- **Google Cloud Run** (pay-per-use)
- **AWS Lambda + API Gateway** (serverless)
- **Traditional VPS** (DigitalOcean Droplet $6/month)

Tasks:
1. Containerize backend (Dockerfile)
2. Deploy to chosen platform
3. Set up environment variables
4. Configure domain/SSL
5. Test API endpoints publicly

### Phase 3: Mobile App Development
**Goal**: Android app that consumes the API

Stack options:
- **React Native** (JavaScript, cross-platform)
- **Flutter** (Dart, cross-platform)
- **Native Android** (Kotlin/Java, Android-only)

Tasks:
1. Initialize mobile project
2. Build UI for movie listings
3. Integrate with backend API
4. Add features (search, filter, favorites)
5. Implement push notifications (optional)
6. Test on Android devices
7. Prepare for Google Play Store submission

### Phase 4: Google Play Store
**Goal**: Publish app to Google Play

Tasks:
1. Create Google Play Console account ($25 one-time fee)
2. Prepare app store assets (screenshots, description, icon)
3. Build signed APK/AAB
4. Submit for review
5. Handle any feedback from Google
6. Publish!

---

## Technical Decisions to Make

### Backend Framework
**Recommendation**: FastAPI (Python)
- **Pros**: You already know Python, fast, modern, auto API docs
- **Alternatives**: Django REST, Node.js + Express, Flask

### Database
**Recommendation**: PostgreSQL
- **Pros**: Reliable, good for structured data, free hosting available
- **Alternatives**: MongoDB (if prefer NoSQL), SQLite (simpler but limited)

### Mobile Framework
**Recommendation**: React Native
- **Pros**: Cross-platform (iOS + Android), large community, JavaScript
- **Alternatives**: Flutter (faster, better UI), Native Android (best performance)

### Deployment Platform
**Recommendation**: Railway.app (for MVP)
- **Pros**: Free tier, easy deployment, built-in PostgreSQL
- **Alternatives**: DigitalOcean, Google Cloud, AWS

---

## Questions for User (Ask in Terminal Session)

1. **Backend preference**: FastAPI (Python) or Node.js + Express (JavaScript)?
2. **Mobile preference**: React Native (cross-platform) or Native Android (Android-only)?
3. **Deployment**: Quick MVP on Railway (free) or production-ready on DigitalOcean ($6/month)?
4. **Features priority**: What features are must-have for v1.0?
   - Movie listings by island ✓
   - Search/filter?
   - Save favorites?
   - Push notifications for new movies?
   - Show movie trailers/details?
   - Buy tickets integration?

---

## Development Workflow

### Local Development (Terminal Session)
```bash
# Navigate to local project
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers"

# Your scrapers are already working
# Next: Build backend API on top of them
```

### Git Workflow
```bash
# Always work on feature branches
git checkout -b feature/backend-api
# Make changes, commit, push
git push -u origin feature/backend-api
```

---

## Important Notes

1. **Don't convert to AI agents** - Traditional scrapers are the right choice for this use case
2. **Scrapers stay server-side** - Never run on mobile devices
3. **Cost model**: Fixed backend cost, not per-user cost
4. **User experience**: Instant cached data, not real-time scraping
5. **Google Play compliance**: Standard app, no special requirements

---

## Files to Reference

- **Current scrapers**: `scrapers/*.py` (already working, don't rewrite)
- **Requirements**: `requirements.txt` (already set up)
- **Documentation**: `README.md`, `ANALYSIS.md`, `SUMMARY.md`

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Backend API running locally
- [ ] Database storing scraped movies
- [ ] API endpoint returns JSON movie data
- [ ] Scrapers write to database (not just JSON files)

### Phase 2 Complete When:
- [ ] Backend deployed and accessible via URL
- [ ] Scrapers run on schedule in cloud
- [ ] API returns fresh data every 2-6 hours

### Phase 3 Complete When:
- [ ] Mobile app shows VOSE movies from API
- [ ] Search and filter working
- [ ] App tested on real Android device

### Phase 4 Complete When:
- [ ] App live on Google Play Store
- [ ] Users can download and use it

---

## Start Here (Terminal Session)

```bash
# 1. Navigate to your local project
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/vose-movies-scrapers"

# 2. Ask Claude Code in terminal:
"I need to build a backend API for my VOSE movie scrapers to prepare
for a mobile app. I want to use FastAPI and PostgreSQL. The scrapers
should write to the database, and the API should serve the cached data.
Can you help me set this up?"

# 3. Start with Phase 1 from the handoff document
```

---

## Contact Context

- **Project Owner**: Working on Google Play Store mobile app
- **Timeline**: Not specified (ask in terminal session)
- **Budget**: Not specified (ask about hosting budget)
- **Experience**: Familiar with Python, new to mobile development

---

**Last Updated**: 2025-10-30
**Created By**: Claude Code (Browser Session)
**Next Step**: Backend API Development (Phase 1)
