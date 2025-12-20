#!/bin/bash
# Test Runner Script for VoseMovies Backend
# Wraps pytest with common options

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found. Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Parse command
COMMAND="${1:-all}"

case "$COMMAND" in
    "all")
        echo "🧪 Running all tests..."
        pytest tests/
        ;;

    "fast")
        echo "🧪 Running fast tests only..."
        pytest tests/ -m "not slow"
        ;;

    "api")
        echo "🧪 Running API tests..."
        pytest tests/ -m "api"
        ;;

    "coverage")
        echo "🧪 Running tests with coverage report..."
        pytest tests/ --cov=api --cov-report=html --cov-report=term
        echo ""
        echo "📊 Coverage report generated in htmlcov/index.html"
        ;;

    "watch")
        echo "🧪 Running tests in watch mode..."
        pytest tests/ -f
        ;;

    "verbose")
        echo "🧪 Running tests with verbose output..."
        pytest tests/ -vv
        ;;

    "debug")
        echo "🧪 Running tests with debug output..."
        pytest tests/ -vv -s --tb=long
        ;;

    "help"|*)
        echo "VoseMovies Backend Test Runner"
        echo "==============================="
        echo ""
        echo "Usage: ./run-tests.sh <command>"
        echo ""
        echo "Commands:"
        echo "  all              Run all tests (default)"
        echo "  fast             Run fast tests only (skip slow tests)"
        echo "  api              Run API endpoint tests only"
        echo "  coverage         Run tests with coverage report"
        echo "  watch            Run tests in watch mode (rerun on changes)"
        echo "  verbose          Run tests with verbose output"
        echo "  debug            Run tests with full debug output"
        echo "  help             Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run-tests.sh                    # Run all tests"
        echo "  ./run-tests.sh coverage           # Generate coverage report"
        echo "  ./run-tests.sh fast               # Run only fast tests"
        echo ""
        echo "Direct pytest usage:"
        echo "  pytest tests/test_api.py          # Run specific test file"
        echo "  pytest tests/ -k test_health      # Run tests matching pattern"
        echo "  pytest tests/ -x                  # Stop on first failure"
        echo ""
        ;;
esac
