# Popcorn Pal APK Installation Guide

## APK Location
The release APK has been built successfully and is located at:
```
/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/PopcornPal-v0.1.0.apk
```

**APK Details:**
- Version: 0.1.0
- Package: com.popcornpal.app
- Size: 67 MB
- Build Type: Release

## Important: Backend Server Required

**CRITICAL:** Before installing and using the app, you MUST have the backend server running on your network.

### Start the Backend Server:

```bash
# Navigate to backend directory
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"

# Start the backend (serves on 0.0.0.0:8000)
./start-backend.sh

# In another terminal, run scrapers to populate data
./run-scrapers.sh
```

The app is configured to connect to: `http://192.168.50.138:8000`

**Important Notes:**
- Your backend server must be accessible at `192.168.50.138:8000` on your network
- Both your computer (running the backend) and your mobile device must be on the same WiFi network
- If your IP address changes, you'll need to rebuild the APK with the new IP (or set up a static IP)

## Installation Methods

### Method 1: Transfer via USB (Recommended)

1. **Enable USB Debugging** on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect your device** via USB cable

3. **Install using ADB:**
   ```bash
   adb install "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/PopcornPal-v0.1.0.apk"
   ```

4. **Alternative:** Transfer the APK to your device:
   ```bash
   adb push "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/PopcornPal-v0.1.0.apk" /sdcard/Download/
   ```
   Then install from the device's Downloads folder.

### Method 2: Email/Cloud Transfer

1. **Upload** the APK to Google Drive, Dropbox, or email it to yourself
2. **Download** the APK on your Android device
3. **Enable "Install Unknown Apps"** for your browser/file manager:
   - Settings → Security → Install Unknown Apps
   - Select your browser/file manager and toggle on
4. **Tap the downloaded APK** to install

### Method 3: HTTP Server (Quick Testing)

1. **Start a simple HTTP server** in the project directory:
   ```bash
   cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal"
   python3 -m http.server 8080
   ```

2. **On your mobile device** (same WiFi network):
   - Open browser and go to: `http://192.168.50.138:8080/`
   - Tap on `PopcornPal-v0.1.0.apk` to download
   - Install from Downloads folder

## Testing the App

### Pre-Installation Checklist:
- [ ] Backend server is running (`http://192.168.50.138:8000/health` returns OK)
- [ ] Scrapers have been run (database has showtime data)
- [ ] Both devices are on the same WiFi network
- [ ] You can access `http://192.168.50.138:8000/showtimes/today` from your phone's browser

### After Installation:
1. **Launch the app** - you should see the Popcorn Pal splash screen
2. **Check connectivity** - the app will attempt to load showtimes
3. **If connection fails:**
   - Verify backend is running
   - Check that you can access the backend URL in your phone's browser
   - Ensure WiFi is enabled on both devices
   - Check firewall settings on your computer

### Test Features:
- Browse today's VOSE showtimes
- Filter by island (Mallorca, Menorca, Ibiza)
- View movie details (posters, ratings, descriptions)
- Check cinema locations and details
- Test offline caching (disconnect WiFi after loading data)
- Pull-to-refresh to reload showtimes

## Troubleshooting

### "App Not Installed" Error
- **Solution:** Uninstall any previous version first
  ```bash
  adb uninstall com.popcornpal.app
  ```
  Then reinstall

### "Can't Connect to Backend"
1. **Check backend is running:**
   ```bash
   curl http://192.168.50.138:8000/health
   ```
   Should return: `{"status":"ok","service":"VoseMovies API"}`

2. **Check from your phone's browser:**
   - Open: `http://192.168.50.138:8000/health`
   - If this fails, there's a network connectivity issue

3. **Check firewall:**
   ```bash
   # Allow port 8000 through firewall (Ubuntu/Linux)
   sudo ufw allow 8000/tcp
   ```

4. **Verify IP hasn't changed:**
   ```bash
   ip addr show | grep "inet " | grep -v "127.0.0.1"
   ```
   If different from `192.168.50.138`, you need to rebuild the APK

### "No Showtimes Found"
- **Solution:** Run the scrapers to populate the database
  ```bash
  cd vosemovies-backend
  ./run-scrapers.sh
  ```

### APK is Unsigned Warning
- This is expected for debug/development builds
- Users will need to confirm installation of unsigned apps
- For production, you'd need to sign the APK with a keystore

## Next Steps for Production

When ready to distribute more widely:

1. **Create a signing key:**
   ```bash
   keytool -genkey -v -keystore popcornpal-release.keystore -alias popcornpal -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in `android/gradle.properties`:**
   ```properties
   POPCORNPAL_UPLOAD_STORE_FILE=popcornpal-release.keystore
   POPCORNPAL_UPLOAD_KEY_ALIAS=popcornpal
   POPCORNPAL_UPLOAD_STORE_PASSWORD=your-password
   POPCORNPAL_UPLOAD_KEY_PASSWORD=your-password
   ```

3. **Deploy backend to cloud** (Railway, DigitalOcean, etc.)
   - Get a permanent URL (e.g., `https://api.popcornpal.com`)
   - Update `.env` with production URL
   - Rebuild APK

4. **Optimize APK:**
   - Enable ProGuard/R8 minification
   - Optimize images and assets
   - Remove unnecessary dependencies

5. **Prepare for Play Store:**
   - Add privacy policy
   - Create screenshots and promotional graphics
   - Set up Google Play Console account
   - Build signed AAB (Android App Bundle)

## Build Information

**Built with:**
- Expo SDK 54
- React Native 0.81.5
- Android SDK 34 (targetSdkVersion)
- Gradle 8.14.3

**Environment:**
- Backend URL: http://192.168.50.138:8000
- TMDB API Key: Configured in .env
- Build Type: Release
- Architecture: ARM64-v8a, ARMv7, x86_64, x86

**Permissions Required:**
- ACCESS_COARSE_LOCATION - For finding nearby cinemas
- ACCESS_FINE_LOCATION - For precise location sorting
- INTERNET - For fetching showtime data
- ACCESS_NETWORK_STATE - For checking connectivity

---

Generated: 2025-11-26
Version: 0.1.0
