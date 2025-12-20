#!/bin/bash
# Quick setup script for VOSE Movies FastAPI Backend

set -e

echo "=========================================="
echo "VOSE Movies Backend Setup"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python version
echo -e "\n${YELLOW}Checking Python version...${NC}"
python3 --version

# Check PostgreSQL
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
else
    echo -e "${RED}✗ PostgreSQL not found. Please install it first.${NC}"
    exit 1
fi

# Install API dependencies
echo -e "\n${YELLOW}Installing API dependencies...${NC}"
pip3 install -r api/requirements.txt

# Install scraper dependencies
echo -e "\n${YELLOW}Installing scraper dependencies...${NC}"
pip3 install -r requirements.txt

# Check ChromeDriver
echo -e "\n${YELLOW}Checking ChromeDriver...${NC}"
if command -v chromedriver &> /dev/null; then
    echo -e "${GREEN}✓ ChromeDriver is installed${NC}"
    chromedriver --version
else
    echo -e "${YELLOW}⚠ ChromeDriver not found. Install with:${NC}"
    echo "  Ubuntu: sudo apt install chromium-chromedriver"
    echo "  macOS: brew install chromedriver"
fi

# Create .env file if it doesn't exist
if [ ! -f "api/.env" ]; then
    echo -e "\n${YELLOW}Creating api/.env from example...${NC}"
    cp api/.env.example api/.env
    echo -e "${GREEN}✓ Created api/.env${NC}"
    echo -e "${YELLOW}⚠ Please edit api/.env with your database credentials${NC}"
else
    echo -e "\n${GREEN}✓ api/.env already exists${NC}"
fi

# Ask if user wants to create database
echo -e "\n${YELLOW}Do you want to create the PostgreSQL database now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Enter PostgreSQL admin password when prompted...${NC}"

    sudo -u postgres psql << EOF
CREATE DATABASE vose_movies;
CREATE USER vose_user WITH PASSWORD 'vose_pass';
GRANT ALL PRIVILEGES ON DATABASE vose_movies TO vose_user;
\c vose_movies
GRANT ALL ON SCHEMA public TO vose_user;
EOF

    echo -e "${GREEN}✓ Database created${NC}"
    echo -e "${YELLOW}⚠ Default password is 'vose_pass' - change it in production!${NC}"
fi

# Initialize database tables
echo -e "\n${YELLOW}Do you want to initialize database tables now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Initializing database tables...${NC}"
    python3 -c "from api.database.config import init_db; init_db()"
    echo -e "${GREEN}✓ Database tables created${NC}"
fi

# Run test scrape
echo -e "\n${YELLOW}Do you want to run a test scrape now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Running test scrape (this may take 2-5 minutes)...${NC}"
    cd scrapers
    python3 unified_scraper_db.py
    cd ..
    echo -e "${GREEN}✓ Test scrape completed${NC}"
fi

echo -e "\n=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "=========================================="
echo -e "\nNext steps:"
echo -e "1. Edit ${YELLOW}api/.env${NC} with your database credentials"
echo -e "2. Start the API server:"
echo -e "   ${YELLOW}cd api && python main.py${NC}"
echo -e "3. Visit ${YELLOW}http://localhost:8000/docs${NC} for API documentation"
echo -e "4. Set up cron job for automated scraping (see BACKEND_SETUP.md)"
echo ""
