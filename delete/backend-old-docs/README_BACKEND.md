# VOSE Movies - Backend API

**FastAPI backend with PostgreSQL** for serving VOSE movie showtimes to mobile apps.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)

## 🎯 Overview

This backend provides a **REST API** for VOSE (Versión Original Subtitulada en Español) movie showtimes across the Balearic Islands. It combines:

1. **FastAPI REST API** - Serves cached showtime data
2. **PostgreSQL Database** - Stores movies, cinemas, and showtimes
3. **Python Scrapers** - Scrape cinema websites every 4-6 hours

**Coverage**: ~95-98% of all VOSE movies in Mallorca, Menorca, and Ibiza

## 📐 Architecture

```
Mobile App (React Native)
    ↓ HTTP REST API
FastAPI Backend (:8000)
    ↓ SQLAlchemy ORM
PostgreSQL Database
    ↑ Cron job every 4h
Python Scrapers
    ↑ Selenium + BeautifulSoup
Cinema Websites
```

### Why Traditional Scrapers (Not AI Agents)?

| Aspect | Traditional Scrapers ✅ | AI Agents ❌ |
|--------|------------------------|--------------|
| **Cost** | $5-10/month | $100-1000+/month |
| **Speed** | Instant (cached) | Slow (real-time) |
| **Scalability** | Fixed cost | Per-user cost |
| **Reliability** | Proven stable | Unpredictable |
| **Complexity** | Simple | High |

Cinema websites are **stable and predictable** - no need for expensive AI adaptation.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- ChromeDriver (for scrapers)

### Automated Setup

```bash
# Run setup script
./setup_backend.sh

# Follow the prompts to:
# - Install dependencies
# - Create database
# - Initialize tables
# - Run test scrape
```

### Manual Setup

```bash
# 1. Install dependencies
pip install -r api/requirements.txt
pip install -r requirements.txt

# 2. Create PostgreSQL database
sudo -u postgres psql << EOF
CREATE DATABASE vose_movies;
CREATE USER vose_user WITH PASSWORD 'vose_pass';
GRANT ALL PRIVILEGES ON DATABASE vose_movies TO vose_user;
EOF

# 3. Configure environment
cp api/.env.example api/.env
# Edit api/.env with your database credentials

# 4. Initialize database
python -c "from api.database.config import init_db; init_db()"

# 5. Run initial scrape
cd scrapers
python unified_scraper_db.py

# 6. Start API server
cd ../api
python main.py
```

API now running at: **http://localhost:8000**

API docs: **http://localhost:8000/docs**

## 📚 API Endpoints

### Showtimes (Main Endpoints)

```bash
# Get today's showtimes
GET /showtimes/today?island=Mallorca

# Get all showtimes with filters
GET /showtimes/?island=Mallorca&from_date=2025-10-30

# Get upcoming week
GET /showtimes/upcoming?days=7&island=Mallorca
```

### Movies

```bash
# Get all movies
GET /movies/

# Get specific movie
GET /movies/{id}

# Get movie showtimes
GET /movies/{id}/showtimes
```

### Cinemas

```bash
# Get all cinemas
GET /cinemas/

# Get islands list
GET /cinemas/islands

# Get specific cinema
GET /cinemas/{id}
```

### System

```bash
# Health check
GET /health

# API info
GET /

# Interactive docs
GET /docs
```

## 📊 Database Schema

```sql
movies
├── id (PK)
├── title (unique)
├── original_title
└── link

cinemas
├── id (PK)
├── name
├── location
├── island (Mallorca, Menorca, Ibiza)
└── website

showtimes
├── id (PK)
├── movie_id (FK)
├── cinema_id (FK)
├── showtime_date
├── showtime_time
├── version (VOSE)
├── is_active (bool)
└── scraped_at

scraper_runs (monitoring)
├── id (PK)
├── scraper_name
├── status (success/failed)
├── movies_found
├── showtimes_found
└── started_at
```

## 🔄 Automated Scraping

### Set Up Cron Job

```bash
# Edit crontab
crontab -e

# Add line to run every 4 hours
0 */4 * * * cd /path/to/scrapers && python3 unified_scraper_db.py >> /tmp/scraper.log 2>&1
```

### Scraper Features

- ✅ Scrapes CineCiutat (Palma)
- ✅ Scrapes Aficine (all islands)
- ✅ Deduplicates movies and cinemas
- ✅ Marks old showtimes as inactive
- ✅ Logs execution stats
- ✅ Error handling and retry

## 🌐 Deployment

### Option 1: Railway (Easy)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Railway
# 3. Add PostgreSQL database
# 4. Set environment variables
# 5. Deploy automatically
```

### Option 2: DigitalOcean (Control)

```bash
# 1. Create Ubuntu droplet ($6/month)
# 2. Install dependencies
# 3. Set up PostgreSQL
# 4. Configure systemd service
# 5. Set up nginx + SSL
# 6. Configure cron job
```

**See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.**

## 📱 Mobile App Integration

### React Native Example

```typescript
// src/services/api.ts
const API_BASE_URL = 'https://your-api.railway.app';

