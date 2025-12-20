# Quick APK Testing Setup

## 🎯 Your APK is Ready!

**Location:** `/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/PopcornPal-v0.1.0.apk`

**Size:** 67 MB
**Version:** 0.1.0
**Package:** com.popcornpal.app

## 🚀 Quick Start (3 Steps)

### Step 1: Start Backend Server

Open a terminal and run:
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./start-backend.sh
```

Keep this terminal open! The backend must stay running while you use the app.

### Step 2: Populate Database (First Time Only)

Open a second terminal:
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./run-scrapers.sh
```

This takes 2-3 minutes to scrape cinema data.

### Step 3: Install APK on Your Phone

**Option A - USB Install (Fastest):**
```bash
# Connect phone via USB, enable USB debugging
adb install "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/PopcornPal-v0.1.0.apk"
```

**Option B - File Transfer:**
1. Copy `PopcornPal-v0.1.0.apk` to your phone via USB/Bluetooth/Email
2. On phone: Settings → Security → Enable "Install Unknown Apps" for your file manager
3. Tap the APK file to install

## ✅ Verify Before Testing

Run this command to check backend is working:
```bash
curl http://192.168.50.138:8000/health
```

Expected output: `{"status":"ok","service":"VoseMovies API"}`

Or open in your phone's browser: `http://192.168.50.138:8000/health`

## 📱 Testing on Your Phone

1. **Ensure both devices are on the same WiFi** (192.168.50.x network)
2. **Launch Popcorn Pal app**
3. **Expected behavior:**
   - App loads VOSE showtimes
   - Shows movies playing in Mallorca/Menorca/Ibiza
   - Displays posters, ratings, cinema info

## ⚠️ If App Won't Connect

1. **Check backend is running:**
   ```bash
   lsof -i :8000
   ```
   Should show Python process on port 8000

2. **Check firewall (if needed):**
   ```bash
   sudo ufw allow 8000/tcp
   ```

3. **Verify both devices on same WiFi**

4. **Test backend from phone's browser first:**
   - Open: `http://192.168.50.138:8000/showtimes/today`
   - If this fails, it's a network issue, not the app

## 🔄 Updating Backend URL (If IP Changes)

If your computer's IP address changes:

1. **Get new IP:**
   ```bash
   ip addr show | grep "inet " | grep -v "127.0.0.1"
   ```

2. **Update .env file:**
   ```bash
   cd vosemovies-frontend
   # Edit .env and change EXPO_PUBLIC_BACKEND_URL
   ```

3. **Rebuild APK:**
   ```bash
   cd vosemovies-frontend
   rm -rf android/
   npx expo prebuild --platform android --clean
   cd android && ./gradlew assembleRelease
   ```

4. **New APK location:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

## 📚 Full Documentation

See `APK_INSTALLATION_GUIDE.md` for complete installation methods, troubleshooting, and production deployment info.

---

**Current Configuration:**
- Backend URL: `http://192.168.50.138:8000`
- Your WiFi Network: 192.168.50.x
- Build Date: 2025-11-26
