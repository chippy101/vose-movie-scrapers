#!/bin/bash
# VOSE Movies Backend Startup Script

echo "🚀 Starting VOSE Movies Backend..."
echo "=================================="

# Check if in correct directory
if [ ! -f "api/main.py" ]; then
    echo "❌ Error: Must run from vosemovies-backend directory"
    echo "   Current: $(pwd)"
    echo "   Expected: /media/squareyes/Evo Plus 2a/AI/AI_Projects/popcornpal/vosemovies-backend"
    exit 1
fi

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Error: Virtual environment not found"
    echo "   Run: python3 -m venv venv"
    exit 1
fi

# Activate virtual environment
echo "✓ Activating virtual environment..."
source venv/bin/activate

# Start backend server
echo "✓ Starting FastAPI server on http://0.0.0.0:8000..."
echo ""
PYTHONPATH=. python3 -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
