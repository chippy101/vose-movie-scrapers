# Deployment Guide

This guide covers deploying VoseMovies to production environments.

## Table of Contents

- [Backend Deployment](#backend-deployment)
  - [Railway](#option-1-railway-recommended)
  - [DigitalOcean](#option-2-digitalocean-app-platform)
  - [AWS EC2](#option-3-aws-ec2)
  - [Self-Hosted VPS](#option-4-self-hosted-vps)
- [Frontend Deployment](#frontend-deployment)
  - [Google Play Store](#google-play-store-android)
  - [Internal Distribution](#internal-distribution-testing)
- [Database](#database-considerations)
- [Monitoring](#monitoring-and-maintenance)
- [Automation](#automated-scraper-scheduling)

---

## Backend Deployment

### Prerequisites

- Backend code deployed with internet access
- PostgreSQL database (recommended) or SQLite
- TMDB API key
- ChromeDriver installed (for scrapers)
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt or provider)

### Option 1: Railway (Recommended)

**Pros:** Easy setup, auto-scaling, built-in PostgreSQL, HTTPS included
**Cost:** ~$5-20/month depending on usage

#### Steps:

1. **Create Railway Account**
   ```
   Visit: https://railway.app
   Sign up with GitHub
   ```

2. **Create New Project**
   ```
   Dashboard → New Project → Deploy from GitHub repo
   Select: yourusername/vosemovies
   ```

3. **Add PostgreSQL Database**
   ```
   Project → New → Database → PostgreSQL
   Copy DATABASE_URL from settings
   ```

4. **Configure Environment Variables**
   ```
   Backend service → Variables → Add:

   TMDB_API_KEY=your_tmdb_api_key
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   API_HOST=0.0.0.0
   API_PORT=8000
   SCRAPER_HEADLESS=true
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

5. **Install ChromeDriver**

   Create `Dockerfile` in backend root:
   ```dockerfile
   FROM python:3.10-slim

   # Install Chrome and ChromeDriver
   RUN apt-get update && apt-get install -y \
       chromium \
       chromium-driver \
       && rm -rf /var/lib/apt/lists/*

   WORKDIR /app

   COPY requirements.txt api/requirements.txt ./
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

6. **Deploy**
   ```
   Railway auto-deploys on git push
   Note your Railway URL: https://your-app.railway.app
   ```

7. **Set Up Cron Job (Scrapers)**

   Railway doesn't support cron natively. Options:

   **A. External Cron Service:**
   ```
   Use cron-job.org or similar:
   Schedule: https://your-app.railway.app/scrape (create endpoint)
   Frequency: Every 4 hours
   ```

   **B. Separate Worker Service:**
   Create `worker.py`:
   ```python
   import schedule
   import time
   from scrapers.unified_scraper_db import main as scrape

   schedule.every(4).hours.do(scrape)

   while True:
       schedule.run_pending()
       time.sleep(60)
   ```

   Deploy as separate Railway service

### Option 2: DigitalOcean App Platform

**Pros:** Simple deployment, built-in database, good docs
**Cost:** ~$12-25/month

#### Steps:

1. **Create App**
   ```
   Apps → Create App → GitHub
   Repository: yourusername/vosemovies
   Branch: main
   ```

2. **Configure Backend**
   ```
   Component: Backend service
   Build Command: pip install -r requirements.txt && pip install -r api/requirements.txt
   Run Command: uvicorn api.main:app --host 0.0.0.0 --port 8000
   HTTP Port: 8000
   ```

3. **Add PostgreSQL Database**
   ```
   Resources → Add Database → Dev Database (PostgreSQL)
   Note: $7/month for managed PostgreSQL
   ```

4. **Set Environment Variables**
   ```
   Settings → App-Level Environment Variables:

   TMDB_API_KEY=your_key
   DATABASE_URL=${db.DATABASE_URL}
   CORS_ORIGINS=https://your-frontend.com
   ```

5. **Deploy**
   ```
   DigitalOcean deploys automatically
   Your URL: https://your-app.ondigitalocean.app
   ```

### Option 3: AWS EC2

**Pros:** Full control, scalable, many AWS integrations
**Cost:** ~$10-50/month (t2.micro eligible for free tier)

#### Steps:

1. **Launch EC2 Instance**
   ```
   AMI: Ubuntu 22.04 LTS
   Instance Type: t2.small or larger
   Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
   ```

2. **SSH into Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y python3.10 python3-pip python3-venv git \
       chromium-browser chromium-chromedriver nginx certbot python3-certbot-nginx
   ```

4. **Clone and Setup**
   ```bash
   git clone https://github.com/yourusername/vosemovies.git
   cd vosemovies/vosemovies-backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install -r api/requirements.txt
   ```

5. **Configure Environment**
   ```bash
   nano .env
   # Add: TMDB_API_KEY, DATABASE_URL (use PostgreSQL RDS), etc.
   ```

6. **Create Systemd Service**
   ```bash
   sudo nano /etc/systemd/system/vosemovies.service
   ```

   Content:
   ```ini
   [Unit]
   Description=VoseMovies API
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/vosemovies/vosemovies-backend
   Environment="PATH=/home/ubuntu/vosemovies/vosemovies-backend/venv/bin"
   ExecStart=/home/ubuntu/vosemovies/vosemovies-backend/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   Enable:
   ```bash
   sudo systemctl enable vosemovies
   sudo systemctl start vosemovies
   ```

7. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/vosemovies
   ```

   Content:
   ```nginx
   server {
       server_name api.vosemovies.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vosemovies /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **SSL Certificate**
   ```bash
   sudo certbot --nginx -d api.vosemovies.com
   ```

9. **Setup Cron for Scrapers**
   ```bash
   crontab -e
   # Add: 0 */4 * * * cd /home/ubuntu/vosemovies/vosemovies-backend && ./run-scrapers.sh
   ```

### Option 4: Self-Hosted VPS

Similar to AWS EC2, but use providers like:
- Hetzner (~€5/month)
- Linode (~$5/month)
- Vultr (~$6/month)

Follow AWS EC2 steps above.

---

## Frontend Deployment

### Google Play Store (Android)

#### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- Android app signing key
- Prepared assets (icon, screenshots, descriptions)

#### Steps:

1. **Prepare App for Production**

   Update `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.0",
       "android": {
         "versionCode": 1,
         "package": "com.vosemovies.app",
         "permissions": ["INTERNET"]
       }
     }
   }
   ```

   Update `backendApi.ts`:
   ```typescript
   export const BACKEND_CONFIG = {
     BASE_URL: 'https://api.vosemovies.com',  // Production URL
   };
   ```

2. **Build APK/AAB**
   ```bash
   cd vosemovies-frontend
   eas build --platform android --profile production
   # Follow prompts to configure EAS Build
   ```

3. **Test Build**
   - Download APK from EAS
   - Install on physical device
   - Test all features
   - Verify backend connectivity

4. **Create Play Store Listing**
   ```
   Google Play Console → Create App

   Required:
   - App name: VoseMovies
   - Default language: English
   - App/Game: App
   - Free/Paid: Free
   ```

5. **Prepare Store Assets**

   **Graphics:**
   - Icon: 512x512 PNG
   - Feature graphic: 1024x500 PNG
   - Screenshots: At least 2 (1080x1920)
   - Optional: Promo video

   **Descriptions:**
   - Short description (80 chars): "Find original version movies with Spanish subtitles in Balearic Islands"
   - Full description: See `PLAY_STORE_DESCRIPTION.md`
   - Category: Entertainment
   - Content rating: Unrated (complete questionnaire)

   **Privacy Policy:**
   - Host PRIVACY_POLICY.md online (GitHub Pages)
   - URL: https://yourusername.github.io/vosemovies/privacy

   **Contact:**
   - Email: support@vosemovies.com
   - Website: https://vosemovies.com (optional)

6. **Upload APK/AAB**
   ```
   Production → Create Release
   Upload AAB
   Release name: 1.0.0
   Release notes: "Initial release - Find VOSE movies across Balearic Islands"
   ```

7. **Content Rating**
   - Complete questionnaire (no violence, adult content, etc.)
   - Likely rating: Everyone

8. **Review and Publish**
   - Review all sections (green checkmarks)
   - Submit for review
   - Review time: 1-3 days typically

9. **Post-Launch**
   - Monitor crash reports (Play Console)
   - Respond to user reviews
   - Track installs and ratings

### Internal Distribution (Testing)

**Before Play Store submission, test with internal testers:**

#### Option A: Expo Go (Development)
```bash
npx expo start
# Scan QR code with Expo Go app
```

#### Option B: TestFlight (iOS - Future)
- Requires Apple Developer Account ($99/year)
- Use EAS Build for iOS

#### Option C: Firebase App Distribution
```bash
# Build APK
eas build --platform android --profile preview

# Upload to Firebase App Distribution
# Add testers via email
```

---

## Database Considerations

### Development: SQLite
- ✅ Simple, file-based
- ✅ No setup required
- ❌ Not suitable for production with multiple scrapers

### Production: PostgreSQL (Recommended)

**Providers:**
- Railway: Included in platform
- DigitalOcean Managed Database: $7/month
- AWS RDS: ~$15/month (db.t3.micro)
- Supabase: Free tier available

**Migration from SQLite:**
```bash
# Dump SQLite
sqlite3 vose_movies.db .dump > dump.sql

# Convert to PostgreSQL format (use online tools)
# Import to PostgreSQL
psql -U postgres -d vosemovies -f dump_postgres.sql
```

**Environment Variable:**
```bash
DATABASE_URL=postgresql://user:password@host:5432/vosemovies
```

---

## Monitoring and Maintenance

### Health Checks

**Set up monitoring:**
1. **UptimeRobot** (free tier)
   - Monitor: https://api.vosemovies.com/health
   - Interval: Every 5 minutes
   - Alert: Email if down

2. **Better Uptime** (paid)
   - Advanced monitoring
   - Incident management

### Logging

**Backend logs:**
```python
# api/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

**View logs:**
- Railway: Dashboard → Logs
- DigitalOcean: App → Logs
- AWS: CloudWatch Logs

### Error Tracking

**Sentry (Recommended):**
```bash
pip install sentry-sdk
```

```python
# api/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### Database Backups

**Automated backups:**
- Railway: Automatic daily backups
- DigitalOcean: Daily backups included
- AWS RDS: Enable automated backups (7-day retention)

**Manual backup:**
```bash
pg_dump -h host -U user -d vosemovies > backup_$(date +%Y%m%d).sql
```

---

## Automated Scraper Scheduling

### Option 1: Cron (Linux)
```bash
crontab -e
# Add: 0 */4 * * * cd /path/to/backend && ./run-scrapers.sh >> scraper.log 2>&1
```

### Option 2: Systemd Timer (Linux)
```bash
# /etc/systemd/system/vosemovies-scraper.timer
[Unit]
Description=VoseMovies scraper timer

[Timer]
OnCalendar=*-*-* 00,04,08,12,16,20:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### Option 3: External Cron Service
- **cron-job.org**: Free tier, 60 jobs
- **EasyCron**: Free tier, 1 cron job
- **Create endpoint:** `GET /scrape` (with auth token)

### Option 4: GitHub Actions (Scheduled Workflow)
```yaml
# .github/workflows/scraper.yml
name: Run Scrapers
on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger backend scraper
        run: |
          curl -X POST https://api.vosemovies.com/scrape \
               -H "Authorization: Bearer ${{ secrets.SCRAPER_TOKEN }}"
```

---

## Post-Deployment Checklist

### Backend
- [ ] API accessible via HTTPS
- [ ] Health check endpoint responding
- [ ] Database connected
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Scrapers running on schedule
- [ ] Logs being captured
- [ ] Backups configured

### Frontend
- [ ] Builds successfully
- [ ] Backend URL updated to production
- [ ] App tested on physical devices
- [ ] Play Store assets prepared
- [ ] Privacy policy hosted
- [ ] Screenshots captured
- [ ] Content rating completed

### Security
- [ ] SSL certificate valid
- [ ] Secrets not hardcoded
- [ ] CORS restrictive (not `*`)
- [ ] Rate limiting enabled
- [ ] Monitoring active
- [ ] Error tracking configured

### Legal
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] TMDB attribution displayed
- [ ] Cinema attributions included

---

## Rollback Plan

If deployment fails:

1. **Keep previous version running** (use Railway preview environments or AWS blue-green deployment)
2. **Database migrations:** Keep migrations reversible
3. **Frontend:** APK rollback via Play Store (use staged rollouts)
4. **Backend:** Revert git commit and redeploy

---

## Cost Estimate

### Minimal Setup (~$12/month)
- Railway (backend + PostgreSQL): $10
- Domain name: $12/year ($1/month)
- SSL: Free (Let's Encrypt)

### Recommended Setup (~$32/month)
- Railway backend: $20
- DigitalOcean PostgreSQL: $7
- Domain: $1/month
- Monitoring (Better Uptime): $10
- Google Play Developer: $25 one-time

### Enterprise Setup (~$100/month)
- AWS EC2: $20
- AWS RDS PostgreSQL: $30
- AWS Route 53: $1
- Sentry error tracking: $26
- CDN (CloudFront): $5
- Backups and monitoring: $10+

---

## Support

- Deployment issues: deployment@vosemovies.com
- General support: support@vosemovies.com
- GitHub: https://github.com/yourusername/vosemovies/issues

---

**Last updated:** November 11, 2025
