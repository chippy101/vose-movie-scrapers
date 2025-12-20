"""Showtime endpoints - main endpoint for mobile app"""
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date
from slowapi import Limiter
from slowapi.util import get_remote_address

from api.database.config import get_db
from api.models import Movie, Cinema, Showtime
from api.schemas import MovieShowtimeResponse

router = APIRouter(prefix="/showtimes", tags=["showtimes"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/", response_model=List[MovieShowtimeResponse])
@limiter.limit("100/minute")
def get_showtimes(
    request: Request,
    island: Optional[str] = Query(None, description="Filter by island (Mallorca, Menorca, Ibiza)"),
    cinema_id: Optional[int] = Query(None, description="Filter by cinema ID"),
    showtime_date: Optional[date] = Query(None, description="Filter by specific date (YYYY-MM-DD)"),
    from_date: Optional[date] = Query(None, description="Show showtimes from this date onwards"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """
    Get all VOSE movie showtimes with filters

    This is the main endpoint for the mobile app to fetch showtime data.
    Returns combined movie + cinema + showtime information.
    """
    query = db.query(
        Showtime.id,
        Movie.title,
        Movie.link,
        Cinema.name.label('cinema_name'),
        Cinema.location.label('cinema_location'),
        Cinema.island,
        Showtime.showtime_date,
        Showtime.showtime_time,
        Showtime.version,
        Showtime.scraped_at,
        Movie.poster_url,
        Movie.backdrop_url,
        Movie.overview,
        Movie.rating,
        Movie.release_year,
        Movie.runtime,
        Movie.genres,
        Movie.certification,
        Movie.trailer_key,
        Movie.director,
        Movie.cast_members
    ).join(Movie).join(Cinema).filter(Showtime.is_active == True)

    # Filter by island
    if island:
        query = query.filter(Cinema.island == island)

    # Filter by cinema
    if cinema_id:
        query = query.filter(Cinema.id == cinema_id)

    # Filter by specific date
    if showtime_date:
        query = query.filter(Showtime.showtime_date == showtime_date)
    elif from_date:
        query = query.filter(Showtime.showtime_date >= from_date)
    else:
        # Default: only show today and future showtimes
        query = query.filter(Showtime.showtime_date >= date.today())

    # Order by date and time
    query = query.order_by(
        Showtime.showtime_date,
        Showtime.showtime_time,
        Movie.title
    )

    # Pagination
    query = query.offset(skip).limit(limit)

    showtimes = query.all()
    return showtimes


@router.get("/today", response_model=List[MovieShowtimeResponse])
@limiter.limit("100/minute")
def get_today_showtimes(
    request: Request,
    island: Optional[str] = Query(None, description="Filter by island"),
    cinema_id: Optional[int] = Query(None, description="Filter by cinema ID"),
    db: Session = Depends(get_db)
):
    """Get showtimes for today only"""
    query = db.query(
        Showtime.id,
        Movie.title,
        Movie.link,
        Cinema.name.label('cinema_name'),
        Cinema.location.label('cinema_location'),
        Cinema.island,
        Showtime.showtime_date,
        Showtime.showtime_time,
        Showtime.version,
        Showtime.scraped_at,
        Movie.poster_url,
        Movie.backdrop_url,
        Movie.overview,
        Movie.rating,
        Movie.release_year,
        Movie.runtime,
        Movie.genres,
        Movie.certification,
        Movie.trailer_key,
        Movie.director,
        Movie.cast_members
    ).join(Movie).join(Cinema).filter(
        and_(
            Showtime.showtime_date == date.today(),
            Showtime.is_active == True
        )
    )

    if island:
        query = query.filter(Cinema.island == island)

    if cinema_id:
        query = query.filter(Cinema.id == cinema_id)

    query = query.order_by(Showtime.showtime_time, Movie.title)

    showtimes = query.all()
    return showtimes


@router.get("/upcoming", response_model=List[MovieShowtimeResponse])
@limiter.limit("100/minute")
def get_upcoming_showtimes(
    request: Request,
    days: int = Query(7, ge=1, le=30, description="Number of days to look ahead"),
    island: Optional[str] = Query(None, description="Filter by island"),
    cinema_id: Optional[int] = Query(None, description="Filter by cinema ID"),
    db: Session = Depends(get_db)
):
    """Get upcoming showtimes for the next N days"""
    from datetime import timedelta

    end_date = date.today() + timedelta(days=days)

    query = db.query(
        Showtime.id,
        Movie.title,
        Movie.link,
        Cinema.name.label('cinema_name'),
        Cinema.location.label('cinema_location'),
        Cinema.island,
        Showtime.showtime_date,
        Showtime.showtime_time,
        Showtime.version,
        Showtime.scraped_at,
        Movie.poster_url,
        Movie.backdrop_url,
        Movie.overview,
        Movie.rating,
        Movie.release_year,
        Movie.runtime,
        Movie.genres,
        Movie.certification,
        Movie.trailer_key,
        Movie.director,
        Movie.cast_members
    ).join(Movie).join(Cinema).filter(
        and_(
            Showtime.showtime_date >= date.today(),
            Showtime.showtime_date <= end_date,
            Showtime.is_active == True
        )
    )

    if island:
        query = query.filter(Cinema.island == island)

    if cinema_id:
        query = query.filter(Cinema.id == cinema_id)

    query = query.order_by(
        Showtime.showtime_date,
        Showtime.showtime_time,
        Movie.title
    )

    showtimes = query.all()
    return showtimes
