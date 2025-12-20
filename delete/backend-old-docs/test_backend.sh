#!/bin/bash
# Quick test script for VOSE Movies Backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "VOSE Movies Backend - Test Suite"
echo -e "==========================================${NC}\n"

# Test 1: Database connection
echo -e "${YELLOW}[1/6] Testing database connection...${NC}"
if psql -U vose_user -d vose_movies -h localhost -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection OK${NC}\n"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo -e "${YELLOW}Run: sudo -u postgres psql -c 'CREATE DATABASE vose_movies;'${NC}\n"
    exit 1
fi

# Test 2: Check tables exist
echo -e "${YELLOW}[2/6] Checking database tables...${NC}"
TABLES=$(psql -U vose_user -d vose_movies -h localhost -t -c "\dt" 2>/dev/null | grep -c "public")
if [ "$TABLES" -ge 4 ]; then
    echo -e "${GREEN}✓ Found $TABLES tables${NC}"
    psql -U vose_user -d vose_movies -h localhost -c "\dt" | grep "public"
    echo ""
else
    echo -e "${RED}✗ Tables not found${NC}"
    echo -e "${YELLOW}Run: python -c 'from api.database.config import init_db; init_db()'${NC}\n"
    exit 1
fi

# Test 3: Check if scraper has run
echo -e "${YELLOW}[3/6] Checking if data exists...${NC}"
MOVIE_COUNT=$(psql -U vose_user -d vose_movies -h localhost -t -c "SELECT COUNT(*) FROM movies;" 2>/dev/null || echo "0")
SHOWTIME_COUNT=$(psql -U vose_user -d vose_movies -h localhost -t -c "SELECT COUNT(*) FROM showtimes WHERE is_active = true;" 2>/dev/null || echo "0")

echo "Movies in database: $MOVIE_COUNT"
echo "Active showtimes: $SHOWTIME_COUNT"

if [ "$MOVIE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Database has data${NC}\n"

    echo -e "${BLUE}Sample movies:${NC}"
    psql -U vose_user -d vose_movies -h localhost -c "SELECT id, title FROM movies LIMIT 5;"
    echo ""
else
    echo -e "${YELLOW}⚠ No data yet - run scraper first:${NC}"
    echo -e "${YELLOW}cd scrapers && python unified_scraper_db.py${NC}\n"
fi

# Test 4: Check API is running
echo -e "${YELLOW}[4/6] Testing API server...${NC}"
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    RESPONSE=$(curl -s http://localhost:8000/health)
    echo -e "${GREEN}✓ API server is running${NC}"
    echo "Response: $RESPONSE"
    echo ""
else
    echo -e "${YELLOW}⚠ API server not running${NC}"
    echo -e "${YELLOW}Start with: cd api && python main.py${NC}\n"
fi

# Test 5: Test API endpoints (if API is running)
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${YELLOW}[5/6] Testing API endpoints...${NC}"

    # Test islands endpoint
    ISLANDS=$(curl -s http://localhost:8000/cinemas/islands)
    if echo "$ISLANDS" | grep -q "Mallorca"; then
        echo -e "${GREEN}✓ Islands endpoint working${NC}"
        echo "Islands: $ISLANDS"
    else
        echo -e "${RED}✗ Islands endpoint failed${NC}"
    fi

    # Test showtimes endpoint
    SHOWTIMES=$(curl -s "http://localhost:8000/showtimes/today?island=Mallorca")
    if [ "$MOVIE_COUNT" -gt 0 ]; then
        if echo "$SHOWTIMES" | grep -q "title"; then
            echo -e "${GREEN}✓ Showtimes endpoint working${NC}"
            echo "Sample response: ${SHOWTIMES:0:100}..."
        else
            echo -e "${YELLOW}⚠ Showtimes endpoint returned empty (no movies today?)${NC}"
        fi
    fi
    echo ""
else
    echo -e "${YELLOW}[5/6] Skipping API tests (server not running)${NC}\n"
fi

# Test 6: Summary
echo -e "${YELLOW}[6/6] Summary${NC}"
echo -e "${BLUE}=========================================="
echo "Test Results:"
echo -e "==========================================${NC}"

if [ "$MOVIE_COUNT" -gt 0 ] && [ "$SHOWTIME_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Backend is working correctly!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Visit http://localhost:8000/docs for interactive API docs"
    echo "2. Deploy to production (see DEPLOYMENT.md)"
    echo "3. Connect your mobile app to the API"
elif [ "$MOVIE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Backend setup complete but no data yet${NC}"
    echo ""
    echo "Run scraper to populate database:"
    echo -e "${BLUE}cd scrapers && python unified_scraper_db.py${NC}"
else
    echo -e "${RED}✗ Some tests failed - see errors above${NC}"
fi

echo ""
echo -e "${BLUE}=========================================="
echo "For detailed testing: See TESTING_GUIDE.md"
echo -e "==========================================${NC}"
