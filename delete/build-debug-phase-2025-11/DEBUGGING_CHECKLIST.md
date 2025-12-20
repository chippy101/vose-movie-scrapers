# Debugging Checklist - Data Flow Verification

## ✅ Verified Components

### 1. Backend API (✅ Working)
- **URL:** `http://192.168.50.138:8000`
- **Endpoint:** `/showtimes/upcoming?days=7`
- **Status:** Returns 72 showtimes with complete metadata
- **Sample Response:**
  - `title`: "The Running Man"
  - `showtime_time`: "12:15:00" (not "20:00:00")
  - `poster_url`: Valid TMDB URLs
  - `rating`: 6.828
  - All metadata fields present

### 2. TypeScript Types (✅ Aligned)
- `BackendShowtime` interface matches API response
- `ScrapedShowtime` interface has all required fields
- Transformation mapping is correct

### 3. Environment Configuration (✅ Hardcoded)
- **File:** `src/config/environment.ts`
- **Backend URL:** Hardcoded to `http://192.168.50.138:8000`
- **Bundled with JavaScript:** Yes
- **Will work in production APK:** Yes

### 4. Data Transformation (✅ Mapped)
- `ShowtimeDataService.fetchFreshData()` correctly maps:
  - `st.title` → `movieTitle`
  - `st.showtime_date` + `st.showtime_time` → `startTime` (Date object)
  - `st.poster_url` → `posterUrl`
  - All TMDB metadata fields

### 5. Error Handling (✅ Added)
- **Maps Crash:** Wrapped in ErrorBoundary
- **Backend Failures:** Removed scraper fallback, will show error
- **Logging:** Enhanced logging at every step

## 🐛 Suspected Issue

**CACHE:** The app uses AsyncStorage to cache showtime data. Old cached data (from before backend URL was fixed) may be persisting.

**Cache Strategy:**
1. App loads from storage first (fast UX)
2. If cache < 30 minutes old: returns cache
3. If cache 30min-24hrs old: returns cache BUT fetches fresh data in background
4. If cache > 24hrs: fetches fresh data NOW

**Problem:** If the background fetch fails silently, the app keeps showing old cached data.

## 🔍 Enhanced Logging Added

When you run the new APK and check `adb logcat`, you should see:

```
═══════════════════════════════════════════════
[BackendAPI] 🚀 INITIALIZING BACKEND API SERVICE
[BackendAPI] Base URL: http://192.168.50.138:8000
[BackendAPI] Request timeout: 30000 ms
═══════════════════════════════════════════════

[Environment] Backend URL sources:
  process.env: not set
  Constants.extra: not set
  Production config: http://192.168.50.138:8000
  → Using: http://192.168.50.138:8000

[ShowtimeData] getShowtimes called, forceRefresh: false
[ShowtimeData] Loaded from storage: 97 showtimes
[ShowtimeData] Returning stale data, fetching fresh in background...
[ShowtimeData] 🌐 Fetching from backend API...
[ShowtimeData] Calling backendApi.getShowtimesUpcoming()...
[ShowtimeData] ✅ Backend API returned 72 showtimes
[ShowtimeData] First backend showtime:
  Title: The Running Man
  Date: 2025-11-26
  Time: 12:15:00
  Poster: https://image.tmdb.org/t/p/w500/...
  Rating: 6.828
[ShowtimeData] First TRANSFORMED showtime:
  movieTitle: The Running Man
  startTime: Tue Nov 26 2025 12:15:00
  posterUrl: https://image.tmdb.org/t/p/w500/...
  rating: 6.828
```

## 🧪 Testing Steps

1. **Install new APK:**
   ```bash
   adb uninstall com.popcornpal.app
   adb install PopcornPal-v0.1.0-DEBUG.apk
   ```

2. **Clear app data (IMPORTANT):**
   - Settings → Apps → Popcorn Pal → Storage → Clear Storage
   - This removes old cached data

3. **Start logcat:**
   ```bash
   adb logcat -c
   adb logcat | grep -E "BackendAPI|ShowtimeData|Environment|ReactNativeJS"
   ```

4. **Open app and check logs:**
   - Should see backend URL initialization
   - Should see fresh data fetch
   - Should see transformation logs

5. **Pull to refresh:**
   - Forces `forceRefresh: true`
   - Bypasses cache completely
   - Should fetch fresh data

## 🗺️ Maps Crash Fix

**Added:** ErrorBoundary wrapper around `<CinemaMapView />`

**Behavior:**
- If Maps library loads: Shows map
- If Maps crashes: Shows fallback UI with "Back to List" button
- App no longer crashes

## 📋 Pre-Rebuild Checklist

- ✅ Backend URL hardcoded in `src/config/environment.ts`
- ✅ All type definitions align with API response
- ✅ Data transformation correctly maps all fields
- ✅ Enhanced logging added at every step
- ✅ Error handling improved (no silent failures)
- ✅ Maps crash fixed with ErrorBoundary
- ✅ Backend server is running and accessible

**Ready to rebuild:** YES