export async function getTodayShowtimes(island: string) {
  const response = await fetch(
    `${API_BASE_URL}/showtimes/today?island=${island}`
  );
  return response.json();
}

// Usage in component
const { data } = useQuery(['showtimes', 'today', island], () =>
  getTodayShowtimes(island)
);
```

## 📁 Project Structure

```
vose-movies-scrapers/
├── api/                          # FastAPI backend
│   ├── database/                 # Database config
│   ├── models/                   # SQLAlchemy models
│   ├── routers/                  # API endpoints
│   ├── schemas/                  # Pydantic schemas
│   ├── services/                 # Business logic
│   ├── main.py                   # FastAPI app
│   └── requirements.txt
├── scrapers/                     # Python scrapers
│   ├── cineciutat_scraper.py
│   ├── aficine_scraper.py
│   └── unified_scraper_db.py    # Database-integrated
├── BACKEND_SETUP.md              # Setup guide
├── DEPLOYMENT.md                 # Deployment guide
├── DATABASE_SCHEMA.md            # Database design
├── PHASE1_COMPLETE.md            # Implementation summary
└── setup_backend.sh              # Automated setup
```

## 🔧 Development

### Run API in Development Mode

```bash
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Run Scrapers Manually

```bash
cd scrapers

# All scrapers
python unified_scraper_db.py

# CineCiutat only (fast)
python unified_scraper_db.py --cineciutat

# Aficine only (complete coverage)
python unified_scraper_db.py --aficine
```

### Database Queries

```bash
# Connect to database
psql -U vose_user -d vose_movies

# View active showtimes
SELECT m.title, c.name, s.showtime_date, s.showtime_time
FROM showtimes s
JOIN movies m ON s.movie_id = m.id
JOIN cinemas c ON s.cinema_id = c.id
WHERE s.is_active = true
ORDER BY s.showtime_date, s.showtime_time;

# View scraper runs
SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 5;
```

## 🎬 Cinema Coverage

| Cinema | Location | Island | Source |
|--------|----------|--------|--------|
| CineCiutat | Palma | Mallorca | cineciutat_scraper.py |
| Aficine Ocimax | Palma | Mallorca | aficine_scraper.py |
| Aficine Rívoli | Palma | Mallorca | aficine_scraper.py |
| Aficine Augusta | Mallorca | Mallorca | aficine_scraper.py |
| Aficine Manacor | Manacor | Mallorca | aficine_scraper.py |
| Aficine | Various | Menorca | aficine_scraper.py |
| Aficine | Various | Ibiza | aficine_scraper.py |

**Total**: 7+ cinema locations across 3 islands

## 📖 Documentation

- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - Detailed setup instructions
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Railway & DigitalOcean deployment
- **[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** - Database design & queries
- **[PHASE1_COMPLETE.md](PHASE1_COMPLETE.md)** - Implementation summary
- **[ANALYSIS.md](ANALYSIS.md)** - Original technical analysis

## 🐛 Troubleshooting

### Database connection fails
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U vose_user -d vose_movies -h localhost

# Verify DATABASE_URL in .env
cat api/.env | grep DATABASE_URL
```

### Scraper fails
```bash
# Check ChromeDriver
chromedriver --version

# Run in non-headless mode
python unified_scraper_db.py --headless=False

# Check logs
cat /tmp/scraper.log
```

### API CORS errors
```bash
# Update CORS_ORIGINS in api/.env
CORS_ORIGINS=http://localhost:19006,exp://192.168.1.x:8081

# Restart API server
```

## 💡 Performance

- **API Response Time**: <100ms (cached data)
- **Database Size**: ~1-5 MB (minimal)
- **Scraping Duration**: 2-5 minutes (all sources)
- **Scraping Frequency**: Every 4 hours (adjustable)
- **Cost**: $5-10/month (fixed, unlimited users)

## 🔐 Security (Production)

- [ ] Change default database password
- [ ] Use environment variables for secrets
- [ ] Enable SSL/HTTPS for API
- [ ] Restrict CORS to your domain
- [ ] Add rate limiting
- [ ] Use reverse proxy (nginx)
- [ ] Enable database backups
- [ ] Set up monitoring

## 🤝 Contributing

Contributions welcome! Ideas:
- Additional cinema sources
- Improved error handling
- Performance optimizations
- Mobile app features
- Analytics and monitoring

## 📄 License

Free and open source. Use for personal, educational, or commercial purposes.

## ⚠️ Disclaimer

This project is for educational purposes. Respect cinema websites' terms of service. Use reasonable scraping intervals (2-3 second delays) to avoid server overload.

---

**Version**: 2.0 (Backend API)
**Status**: Production Ready ✅
**Last Updated**: 2025-10-30

**Need help?** Read [BACKEND_SETUP.md](BACKEND_SETUP.md) or [DEPLOYMENT.md](DEPLOYMENT.md)
