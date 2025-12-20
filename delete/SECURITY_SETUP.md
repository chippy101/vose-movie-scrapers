# Security Setup Guide

## = API Key Management

### IMPORTANT: Never commit API keys to git!

This project uses environment variables to keep sensitive data secure. API keys are stored in `.env` files which are **excluded from git** via `.gitignore`.

---

## Backend Setup

### 1. Get a TMDB API Key

1. Create a free account at [TMDB](https://www.themoviedb.org/signup)
2. Go to [Account Settings > API](https://www.themoviedb.org/settings/api)
3. Request an API key (choose "Developer" option)
4. Copy your "API Key (v3 auth)"

### 2. Configure Backend Environment

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
```

### 3. Verify Configuration

```bash
# Start the backend
./start-backend.sh

# Check health endpoint
curl http://localhost:8000/health

# Should return: {"status":"healthy"}
```

---

## Frontend Setup

### 1. Configure Frontend Environment

```bash
cd vosemovies-frontend

# Copy the example file
cp .env.example .env

# Edit .env and add your TMDB API key
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

### 2. Get Your Local IP Address (for Physical Devices)

**Linux/Mac:**
```bash
ip addr show | grep "inet " | grep -v "127.0.0.1" | head -1
# Or: ifconfig | grep "inet " | grep -v "127.0.0.1"
```

**Windows:**
```bash
ipconfig | findstr "IPv4"
```

### 3. Verify Configuration

```bash
# Start Expo
npx expo start

# You should NOT see this error:
# L TMDB API key is not configured!

# If you see the error, check your .env file exists and has the correct format
```

---

## Security Checklist

###  Before Committing Code

- [ ] `.env` files are listed in `.gitignore`
- [ ] No API keys in source code (`grep -r "8265bd1679663a7ea12ac168da84d2e8"` returns nothing)
- [ ] `.env.example` files exist but contain placeholder values only
- [ ] Environment variable validation is in place

###  Before Production Deployment

- [ ] Generate new API keys for production (don't reuse development keys)
- [ ] Use platform-specific environment variable systems:
  - **Railway/Heroku**: Set via dashboard
  - **DigitalOcean App Platform**: Set in app settings
  - **AWS**: Use Secrets Manager or Parameter Store
- [ ] Restrict CORS to production frontend domain only
- [ ] Enable rate limiting on API endpoints
- [ ] Use HTTPS for all API communication

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

## Common Issues

### Issue: "TMDB API key is not configured!"

**Solution:**
1. Check `.env` file exists: `ls -la vosemovies-frontend/.env`
2. Check format: `cat vosemovies-frontend/.env`
3. Ensure it starts with `EXPO_PUBLIC_`: `EXPO_PUBLIC_TMDB_API_KEY=...`
4. Restart Expo with cache clear: `npx expo start -c`

### Issue: Backend returns 401 Unauthorized from TMDB

**Solution:**
1. Verify API key is correct: Check TMDB dashboard
2. Check backend loaded the key: Add debug log in backend startup
3. Ensure no extra spaces in `.env` file: `TMDB_API_KEY=key` (no spaces around `=`)

### Issue: Frontend can't connect to backend

**Solution:**
1. Check backend is running: `curl http://localhost:8000/health`
2. Check `EXPO_PUBLIC_BACKEND_URL` in `.env`
3. For physical devices, use computer's IP not `localhost`
4. Restart Expo: `npx expo start -c`

---

## Additional Security Measures (Future)

- [ ] Implement API key rotation schedule (every 90 days)
- [ ] Add secret scanning to CI/CD pipeline (e.g., `truffleHog`, `git-secrets`)
- [ ] Use HashiCorp Vault or AWS Secrets Manager for production
- [ ] Implement API request signing for backend-to-frontend communication
- [ ] Add rate limiting per API key (prevent abuse)

---

**Last Updated:** 2025-11-18
**Status:**  API keys secured with environment variables
