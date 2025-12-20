# Build Status - 2025-11-27 11:20

## Current State

### In Progress
- **v0.1.3 APK Build** - Currently building in background (bash ID: ffc68d)
  - Regenerating JS bundle with correct emulator URL (`10.0.2.2:8000`)
  - Command: `./gradlew :app:createBundleReleaseJsAndAssets :app:assembleRelease`
  - Started: ~11:16
  - Expected output: `/android/app/build/outputs/apk/release/app-release.apk`

### Completed
✅ **Backend Server** - Running on http://localhost:8000
   - Process ID: b12249
   - Status: Healthy with 272 showtimes in database
   - Accessible at: http://10.0.2.2:8000 (emulator) and http://192.168.50.138:8000 (physical devices)

✅ **Maps Fix** - Disabled MapView to prevent crashes
   - File: `src/components/cinema/CinemaMapView.tsx`
   - Shows fallback message: "Map View Disabled - requires Google Maps API key configuration"

✅ **Environment Configuration**
   - File: `src/config/environment.ts`
   - Hardcoded PRODUCTION_CONFIG.BACKEND_URL: `http://10.0.2.2:8000` (for emulator)
   - File: `.env`
   - EXPO_PUBLIC_BACKEND_URL: `http://10.0.2.2:8000` (for emulator builds)

### Built APKs
1. **PopcornPal-v0.1.1-EMULATOR.apk** (67MB)
   - ❌ Issue: Has wrong URL (192.168.50.138:8000)
   - Location: `/vosemovies-frontend/PopcornPal-v0.1.1-EMULATOR.apk`

2. **PopcornPal-v0.1.2-EMULATOR.apk** (67MB)
   - ❌ Issue: Still has wrong URL (192.168.50.138:8000)
   - Reason: JS bundle cached, didn't regenerate
   - Location: `/vosemovies-frontend/PopcornPal-v0.1.2-EMULATOR.apk`

3. **PopcornPal-v0.1.3-EMULATOR.apk** (in progress)
   - ⏳ Building now with fresh JS bundle
   - Should have correct URL: `10.0.2.2:8000`
   - Will be saved to: `/vosemovies-frontend/PopcornPal-v0.1.3-EMULATOR.apk`

### Known Issues

#### Issue 1: Environment Variables Not Updating in APK
**Problem**: `.env` file values get bundled at build time, and JS bundle is cached between builds
**Root Cause**: Gradle doesn't always regenerate JS bundle on incremental builds
**Solution**: Manually delete JS bundle before rebuild:
```bash
rm -rf android/app/build/generated/assets/createBundleReleaseJsAndAssets/
./gradlew :app:createBundleReleaseJsAndAssets :app:assembleRelease
```

#### Issue 2: Maps Crashing App
**Problem**: Google Maps requires API key in AndroidManifest.xml
**Solution**: Disabled MapView temporarily - shows fallback UI
**Future**: Add Google Maps API key or remove feature entirely

## Next Steps When Resuming

### 1. Check Build Status
```bash
# Check if build completed
ls -lh "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend/android/app/build/outputs/apk/release/"

# If completed, copy to project root
cp android/app/build/outputs/apk/release/app-release.apk PopcornPal-v0.1.3-EMULATOR.apk
```

### 2. Install and Test v0.1.3 on Emulator
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"
adb uninstall com.popcornpal.app
adb install PopcornPal-v0.1.3-EMULATOR.apk
adb shell pm clear com.popcornpal.app

# Launch and check logs
adb logcat -c
adb shell monkey -p com.popcornpal.app -c android.intent.category.LAUNCHER 1
sleep 5
adb logcat -d | grep -E "ConnectionTest|BackendAPI|Environment|ShowtimeData" | head -60
```

### 3. Verify Connection
Look for in logs:
```
[Environment] Backend URL sources:
  process.env: http://10.0.2.2:8000
  Constants.extra: http://10.0.2.2:8000
  Production config: http://10.0.2.2:8000
  → Using: http://10.0.2.2:8000  ← SHOULD BE 10.0.2.2 NOW

[ConnectionTest] ✅ SUCCESS  ← SHOULD SEE THIS
```

### 4. If v0.1.3 Works on Emulator

Build for physical devices:

```bash
# 1. Update .env for physical devices
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"
sed -i 's|EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000|EXPO_PUBLIC_BACKEND_URL=http://192.168.50.138:8000|' .env

# 2. Update hardcoded config
# Edit src/config/environment.ts line 14:
# Change: BACKEND_URL: 'http://10.0.2.2:8000',
# To:     BACKEND_URL: 'http://192.168.50.138:8000',

# 3. Update version in app.config.js
# Change: version: "0.1.1"
# To:     version: "0.2.0"
# Change: versionCode: 2
# To:     versionCode: 3

# 4. Clean rebuild
rm -rf android/app/build/generated/assets/createBundleReleaseJsAndAssets/
cd android
./gradlew :app:createBundleReleaseJsAndAssets :app:assembleRelease

# 5. Copy APK
cp app/build/outputs/apk/release/app-release.apk ../PopcornPal-v0.2.0-RELEASE.apk
```

### 5. Test on Physical Device
```bash
adb devices  # Ensure physical device connected
adb -s <DEVICE_ID> uninstall com.popcornpal.app
adb -s <DEVICE_ID> install PopcornPal-v0.2.0-RELEASE.apk
```

## Background Processes Still Running

1. **Backend Server** (b12249) - Keep running
2. **Build Process** (ffc68d) - Let complete, check results later
3. Other gradle daemons - Can be killed if needed: `pkill -9 -f gradle`

## File Changes Since Start
- `src/config/environment.ts` - Updated BACKEND_URL to 10.0.2.2:8000
- `src/components/cinema/CinemaMapView.tsx` - Disabled MapView
- `.env` - Updated BACKEND_URL to 10.0.2.2:8000
- `app.config.js` - Updated version to 0.1.1, versionCode to 2

## Todo List
- [x] Update backend URL to 10.0.2.2:8000 for emulator testing
- [x] Fix maps crash issue on cinema screen
- [ ] Fix main page loading issue (waiting on v0.1.3 build)
- [x] Clean rebuild APK for emulator v0.1.1
- [ ] Test APK on emulator until working (in progress)
- [ ] Rebuild final APK for physical device (192.168.50.138:8000)

---
**Status**: Paused during v0.1.3 build
**Resume**: Check build completion, test v0.1.3, then build for physical devices
**Date**: 2025-11-27 11:20
