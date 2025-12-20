# Backend API Usage Guide

This document explains how to use the updated Backend API service with timeout and error handling.

## Configuration

The backend URL is now configured via environment variables in `.env`:

```bash
# .env file
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000  # For Android emulator
# EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8000  # For physical device
# EXPO_PUBLIC_BACKEND_URL=https://api.example.com  # For production
```

## Features

### 1. Environment-Based URL Configuration
- Reads from `EXPO_PUBLIC_BACKEND_URL` environment variable
- Validates URL format on startup
- Provides helpful warnings and errors if misconfigured
- Falls back to Android emulator default if not set

### 2. Request Timeouts (30 seconds)
- All fetch requests automatically timeout after 30 seconds
- Uses `AbortController` for clean cancellation
- Throws `TimeoutError` with user-friendly messages

### 3. Custom Error Types
- `TimeoutError`: Request exceeded 30-second timeout
- `NetworkError`: Unable to connect to backend server
- Standard HTTP errors: Invalid responses, 404, 500, etc.

## Usage Examples

### Basic Usage

```typescript
import { backendApi, TimeoutError, NetworkError } from '@/services/api/backendApi';

// Fetch showtimes with error handling
try {
  const showtimes = await backendApi.getShowtimesToday();
  console.log('Fetched', showtimes.length, 'showtimes');
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout - show "slow connection" message
    console.error('Request timed out:', error.message);
  } else if (error instanceof NetworkError) {
    // Handle network error - show "offline" message
    console.error('Network error:', error.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { backendApi, TimeoutError, NetworkError } from '@/services/api/backendApi';

export function ShowtimesScreen() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShowtimes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await backendApi.getShowtimesToday();
      setShowtimes(data);
    } catch (err) {
      if (err instanceof TimeoutError) {
        setError('Request timed out. Check your connection and try again.');
      } else if (err instanceof NetworkError) {
        setError('Unable to connect. Make sure the backend is running.');
      } else {
        setError('Failed to load showtimes. Please try again later.');
      }
      console.error('Error fetching showtimes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowtimes();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Loading showtimes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>
        <Button title="Retry" onPress={fetchShowtimes} />
      </View>
    );
  }

  return (
    <View>
      {showtimes.map((showtime) => (
        <Text key={showtime.id}>{showtime.title}</Text>
      ))}
    </View>
  );
}
```

### Debugging Backend URL

```typescript
import { backendApi } from '@/services/api/backendApi';

// Check which backend URL is being used
console.log('Backend URL:', backendApi.getBackendUrl());
// Output: Backend URL: http://10.0.2.2:8000
```

## Error Messages

### User-Friendly Error Messages

The API provides helpful error messages for common scenarios:

1. **Timeout Error**:
   ```
   Request timed out after 30 seconds. Please check your internet connection and try again.
   ```

2. **Network Error**:
   ```
   Unable to connect to the backend server. Please check if the backend is running and your device is connected to the network.
   ```

3. **Invalid URL Configuration**:
   ```
   Invalid backend URL configuration: "invalid-url". Please check your .env file. Expected format: http://10.0.2.2:8000 or https://api.example.com
   ```

4. **Missing Configuration (Warning)**:
   ```
   [BackendAPI] EXPO_PUBLIC_BACKEND_URL not set in .env file. Falling back to Android emulator default (http://10.0.2.2:8000). This will NOT work on physical devices or iOS. Please set EXPO_PUBLIC_BACKEND_URL in your .env file.
   ```

## Testing Different Scenarios

### Test Timeout (requires backend modification)
Add a delay to backend endpoint to trigger timeout:

```python
# In backend for testing only
@app.get("/showtimes/today")
async def get_showtimes_today():
    await asyncio.sleep(31)  # Exceeds 30-second timeout
    return showtimes
```

### Test Network Error
Stop the backend server or use an invalid URL:

```bash
# In .env
EXPO_PUBLIC_BACKEND_URL=http://invalid-host:8000
```

### Test on Physical Device
Update .env with your computer's network IP:

```bash
# Find your IP
# Mac/Linux: ifconfig | grep "inet "
# Windows: ipconfig

# Update .env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8000
```

## API Methods

All methods now use `fetchWithTimeout` and throw typed errors:

- `getShowtimesToday()` - Today's showtimes
- `getShowtimesUpcoming(days)` - Upcoming showtimes (default 7 days)
- `getShowtimesByDate(date)` - Showtimes for specific date
- `getShowtimes(params?)` - Filtered showtimes (island/cinema/date)
- `getMovies()` - All movies
- `getCinemas()` - All cinemas
- `getIslands()` - List of islands
- `healthCheck()` - Backend health check
- `getBackendUrl()` - Get configured URL (for debugging)

## Migration from Old Code

If you have existing code using the old API:

### Before (no timeout handling):
```typescript
const response = await fetch('http://10.0.2.2:8000/showtimes/today');
const showtimes = await response.json();
```

### After (with timeout and error handling):
```typescript
try {
  const showtimes = await backendApi.getShowtimesToday();
} catch (error) {
  if (error instanceof TimeoutError) {
    // Handle timeout
  } else if (error instanceof NetworkError) {
    // Handle network error
  }
}
```

## Configuration Checklist

When deploying or switching environments:

1. [ ] Copy `.env.example` to `.env`
2. [ ] Set `EXPO_PUBLIC_BACKEND_URL` for your environment:
   - Android Emulator: `http://10.0.2.2:8000`
   - Physical Device: `http://YOUR_NETWORK_IP:8000`
   - Production: `https://your-api.com`
3. [ ] Set `EXPO_PUBLIC_TMDB_API_KEY`
4. [ ] Restart Expo dev server after changing .env
5. [ ] Clear cache if needed: `npx expo start -c`

## Notes

- The 30-second timeout is defined in `BACKEND_CONFIG.REQUEST_TIMEOUT_MS`
- All requests log to console for debugging (search for `[BackendAPI]`)
- The singleton instance `backendApi` is initialized once on import
- URL validation happens at startup, not per request
- Timeout cleanup is automatic via `clearTimeout()`
