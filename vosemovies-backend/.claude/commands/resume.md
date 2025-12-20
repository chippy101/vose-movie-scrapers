---
description: Resume session - check notes, start backend, give summary
---

You are resuming a work session in the VOSE Movies Scrapers project.

**Execute these steps in order:**

1. **Read session context** (parallel):
   - Read `SESSION_NOTES.md` to understand current project state
   - Run `git status --short` to see uncommitted changes
   - Run `git log -1 --pretty=format:"%h - %s"` to see last commit

2. **Check backend status**:
   - Run `ps aux | grep uvicorn | grep -v grep` to check if backend is running
   - If NOT running: Start it with `./start-backend.sh` (or manually: `source venv/bin/activate && PYTHONPATH=. python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000`)
   - Wait 2-3 seconds and verify it started successfully
   - If running: Note the PID and confirm it's healthy
   - Important: Use --host 0.0.0.0 to make backend accessible from network for mobile frontend

3. **Provide a concise summary** (3-4 bullet points):
   - Current project phase from SESSION_NOTES.md
   - Backend status (running/started on port 8000)
   - Uncommitted changes if any
   - Next priority tasks from TODO section

**Format**:
```
Backend: [STATUS] on http://localhost:8000
Last commit: [COMMIT]
Modified files: [COUNT] files
Next priority: [TASK]
```

Keep the summary brief and actionable. Ask the user what they'd like to work on.
