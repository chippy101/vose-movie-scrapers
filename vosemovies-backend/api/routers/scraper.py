"""
Scraper Endpoint - Trigger scraping from API
Allows external services (like UptimeRobot) to trigger scraping on schedule
"""
from fastapi import APIRouter, BackgroundTasks, Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
import sys
import os

# Add scrapers directory to path
scrapers_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "scrapers")
sys.path.insert(0, scrapers_path)

router = APIRouter(prefix="/scraper", tags=["scraper"])
logger = logging.getLogger(__name__)


async def run_scraper_task():
    """Background task to run the unified scraper"""
    try:
        logger.info("Starting scraper background task...")

        # Import scraper here to avoid import issues
        from unified_scraper_db import UnifiedVOSEScraperDB

        # Run scraper in headless mode
        scraper = UnifiedVOSEScraperDB(headless=True)
        results = scraper.scrape_all()

        logger.info(f"Scraper completed successfully. Results: {results}")
        return results

    except Exception as e:
        logger.error(f"Scraper task failed: {e}", exc_info=True)
        raise


@router.post("/run")
async def trigger_scraper(background_tasks: BackgroundTasks, request: Request):
    """
    Trigger the unified scraper to update showtime data

    This endpoint runs the scraper in the background and returns immediately.
    Designed to be called by UptimeRobot or other monitoring services on a schedule.

    **Security**: In production, you should add authentication or IP whitelisting
    to prevent unauthorized scraping triggers.
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Scraper triggered by {client_ip}")

    # Add scraper to background tasks (non-blocking)
    background_tasks.add_task(run_scraper_task)

    return JSONResponse(
        status_code=202,  # Accepted - task queued
        content={
            "status": "accepted",
            "message": "Scraper task queued and will run in background",
            "triggered_at": datetime.now().isoformat(),
            "triggered_by": client_ip
        }
    )


@router.get("/status")
async def scraper_status():
    """
    Get the status of the most recent scraper run

    Returns information about when the scraper last ran and how many
    showtimes were found.
    """
    from api.database.config import SessionLocal
    from api.models import ScraperRun
    from sqlalchemy import desc

    db = SessionLocal()
    try:
        # Get most recent scraper run
        latest_run = db.query(ScraperRun).order_by(desc(ScraperRun.started_at)).first()

        if not latest_run:
            return {
                "status": "never_run",
                "message": "No scraper runs found in database",
                "last_run": None
            }

        return {
            "status": "completed" if latest_run.completed_at else "running",
            "last_run": {
                "started_at": latest_run.started_at.isoformat() if latest_run.started_at else None,
                "completed_at": latest_run.completed_at.isoformat() if latest_run.completed_at else None,
                "movies_found": latest_run.movies_found,
                "showtimes_found": latest_run.showtimes_found,
                "error_message": latest_run.error_message
            }
        }

    except Exception as e:
        logger.error(f"Error fetching scraper status: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scraper status")
    finally:
        db.close()
