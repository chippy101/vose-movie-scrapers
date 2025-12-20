"""Movie endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date
from slowapi import Limiter
from slowapi.util import get_remote_address

from api.database.config import get_db
from api.models import Movie, Cinema, Showtime
from api.schemas import MovieResponse, MovieShowtimeResponse

router = APIRouter(prefix="/movies", tags=["movies"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/", response_model=List[MovieResponse])
@limiter.limit("100/minute")
def get_all_movies(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get all movies"""
    movies = db.query(Movie).offset(skip).limit(limit).all()
    return movies


@router.get("/{movie_id}", response_model=MovieResponse)
@limiter.limit("100/minute")
def get_movie(request: Request, movie_id: int, db: Session = Depends(get_db)):
    """Get a specific movie by ID"""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie


@router.get("/{movie_id}/showtimes", response_model=List[MovieShowtimeResponse])
@limiter.limit("100/minute")
def get_movie_showtimes(
    request: Request,
    movie_id: int,
    island: Optional[str] = None,
    from_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get all showtimes for a specific movie"""
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

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
        Showtime.scraped_at
    ).join(Movie).join(Cinema).filter(
        and_(
            Showtime.movie_id == movie_id,
            Showtime.is_active == True
        )
    )

    # Filter by island if provided
    if island:
        query = query.filter(Cinema.island == island)

    # Filter by date if provided
    if from_date:
        query = query.filter(Showtime.showtime_date >= from_date)
    else:
        # Default: only show future showtimes
        query = query.filter(Showtime.showtime_date >= date.today())

    query = query.order_by(Showtime.showtime_date, Showtime.showtime_time)

    showtimes = query.all()
    return showtimes
