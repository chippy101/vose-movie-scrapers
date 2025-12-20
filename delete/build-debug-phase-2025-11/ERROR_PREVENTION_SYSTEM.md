# Error Prevention System

## Overview
Comprehensive system to prevent and diagnose connection errors between the app and backend.

## Components

### 1. Connection Test Service (`src/services/api/ConnectionTest.ts`)
**Purpose:** Test backend connectivity before attempting data operations

**Features:**
- ✅ 10-second timeout (prevents app hanging)
- ✅ Tests `/health` endpoint
- ✅ Detailed error categorization:
  - Timeout errors
  - Network errors
  - HTTP errors
- ✅ User-friendly error messages
- ✅ Logs all connection attempts

**Usage:**
```typescript
const result = await ConnectionTestService.testConnection();
if (!result.success) {
  console.error('Connection failed:', result.message);
}
```

### 2. Startup Connection Check (`useVOSEShowtimes` hook)
**Purpose:** Verify backend is accessible before loading showtimes

**Flow:**
1. User opens app
2. Hook tests connection to backend
3. If test fails: Show detailed error with troubleshooting steps
4. If test passes: Proceed to load showtimes

**Error Message Includes:**
- What went wrong
- Backend URL being used
- Step-by-step troubleshooting:
  1. Is backend running?
  2. Are you on the right WiFi?
  3. Is firewall blocking?

### 3. Enhanced Logging System
**Tracks:**
- Backend URL resolution (where URL comes from)
- Connection test results
- Data fetch attempts
- Transformation steps
- All errors with full details

**Log Format:**
```
═══════════════════════════════════════════════
[ConnectionTest] 🔍 Testing backend connection...
[ConnectionTest] URL: http://192.168.50.138:8000
[ConnectionTest] ✅ SUCCESS
[ConnectionTest] Details: Service: vose-movies-api, Status: ok
═══════════════════════════════════════════════
```

### 4. Error Boundaries
**Map View:** Wrapped in ErrorBoundary to prevent app crashes
**Fallback:** Shows user-friendly message with "Back to List" button

## Error Messages Reference

### "Connection timeout (10s)"
**Cause:** Backend not responding within 10 seconds
**User Action:**
1. Check if backend server is running on your computer
2. Run: `curl http://192.168.50.138:8000/health`

### "Network error"
**Cause:** Can't reach backend at all
**User Action:**
1. Verify phone and computer are on same WiFi
2. Check your computer's IP: `ip addr show`
3. Test in phone browser: `http://192.168.50.138:8000/health`

### "Backend returned error: 500"
**Cause:** Backend crashed or database error
**User Action:**
1. Check backend logs for errors
2. Restart backend: `./start-backend.sh`
3. Check database is accessible

## Testing the System

### Test Connection from Phone
```bash
# In phone browser, visit:
http://192.168.50.138:8000/health

# Should return:
{
  "status": "healthy",
  "service": "vose-movies-api",
  ...
}
```

### Test with Logs
```bash
# Watch connection tests in real-time:
adb logcat | grep -E "ConnectionTest|BackendAPI|Environment"
```

### Simulate Failures

**Test Timeout:**
1. Stop backend server
2. Open app
3. Should show: "Connection timeout (10s)"

**Test Network Error:**
1. Disconnect phone from WiFi
2. Pull to refresh
3. Should show: "Network error"

**Test Wrong URL:**
1. Change `PRODUCTION_CONFIG.BACKEND_URL` to wrong IP
2. Rebuild APK
3. Should show: "Connection timeout" or "Network error"

## Configuration

**Backend URL:**
Location: `src/config/environment.ts`
```typescript
const PRODUCTION_CONFIG = {
  BACKEND_URL: 'http://192.168.50.138:8000',  // Change this
  ...
};
```

**Connection Timeout:**
Location: `src/services/api/ConnectionTest.ts`
```typescript
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
```

**Request Timeout:**
Location: `src/services/api/backendApi.ts`
```typescript
REQUEST_TIMEOUT_MS: 30000, // 30 seconds
```

## Troubleshooting Checklist

When "Could not load showtimes" appears:

1. **Check logs:**
   ```bash
   adb logcat | grep -E "ConnectionTest|Error"
   ```

2. **Test backend from computer:**
   ```bash
   curl http://192.168.50.138:8000/health
   ```

3. **Test backend from phone browser:**
   ```
   http://192.168.50.138:8000/health
   ```

4. **Verify phone IP:**
   ```bash
   adb shell ip addr show wlan0 | grep inet
   # Should show 192.168.50.x
   ```

5. **Check firewall:**
   ```bash
   sudo ufw status
   sudo ufw allow 8000/tcp
   ```

6. **Restart backend:**
   ```bash
   cd vosemovies-backend
   ./start-backend.sh
   ```

7. **Clear app cache:**
   ```bash
   adb shell pm clear com.popcornpal.app
   ```

## Future Improvements

- [ ] Add automatic retry with exponential backoff
- [ ] Add offline mode with cached data
- [ ] Add backend URL configuration in app settings
- [ ] Add network quality indicator
- [ ] Add automatic backend discovery (mDNS/Bonjour)
- [ ] Add push notifications when backend comes online
- [ ] Add health check polling (check every 5 minutes)

## Success Indicators

✅ Connection test logs appear in adb logcat
✅ Detailed error messages shown to user
✅ Browser can access backend from phone
✅ App shows showtimes with correct times
✅ No silent failures or generic 8pm times
✅ Maps don't crash (show fallback)

---

Last Updated: 2025-11-26
Version: 0.1.0
