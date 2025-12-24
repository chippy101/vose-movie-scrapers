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
import asyncio

# Add scrapers directory to path
scrapers_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "scrapers")
sys.path.insert(0, scrapers_path)

router = APIRouter(prefix="/scraper", tags=["scraper"])
logger = logging.getLogger(__name__)

# Maximum scraper runtime (30 minutes)
SCRAPER_TIMEOUT = 1800


async def run_scraper_task():
    """
    Background task to run the unified scraper with timeout protection

    Runs scraper in an async subprocess with a 30-minute timeout to prevent
    indefinite blocking if Chrome crashes or hangs. The subprocess runs independently,
    allowing the API to continue serving requests.
    """
    try:
        logger.info("Starting scraper background task with timeout protection...")

        # Get the path to the scraper script
        scraper_script = os.path.join(scrapers_path, "unified_scraper_db.py")

        # Set environment for subprocess
        env = os.environ.copy()
        env['PYTHONPATH'] = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))

        # Run scraper in async subprocess (non-blocking)
        process = await asyncio.create_subprocess_exec(
            sys.executable, scraper_script,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )

        try:
            # Wait for completion with timeout (non-blocking)
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=SCRAPER_TIMEOUT
            )

            if process.returncode == 0:
                logger.info("Scraper completed successfully")
                return {"status": "success"}
            else:
                logger.error(f"Scraper failed with exit code {process.returncode}")
                logger.error(f"Stderr: {stderr.decode()[:500]}")  # Log first 500 chars
                return {"status": "error"}

        except asyncio.TimeoutError:
            logger.warning(f"Scraper exceeded timeout of {SCRAPER_TIMEOUT}s, killing process...")
            try:
                process.kill()
                await process.wait()
            except:
                pass
            return {"status": "timeout"}

    except Exception as e:
        logger.error(f"Scraper task failed: {e}", exc_info=True)
        return {"status": "error"}


@router.post("/run")
@router.get("/run")  # Also support GET for free monitoring services
@router.head("/run")  # Support HEAD for UptimeRobot monitoring
async def trigger_scraper(background_tasks: BackgroundTasks, request: Request):
    """
    Trigger the unified scraper to update showtime data

    This endpoint runs the scraper in the background and returns immediately.
    Designed to be called by UptimeRobot or other monitoring services on a schedule.

    **Security**: In production, you should add authentication or IP whitelisting
    to prevent unauthorized scraping triggers.

    Supports both GET and POST methods for compatibility with free-tier monitoring services.
    """
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Scraper triggered by {client_ip}")

    # Add scraper to background tasks (non-blocking)
    background_tasks.add_task(run_scraper_task)

    return JSONResponse(
        status_code=200,  # OK - compatible with free monitoring services
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
