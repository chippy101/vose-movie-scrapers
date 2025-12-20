# Deployment Guide

Deploy your VOSE Movies backend to production on Railway or DigitalOcean.

## Option 1: Railway (Recommended for Beginners)

### Pros
- Free tier includes PostgreSQL
- Automatic HTTPS
- Easy GitHub integration
- No server management

### Cons
- Free tier limits: 500 hours/month, $5 credit
- May need paid plan for 24/7 uptime (~$5-10/month)

### Steps

1. **Sign up at Railway**: https://railway.app/

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select your repository

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will create a database and provide connection string

4. **Configure Environment Variables**

   In your Railway project settings, add:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-linked from Postgres service
   API_HOST=0.0.0.0
   API_PORT=8000
   CORS_ORIGINS=https://your-mobile-app-domain.com
   SCRAPER_HEADLESS=True
   SCRAPER_INTERVAL_HOURS=4
   ```

5. **Create Procfile** (in project root):
   ```
   web: cd api && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

6. **Create railway.json** (optional, for custom config):
   ```json
   {
     "build": {
       "builder": "nixpacks"
     },
     "deploy": {
       "startCommand": "cd api && uvicorn main:app --host 0.0.0.0 --port $PORT",
       "restartPolicyType": "on-failure",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

7. **Deploy**
   - Push to GitHub
   - Railway auto-deploys
   - Get your public URL: `https://your-app.up.railway.app`

8. **Set Up Cron Job for Scraping**

   Railway doesn't have built-in cron. Options:

   **Option A: Use GitHub Actions** (Recommended)

   Create `.github/workflows/scraper.yml`:
   ```yaml
   name: Run Scraper
   on:
     schedule:
       - cron: '0 */4 * * *'  # Every 4 hours
     workflow_dispatch:  # Manual trigger

   jobs:
     scrape:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-python@v4
           with:
             python-version: '3.11'
         - name: Install dependencies
           run: |
             pip install -r requirements.txt
             pip install -r api/requirements.txt
             sudo apt-get install chromium-chromedriver
         - name: Run scraper
           env:
             DATABASE_URL: ${{ secrets.DATABASE_URL }}
           run: |
             cd scrapers
             python unified_scraper_db.py
   ```

   Add `DATABASE_URL` to GitHub Secrets (Settings → Secrets → Actions)

   **Option B: External Cron Service**

   Use cron-job.org to hit an endpoint:
   1. Add endpoint to API: `POST /api/trigger-scrape`
   2. Protect with API key
   3. Set up cron-job.org to call it every 4 hours

9. **Initialize Database**

   Connect to Railway PostgreSQL:
   ```bash
   # Get connection string from Railway dashboard
   psql "postgresql://user:pass@hostname:port/railway"

   # Or use Railway CLI
   railway run python -c "from api.database.config import init_db; init_db()"
   ```

## Option 2: DigitalOcean Droplet

### Pros
- Full control
- Predictable pricing ($6-12/month)
- Better for 24/7 operation
- Can run cron jobs natively

### Cons
- Requires server management
- Need to configure HTTPS manually
- More setup complexity

### Steps

1. **Create Droplet**
   - Sign up at DigitalOcean
   - Create Ubuntu 22.04 LTS droplet ($6/month)
   - Add SSH key

2. **Initial Server Setup**

   ```bash
   # SSH into droplet
   ssh root@your-droplet-ip

   # Update system
   apt update && apt upgrade -y

   # Install dependencies
   apt install -y python3 python3-pip postgresql postgresql-contrib nginx chromium-chromedriver

   # Create non-root user
   adduser vose
   usermod -aG sudo vose
   su - vose
   ```

3. **Set Up PostgreSQL**

   ```bash
   sudo -u postgres psql

   CREATE DATABASE vose_movies;
   CREATE USER vose_user WITH PASSWORD 'secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE vose_movies TO vose_user;
   \c vose_movies
   GRANT ALL ON SCHEMA public TO vose_user;
   \q
   ```

