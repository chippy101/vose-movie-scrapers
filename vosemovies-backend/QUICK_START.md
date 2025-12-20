# VOSE Movies - Quick Start

## 🚀 Starting Everything (3 Terminals)

### Terminal 1: Backend
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./start-backend.sh
```

### Terminal 2: Scrapers (run once per day)
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
./run-scrapers.sh
```

### Terminal 3: Frontend
```bash
cd "/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend"
npx expo start
# Press 'a' to launch Android emulator
```

## ⚙️ Configuration

### Emulator (Default)
✅ Already configured - no changes needed
- `backendApi.ts` → `BASE_URL: 'http://10.0.2.2:8000'`

### Physical Device
1. Get your IP: `ip addr show | grep "inet " | grep -v "127.0.0.1"`
2. Edit: `/media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-frontend/src/services/api/backendApi.ts`
3. Change: `BASE_URL: 'http://YOUR_IP:8000'`
4. Remember to change back for emulator!

## 🔍 Quick Checks

```bash
# Backend health
curl http://localhost:8000/health

# Today's showtimes
curl http://localhost:8000/showtimes/today | python3 -m json.tool

# Get network IP
ip addr show | grep "inet " | head -1
```

## 📖 Full Documentation
See [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) for complete instructions and troubleshooting.
