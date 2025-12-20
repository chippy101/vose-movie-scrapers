"""Showtime Pydantic schemas"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime, date, time
from typing import Optional, List


class ShowtimeBase(BaseModel):
    showtime_date: date
    showtime_time: time
    version: str = "VOSE"


class ShowtimeCreate(ShowtimeBase):
    movie_id: int
    cinema_id: int


class ShowtimeResponse(ShowtimeBase):
    id: int
    movie_id: int
    cinema_id: int
    scraped_at: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class MovieShowtimeResponse(BaseModel):
    """Combined response with movie, cinema, and showtime info"""
    id: int
    title: str
    link: Optional[str]
    cinema_name: str
    cinema_location: str
    island: str
    showtime_date: date
    showtime_time: time
    version: str
    scraped_at: datetime

    # Movie metadata from TMDB
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    overview: Optional[str] = None
    rating: Optional[float] = None
    release_year: Optional[int] = None
    runtime: Optional[int] = None
    genres: Optional[str] = None
    certification: Optional[str] = None
    trailer_key: Optional[str] = None  # YouTube video key
    director: Optional[str] = None  # Director name
    cast_members: Optional[str] = None  # Comma-separated cast names

    model_config = ConfigDict(from_attributes=True)
