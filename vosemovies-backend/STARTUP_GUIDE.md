# VOSE Movies - Development Startup Guide

## Quick Reference

**Backend Location:** `/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend`
**Frontend Location:** `/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend`
**Android Studio:** `/media/squareyes/Evo Plus 2a/android-studio`
**Current Network IP:** `192.168.50.138`

---

## Initial Setup (First Time Only)

**⚠️ IMPORTANT:** If this is your first time setting up the project, or if you moved the project directory, you need to set up the Python virtual environment first.

### Backend Setup

```bash
# Navigate to backend directory
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"

# Create virtual environment (if it doesn't exist or is broken)
python3 -m venv venv

# Install backend dependencies
venv/bin/pip install -r requirements.txt
venv/bin/pip install -r api/requirements.txt
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"

# Install Node.js dependencies (if not already installed)
npm install
```

**✅ You only need to do this once.** After initial setup, use the startup commands below.

---

## Starting the Development Environment

### 1. Start Backend API (FastAPI)

Open Terminal 1:

```bash
# Navigate to backend directory
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"

# Start backend server using the startup script (recommended)
./start-backend.sh

# OR manually:
# source venv/bin/activate
# PYTHONPATH=. python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output:**
```
🚀 Starting VOSE Movies API...
✅ Database initialized
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Verify backend is running:**
```bash
# In a new terminal
curl http://localhost:8000/
# Should return: {"message":"VOSE Movies API","version":"1.0.0"}

# Check showtimes
curl http://localhost:8000/showtimes/today | python3 -m json.tool
```

---

### 2. Run Scrapers (if needed - refresh showtime data)

In Terminal 2 (or after starting backend):

```bash
# Navigate to backend directory
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"

# Run scrapers using the script (recommended)
./run-scrapers.sh

# OR manually:
# source venv/bin/activate
# PYTHONPATH=. python3 scrapers/unified_scraper_db.py
```

**When to run scrapers:**
- At the start of each day to get fresh showtimes
- When testing new features that require current data
- If the app shows "No VOSE showtimes" despite cinemas having showings

**Expected output:**
```
✓ CineCiutat: X VOSE movies found
✓ Aficine: X VOSE movie entries found
✓ SCRAPING COMPLETE - DATA SAVED TO DATABASE
```

---

### 3. Configure Frontend for Device Type

**IMPORTANT:** Before starting the frontend, verify the API URL configuration based on your testing device.

#### For Android Emulator (Default - Already Configured)

File: `/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend/src/services/api/backendApi.ts`

```typescript
export const BACKEND_CONFIG = {
  BASE_URL: 'http://10.0.2.2:8000',  // ✅ Emulator - special alias to host
};
```

#### For Physical Device (Change if needed)

Get your current network IP:
```bash
ip addr show | grep "inet " | grep -v "127.0.0.1" | head -1
```

Update `backendApi.ts`:
```typescript
export const BACKEND_CONFIG = {
  BASE_URL: 'http://192.168.50.138:8000',  // ⚠️ Use your actual network IP
};
```

**⚠️ REMEMBER:** Change this back to `10.0.2.2:8000` when switching back to emulator!

---

### 4. Start Frontend (React Native Expo)

Open Terminal 3 (or Android Studio terminal):

```bash
# Navigate to frontend directory
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"

# Start Expo development server
npx expo start
```

**Expected output:**
```
› Metro waiting on exp://192.168.50.138:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press w │ open web
```

---

### 5. Launch Android Emulator

#### Option A: From Android Studio
1. Open Android Studio: `/media/squareyes/Evo Plus 2a/android-studio/bin/studio.sh`
2. Click "Device Manager" (phone icon in toolbar)
3. Select "Pixel 9" (or your preferred device)
4. Click ▶️ Play button to launch emulator
5. Wait for emulator to fully boot (~30 seconds)

#### Option B: From Terminal
In the Expo terminal, press `a` to automatically launch Android emulator

---

### 6. Load App in Emulator

Once the emulator is running:

1. **In Expo terminal:** Press `a` (if not already loaded)
2. The app should build and install automatically
3. App will open on the emulator

**First load may take 1-2 minutes** for the JavaScript bundle to build.

---

### 7. Verify Everything is Working

**Check Backend Connection:**
- Look at the backend terminal (Terminal 1)
- You should see API requests like:
  ```
  INFO:     127.0.0.1:XXXXX - "GET /showtimes/upcoming?days=7 HTTP/1.1" 200 OK
  ```

**Check App Display:**
- Home screen should show "VOSE Today" section
- Should display movie cards with showtimes
- If no data: Pull down to refresh or press the trash icon to clear cache

---

## Troubleshooting

### Issue: "No module named uvicorn" or "No module named fastapi"

This means the virtual environment doesn't have the required dependencies installed. This typically happens after:
- Moving the project to a new directory
- Cloning the project fresh
- The venv getting corrupted

**Solution:**

```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"

# Recreate the virtual environment
rm -rf venv
python3 -m venv venv

# Install all dependencies
venv/bin/pip install -r requirements.txt
venv/bin/pip install -r api/requirements.txt

# Now start the backend
./start-backend.sh
```

