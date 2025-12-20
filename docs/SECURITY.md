# Security Configuration Guide

This document covers API key management and CORS security configuration for the PopcornPal application.

## Table of Contents
- [API Key Management](#api-key-management)
- [CORS Configuration](#cors-configuration)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## API Key Management

### IMPORTANT: Never commit API keys to git!

This project uses environment variables to keep sensitive data secure. API keys are stored in `.env` files which are **excluded from git** via `.gitignore`.

### Getting a TMDB API Key

1. Create a free account at [TMDB](https://www.themoviedb.org/signup)
2. Go to [Account Settings > API](https://www.themoviedb.org/settings/api)
3. Request an API key (choose "Developer" option)
4. Copy your "API Key (v3 auth)"

### Backend Configuration

```bash
cd vosemovies-backend

# Copy the example file
cp .env.example .env

# Edit .env and add your TMDB API key
nano .env  # or use your preferred editor
```

Update the `.env` file:
```bash
TMDB_API_KEY=your_actual_api_key_here

# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL=sqlite:///./vose_movies.db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development

# CORS (see CORS section below)
# CORS_ORIGINS=https://your-frontend-domain.com
```

### Frontend Configuration

```bash
cd vosemovies-frontend

# Copy the example file
cp .env.example .env

# Edit .env
nano .env  # or use your preferred editor
```

Update the `.env` file:
```bash
# TMDB API Key (same key as backend)
EXPO_PUBLIC_TMDB_API_KEY=your_actual_api_key_here

# Backend URL - choose based on your setup:

# For Android Emulator (AVD):
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000

# For Physical Device (replace with your computer's IP):
# EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8000

# For Production:
# EXPO_PUBLIC_BACKEND_URL=https://your-production-api.com
```

### Getting Your Local IP Address (for Physical Devices)

**Linux/Mac:**
```bash
ip addr show | grep "inet " | grep -v "127.0.0.1" | head -1
# Or: ifconfig | grep "inet " | grep -v "127.0.0.1"
```

**Windows:**
```bash
ipconfig | findstr "IPv4"
```

### Verify Configuration

```bash
# Backend
cd vosemovies-backend
./start-backend.sh
curl http://localhost:8000/health  # Should return: {"status":"healthy"}

# Frontend
cd vosemovies-frontend
npx expo start  # Should NOT show "TMDB API key is not configured!" error
```

---

## CORS Configuration

Cross-Origin Resource Sharing (CORS) has been configured with environment-aware security:
- **Development**: Permissive (allows localhost and common development origins)
- **Production**: Restrictive (requires explicit whitelist configuration)

### Development Mode (Default)

When `ENVIRONMENT=development` (or not set), the backend automatically allows these origins:
- `http://localhost:8081` (Expo web)
- `http://localhost:19006` (Expo web alternative)
- `http://localhost:19000` (Expo DevTools)
- `http://10.0.2.2:8081` (Android emulator)
- `http://127.0.0.1:8081` (Localhost alternative)

**No configuration needed** - works out of the box for local development!

Backend will print on startup:
```
🌐 CORS enabled for 5 origin(s) [development mode]
   ✓ http://localhost:8081
   ✓ http://localhost:19006
   ✓ http://localhost:19000
   ✓ http://10.0.2.2:8081
   ✓ http://127.0.0.1:8081
```

### Production Mode

When `ENVIRONMENT=production`, you **MUST** explicitly configure `CORS_ORIGINS`:

```bash
# .env file
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-domain.com,https://app.your-domain.com
```

**If `CORS_ORIGINS` is not set in production**, CORS will be **DISABLED** (no origins allowed) for security.

### Configuration Examples

#### Development (Default)
```bash
# .env
ENVIRONMENT=development
# No CORS_ORIGINS needed - uses defaults
```

#### Custom Development Origins
```bash
# .env
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://192.168.1.100:8081
```
Overrides defaults with your custom origins.

#### Production Deployment
```bash
# .env
ENVIRONMENT=production
CORS_ORIGINS=https://popcornpal.app,https://www.popcornpal.app
```
Only allows requests from specified HTTPS origins.

#### Production Without CORS_ORIGINS (UNSAFE)
```bash
# .env
ENVIRONMENT=production
# CORS_ORIGINS not set
```

Backend will print warning:
```
⚠️  WARNING: Running in production mode without CORS_ORIGINS configured!
⚠️  Set CORS_ORIGINS in .env to whitelist your frontend domain
⚠️  CORS is DISABLED - no origins whitelisted [production mode]
```
All cross-origin requests will be blocked.

### Allowed HTTP Methods

CORS allows these HTTP methods:
- `GET`
- `POST`
- `PUT`
- `DELETE`
- `OPTIONS` (preflight)

All headers are allowed (`allow_headers=["*"]`).

---

## Security Checklist

### ✅ Before Committing Code

- [ ] `.env` files are listed in `.gitignore`
- [ ] No API keys in source code
- [ ] `.env.example` files exist but contain placeholder values only
- [ ] Environment variable validation is in place

### ✅ Before Production Deployment

- [ ] Generate new API keys for production (don't reuse development keys)
- [ ] Set `ENVIRONMENT=production` in backend
- [ ] Configure `CORS_ORIGINS` with your production domain(s)
- [ ] Use platform-specific environment variable systems:
  - **Render**: Set in dashboard Environment section
  - **Railway/Heroku**: Set via dashboard
  - **DigitalOcean**: Set in app settings
- [ ] Use HTTPS for all API communication
- [ ] Switch to PostgreSQL database (not SQLite)
- [ ] Test CORS configuration before deploying

### ✅ Security Best Practices

**DO:**
- Set `ENVIRONMENT=production` for production deployments
- Explicitly configure `CORS_ORIGINS` in production
- Use HTTPS origins in production (`https://`, not `http://`)
- Whitelist only the specific domains you control
- Test CORS configuration before deploying
- Monitor CORS-related errors in production logs
- Rotate API keys every 90 days

**DON'T:**
- Use `allow_origin_regex=r"https?://.*"` (allows ALL origins - insecure!)
- Set `CORS_ORIGINS=*` (not supported for security)
- Forget to configure CORS_ORIGINS in production
- Use HTTP origins in production
- Whitelist untrusted third-party domains
- Commit `.env` files to git
- Hardcode API keys in source code

---

## Troubleshooting

### Issue: "TMDB API key is not configured!"

**Solution:**
1. Check `.env` file exists: `ls -la vosemovies-frontend/.env`
2. Check format: `cat vosemovies-frontend/.env`
3. Ensure it starts with `EXPO_PUBLIC_`: `EXPO_PUBLIC_TMDB_API_KEY=...`
4. Restart Expo with cache clear: `npx expo start -c`

### Issue: Backend returns 401 Unauthorized from TMDB

**Solution:**
1. Verify API key is correct in TMDB dashboard
2. Check backend loaded the key (check startup logs)
3. Ensure no extra spaces in `.env` file: `TMDB_API_KEY=key` (no spaces around `=`)

### Issue: Frontend can't connect to backend

**Solution:**
1. Check backend is running: `curl http://localhost:8000/health`
2. Check `EXPO_PUBLIC_BACKEND_URL` in `.env`
3. For physical devices, use computer's IP not `localhost`
4. Ensure backend and frontend are on same network
5. Restart Expo: `npx expo start -c`

### Issue: "CORS policy blocked my request"

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/showtimes' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Solutions:**
1. Check frontend origin in browser DevTools console error message
2. Add that origin to `CORS_ORIGINS` in backend `.env`
3. Restart backend: `./start-backend.sh`
4. Clear browser cache and retry

### Issue: Backend shows "CORS is DISABLED"

**Cause:** Running in `production` mode without `CORS_ORIGINS` configured

**Solution:**
```bash
# Edit .env
CORS_ORIGINS=https://your-frontend-domain.com

# Restart backend
./start-backend.sh
```

### Issue: CORS works in dev but not production

**Common causes:**
1. Forgot to set `CORS_ORIGINS` environment variable in production
2. Production frontend URL doesn't match `CORS_ORIGINS`
3. Using `http://` instead of `https://` in production `CORS_ORIGINS`

**Solution:**
```bash
# Production .env or environment variables
ENVIRONMENT=production
CORS_ORIGINS=https://your-actual-production-domain.com
```

---

## Rotating API Keys

If you suspect your API key has been compromised:

### 1. Generate New Key
1. Go to [TMDB API Settings](https://www.themoviedb.org/settings/api)
2. Delete the old key
3. Generate a new key

### 2. Update Environment Files
```bash
# Backend
cd vosemovies-backend
nano .env  # Update TMDB_API_KEY

# Frontend
cd vosemovies-frontend
nano .env  # Update EXPO_PUBLIC_TMDB_API_KEY
```

### 3. Restart Services
```bash
# Backend
cd vosemovies-backend
pkill -f uvicorn
./start-backend.sh

# Frontend
cd vosemovies-frontend
npx expo start -c  # -c clears cache
```

---

## Testing CORS

### Test 1: Check Startup Logs

```bash
cd vosemovies-backend
./start-backend.sh
```

Look for the CORS configuration output:
```
🌐 CORS enabled for X origin(s) [MODE mode]
   ✓ http://...
```

### Test 2: Make Cross-Origin Request

```bash
curl -X OPTIONS http://localhost:8000/health \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

Check for `Access-Control-Allow-Origin` header in response.

### Test 3: Test Blocked Origin

```bash
# Set CORS_ORIGINS to specific domain
CORS_ORIGINS=https://example.com

# Try request from different origin
curl -X GET http://localhost:8000/health \
  -H "Origin: https://attacker.com" \
  -v
```

Should NOT see `Access-Control-Allow-Origin` header.

---

## Advanced Configuration

### Multiple Environments

Use different `.env` files:

```bash
# .env.development
ENVIRONMENT=development
# Uses default localhost origins

# .env.staging
ENVIRONMENT=production
CORS_ORIGINS=https://staging.popcornpal.app

# .env.production
ENVIRONMENT=production
CORS_ORIGINS=https://popcornpal.app,https://www.popcornpal.app
```

Load with:
```bash
# Staging
ln -sf .env.staging .env && ./start-backend.sh

# Production
ln -sf .env.production .env && ./start-backend.sh
```

---

**Last Updated:** December 2025
**Status:** ✅ API keys and CORS security implemented with environment-aware configuration
