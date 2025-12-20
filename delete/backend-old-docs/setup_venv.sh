#!/bin/bash
# Setup with virtual environment for Linux Mint/Ubuntu

set -e

echo "=========================================="
echo "VOSE Movies Backend Setup (with venv)"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "\n${YELLOW}Checking Python version...${NC}"
python3 --version

# Install python3-venv if needed
echo -e "\n${YELLOW}Installing python3-venv...${NC}"
sudo apt install -y python3-venv python3-full

# Create virtual environment
if [ ! -d "venv" ]; then
    echo -e "\n${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "\n${GREEN}✓ Virtual environment already exists${NC}"
fi

# Activate virtual environment
echo -e "\n${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"

# Install API dependencies
echo -e "\n${YELLOW}Installing API dependencies...${NC}"
pip install --upgrade pip
pip install -r api/requirements.txt
echo -e "${GREEN}✓ API dependencies installed${NC}"

# Install scraper dependencies
echo -e "\n${YELLOW}Installing scraper dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✓ Scraper dependencies installed${NC}"

# Check PostgreSQL
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
else
    echo -e "${RED}✗ PostgreSQL not found${NC}"
    exit 1
fi

# Check ChromeDriver
echo -e "\n${YELLOW}Checking ChromeDriver...${NC}"
if command -v chromedriver &> /dev/null; then
    echo -e "${GREEN}✓ ChromeDriver is installed${NC}"
    chromedriver --version
else
    echo -e "${YELLOW}⚠ ChromeDriver not found. Install with:${NC}"
    echo "  sudo apt install chromium-chromedriver"
fi

# Create .env file
if [ ! -f "api/.env" ]; then
    echo -e "\n${YELLOW}Creating api/.env from example...${NC}"
    cp api/.env.example api/.env
    echo -e "${GREEN}✓ Created api/.env${NC}"
    echo -e "${YELLOW}⚠ Please edit api/.env with your database credentials${NC}"
else
    echo -e "\n${GREEN}✓ api/.env already exists${NC}"
fi

# Ask to create database
echo -e "\n${YELLOW}Do you want to create the PostgreSQL database now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Creating database...${NC}"
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
    python -c "from api.database.config import init_db; init_db()"
    echo -e "${GREEN}✓ Database tables created${NC}"
fi

# Ask to run test scrape
echo -e "\n${YELLOW}Do you want to run a test scrape now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Running test scrape (this may take 2-5 minutes)...${NC}"
    cd scrapers
    python unified_scraper_db.py
    cd ..
    echo -e "${GREEN}✓ Test scrape completed${NC}"
fi

echo -e "\n=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "=========================================="
echo -e "\n${YELLOW}IMPORTANT: Virtual environment is active${NC}"
echo -e "To use the backend, always activate the virtual environment first:\n"
echo -e "${GREEN}source venv/bin/activate${NC}\n"
echo -e "Then you can:"
echo -e "1. Run scrapers: ${YELLOW}cd scrapers && python unified_scraper_db.py${NC}"
echo -e "2. Start API: ${YELLOW}cd api && python main.py${NC}"
echo -e "3. Test: ${YELLOW}./test_backend.sh${NC}"
echo -e "\nTo deactivate virtual environment: ${YELLOW}deactivate${NC}"
echo ""