4. **Deploy Application**

   ```bash
   # Clone your repository
   cd /home/vose
   git clone https://github.com/yourusername/vose-movies-scrapers.git
   cd vose-movies-scrapers

   # Install Python dependencies
   pip3 install -r requirements.txt
   pip3 install -r api/requirements.txt

   # Create .env file
   cp api/.env.example api/.env
   nano api/.env
   # Edit with your settings

   # Initialize database
   python3 -c "from api.database.config import init_db; init_db()"

   # Run initial scrape
   cd scrapers
   python3 unified_scraper_db.py
   ```

5. **Set Up systemd Service**

   Create `/etc/systemd/system/vose-api.service`:
   ```ini
   [Unit]
   Description=VOSE Movies API
   After=network.target postgresql.service

   [Service]
   Type=simple
   User=vose
   WorkingDirectory=/home/vose/vose-movies-scrapers/api
   ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
   Restart=always
   RestartSec=10
   Environment="DATABASE_URL=postgresql://vose_user:password@localhost/vose_movies"

   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable vose-api
   sudo systemctl start vose-api
   sudo systemctl status vose-api
   ```

6. **Set Up Nginx Reverse Proxy**

   Create `/etc/nginx/sites-available/vose-api`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable:
   ```bash
   sudo ln -s /etc/nginx/sites-available/vose-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Set Up SSL with Let's Encrypt**

   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

8. **Set Up Scraper Cron Job**

   ```bash
   crontab -e

   # Add:
   0 */4 * * * cd /home/vose/vose-movies-scrapers/scrapers && /usr/bin/python3 unified_scraper_db.py >> /home/vose/scraper.log 2>&1
   ```

9. **Set Up Firewall**

   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

## Option 3: DigitalOcean App Platform

Simpler than Droplet, similar to Railway:

1. Create account at DigitalOcean
2. Go to App Platform → Create App
3. Connect GitHub repository
4. Add PostgreSQL database
5. Configure build and run commands
6. Set environment variables
7. Deploy

Pricing: ~$12/month (includes database)

## Post-Deployment Checklist

- [ ] API is accessible at public URL
- [ ] Database is populated with data
- [ ] Scraper cron job is running
- [ ] HTTPS/SSL is configured
- [ ] CORS is configured for mobile app
- [ ] Environment variables are secure
- [ ] Backups are configured (database)
- [ ] Monitoring is set up (optional: UptimeRobot, Sentry)
- [ ] Mobile app API base URL is updated

## Monitoring & Maintenance

### Check API Health
```bash
curl https://your-api.com/health
```

### Monitor Scraper Runs
```sql
SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 10;
```

### Check Logs

**Railway**: View in dashboard

**DigitalOcean**:
```bash
# API logs
sudo journalctl -u vose-api -f

# Scraper logs
tail -f /home/vose/scraper.log
```

### Database Backup

**Railway**: Automatic backups included

**DigitalOcean**:
```bash
# Backup
pg_dump -U vose_user vose_movies > backup_$(date +%Y%m%d).sql

# Restore
psql -U vose_user vose_movies < backup_20251030.sql
```

## Cost Comparison

| Service | Monthly Cost | Pros | Cons |
|---------|-------------|------|------|
| Railway Free | $0 (500hrs) | Easy, auto-deploy | Limited uptime |
| Railway Paid | $5-10 | Easy, 24/7 | Less control |
| DO Droplet | $6 | Full control, cron | Setup complexity |
| DO App Platform | $12 | Easy, managed | More expensive |

## Recommendation

- **Learning/Testing**: Railway Free
- **Production (small)**: DigitalOcean Droplet ($6/month)
- **Production (no DevOps)**: Railway Paid ($5-10/month)

## Connecting Mobile App

Update your React Native app's API base URL:

```javascript
// src/config/api.ts
const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'  // Development
  : 'https://your-api.railway.app';  // Production

export default API_BASE_URL;
```

Test from mobile:
```javascript
fetch(`${API_BASE_URL}/showtimes/today?island=Mallorca`)
  .then(res => res.json())
  .then(data => console.log(data));
```