---

### Issue: Script permission denied

If you get "Permission denied" when running `./start-backend.sh` or `./run-scrapers.sh`:

```bash
# Make scripts executable
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
chmod +x start-backend.sh run-scrapers.sh
```

---

### Issue: "No VOSE showtimes" in app

**Solutions:**
1. **Check backend is running:** `curl http://localhost:8000/showtimes/today`
2. **Run scrapers:** See Step 2 above
3. **Verify dates:** Scrapers may have future dates only. Check with:
   ```bash
   curl http://localhost:8000/showtimes/upcoming?days=30 | python3 -c "import sys, json; data=json.load(sys.stdin); print(sorted(set(s['showtime_date'] for s in data)))"
   ```
4. **Clear app cache:** In app, tap trash icon next to "VOSE Today" title
5. **Reload app:** Press `r` in Expo terminal or shake device → "Reload"

---

### Issue: App can't connect to backend

**For Emulator:**
1. **Verify backend URL:** Check `backendApi.ts` shows `http://10.0.2.2:8000`
2. **Backend listening on all interfaces:** Must use `--host 0.0.0.0` when starting uvicorn
3. **Firewall:** Ensure port 8000 is not blocked

**For Physical Device:**
1. **Check network IP:** Run `ip addr show` and update `backendApi.ts`
2. **Same WiFi network:** Phone and computer must be on same network
3. **Firewall:** Allow incoming connections on port 8000

---

### Issue: Emulator won't start

1. **Check Android Studio path:** Verify `/media/squareyes/Evo Plus 2a/android-studio` exists
2. **AVD exists:** Open Device Manager in Android Studio
3. **Disk space:** Emulator needs ~10GB free space
4. **Enable virtualization:** Check BIOS settings for VT-x/AMD-V

---

### Issue: Backend database errors

```bash
# Reset database (⚠️ Deletes all data)
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
rm vose_movies.db

# Restart backend (database will auto-initialize)
./start-backend.sh

# Then in another terminal, run scrapers to populate:
./run-scrapers.sh
```

---

## Daily Workflow

### Morning Startup
1. ✅ Start backend (Terminal 1): `cd vosemovies-backend && ./start-backend.sh`
2. ✅ Run scrapers to get today's showtimes (Terminal 2): `cd vosemovies-backend && ./run-scrapers.sh`
3. ✅ Start frontend (Terminal 3): `cd vosemovies-frontend && npx expo start`
4. ✅ Launch emulator (press `a` in Expo terminal or open from Android Studio)
5. ✅ Start coding!

### Testing Changes
- **Backend changes:** Auto-reload with `--reload` flag
- **Frontend changes:** Auto-reload in Expo, or press `r` to manually reload
- **Database changes:** May need to restart backend

### End of Day
- Stop all servers: `Ctrl+C` in each terminal
- Close emulator
- Commit your changes: `git add . && git commit -m "your message"`

---

## Quick Commands Cheat Sheet

```bash
# Start backend (using script)
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend" && ./start-backend.sh

# Start frontend
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend" && npx expo start

# Run scrapers (using script)
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend" && ./run-scrapers.sh

# Check backend health
curl http://localhost:8000/health

# View today's showtimes
curl http://localhost:8000/showtimes/today | python3 -m json.tool

# Get network IP
ip addr show | grep "inet " | grep -v "127.0.0.1" | head -1
```

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 8000 | http://localhost:8000 |
| Expo Metro | 8081 | http://localhost:8081 |
| Emulator Backend | 10.0.2.2:8000 | Special alias to host |

---

## File Locations Reference

```
Backend Project Structure:
/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend/
├── api/                      # FastAPI backend
│   ├── main.py              # API entry point
│   ├── routers/             # API endpoints
│   └── models/              # Database models
├── scrapers/                # Web scrapers
│   └── unified_scraper_db.py
├── vose_movies.db           # SQLite database
└── venv/                    # Python virtual environment

Frontend Project Structure:
/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend/
├── src/
│   ├── screens/             # App screens
│   ├── services/
│   │   └── api/
│   │       └── backendApi.ts  # ⚠️ API URL configuration
│   └── components/
└── package.json
```

---

## Network Configuration Summary

### Emulator Setup (Default)
- **Backend listens on:** `0.0.0.0:8000` (all interfaces)
- **App connects to:** `10.0.2.2:8000` (emulator's special alias)
- **Config file:** `backendApi.ts` → `BASE_URL: 'http://10.0.2.2:8000'`

### Physical Device Setup
- **Backend listens on:** `0.0.0.0:8000` (all interfaces)
- **App connects to:** `192.168.50.138:8000` (your actual IP)
- **Config file:** `backendApi.ts` → `BASE_URL: 'http://192.168.50.138:8000'`
- **Requirements:** Both devices on same WiFi network

---

**Last Updated:** 2025-11-11
**Network IP:** 192.168.50.138
**Note:** All Python commands use `python3` (not `python`). Scripts are the recommended method for starting backend/scrapers.
