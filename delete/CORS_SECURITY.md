# CORS Security Configuration

## Overview

Cross-Origin Resource Sharing (CORS) has been configured with environment-aware security:
- **Development**: Permissive (allows localhost and common development origins)
- **Production**: Restrictive (requires explicit whitelist configuration)

---

## How It Works

### Development Mode (Default)

When `ENVIRONMENT=development` (or not set), the backend automatically allows these origins:
- `http://localhost:8081` (Expo web)
- `http://localhost:19006` (Expo web alternative)  
- `http://localhost:19000` (Expo DevTools)
- `http://10.0.2.2:8081` (Android emulator)
- `http://127.0.0.1:8081` (Localhost alternative)

**No configuration needed** - works out of the box for local development!

### Production Mode

When `ENVIRONMENT=production`, you **MUST** explicitly configure `CORS_ORIGINS`:

```bash
# .env file
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-domain.com,https://app.your-domain.com
```

**If `CORS_ORIGINS` is not set in production**, CORS will be **DISABLED** (no origins allowed) for security.

---

## Configuration Examples

### Example 1: Development (Default)

```bash
# .env
ENVIRONMENT=development
# No CORS_ORIGINS needed - uses defaults
```

Backend will print on startup:
```
🌐 CORS enabled for 5 origin(s) [development mode]
   ✓ http://localhost:8081
   ✓ http://localhost:19006
   ✓ http://localhost:19000
   ✓ http://10.0.2.2:8081
   ✓ http://127.0.0.1:8081
```

### Example 2: Custom Development Origins

```bash
# .env
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://192.168.1.100:8081
```

Overrides defaults with your custom origins.

### Example 3: Production Deployment

```bash
# .env
ENVIRONMENT=production
CORS_ORIGINS=https://vosemovies.app,https://www.vosemovies.app
```

Only allows requests from `https://vosemovies.app` and `https://www.vosemovies.app`.

### Example 4: Production Without CORS_ORIGINS (UNSAFE)

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

---

## Allowed HTTP Methods

CORS allows these HTTP methods:
- `GET`
- `POST`
- `PUT`
- `DELETE`
- `OPTIONS` (preflight)

All headers are allowed (`allow_headers=["*"]`).

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

## Security Best Practices

### ✅ DO

- Set `ENVIRONMENT=production` for production deployments
- Explicitly configure `CORS_ORIGINS` in production
- Use HTTPS origins in production (`https://`, not `http://`)
- Whitelist only the specific domains you control
- Test CORS configuration before deploying
- Monitor CORS-related errors in production logs

### ❌ DON'T

- Use `allow_origin_regex=r"https?://.*"` (old vulnerable config - now removed!)
- Set `CORS_ORIGINS=*` (not supported for security)
- Forget to configure CORS_ORIGINS in production
- Use HTTP origins in production
- Whitelist untrusted third-party domains

---

## Migration from Old Config

### Old Configuration (Vulnerable)

```python
# ❌ OLD - INSECURE
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",  # Allows ALL origins!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Problem**: Any website could call your API!

### New Configuration (Secure)

```python
# ✅ NEW - SECURE
# Environment-aware with explicit whitelisting
cors_origins = get_cors_origins()  # From .env or defaults
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Explicit whitelist only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

**Benefit**: Only whitelisted origins can access the API.

---

## Troubleshooting

### Issue: "CORS policy blocked my request"

**Symptoms**:
```
Access to fetch at 'http://localhost:8000/showtimes' from origin 'http://localhost:3000'  
has been blocked by CORS policy
```

**Solutions**:
1. Check frontend origin in browser DevTools console error message
2. Add that origin to `CORS_ORIGINS` in backend `.env`
3. Restart backend: `./start-backend.sh`
4. Clear browser cache and retry

### Issue: Backend shows "CORS is DISABLED"

**Cause**: Running in `production` mode without `CORS_ORIGINS` configured

**Solution**:
```bash
# Edit .env
CORS_ORIGINS=https://your-frontend-domain.com

# Restart backend
./start-backend.sh
```

### Issue: CORS works in dev but not production

**Common causes**:
1. Forgot to set `CORS_ORIGINS` environment variable in production
2. Production frontend URL doesn't match `CORS_ORIGINS`
3. Using `http://` instead of `https://` in production `CORS_ORIGINS`

**Solution**:
```bash
# Production .env or environment variables
ENVIRONMENT=production
CORS_ORIGINS=https://your-actual-production-domain.com
```

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
CORS_ORIGINS=https://staging.vosemovies.app

# .env.production
ENVIRONMENT=production
CORS_ORIGINS=https://vosemovies.app,https://www.vosemovies.app
```

Load with:
```bash
# Staging
ln -sf .env.staging .env && ./start-backend.sh

# Production  
ln -sf .env.production .env && ./start-backend.sh
```

### Dynamic Origin Verification

For more complex scenarios (user subdomains, etc.), you can modify `get_cors_origins()` in `api/main.py`:

```python
def get_cors_origins():
    """Get CORS origins with pattern matching"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        # Accept *.vosemovies.app subdomains
        # NOTE: This requires implementing allow_origin_regex with validation
        base_domains = os.getenv("CORS_BASE_DOMAINS", "").split(",")
        # ... custom logic here
```

---

**Last Updated:** 2025-11-18
**Status:** ✅ CORS security implemented with environment-aware whitelisting
