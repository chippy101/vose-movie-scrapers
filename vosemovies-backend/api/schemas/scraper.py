"""Pydantic schemas for scraper data validation"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from datetime import datetime, date, time
from typing import List, Optional
import re


class ScrapedShowtime(BaseModel):
    """Individual showtime scraped from a cinema website"""
    date: str = Field(..., description="Showtime date in YYYY-MM-DD format")
    time: str = Field(..., description="Showtime time (e.g., '19:30', '20:00')")

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: str) -> str:
        """Validate date format is YYYY-MM-DD"""
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError(f"Date must be in YYYY-MM-DD format, got: {v}")

    @field_validator('time')
    @classmethod
    def validate_time(cls, v: str) -> str:
        """Validate time format is HH:MM"""
        # Allow various time formats: "19:30", "7:30 PM", etc.
        time_pattern = r'^\d{1,2}:\d{2}(\s?[AP]M)?$'
        if not re.match(time_pattern, v, re.IGNORECASE):
            raise ValueError(f"Time must be in HH:MM format (optionally with AM/PM), got: {v}")
        return v

    model_config = ConfigDict(from_attributes=True)


class ScrapedMovie(BaseModel):
    """Movie data scraped from a cinema website"""
    title: str = Field(..., min_length=1, max_length=500, description="Movie title")
    link: Optional[str] = Field(None, max_length=1000, description="URL to movie page")
    showtimes: List[ScrapedShowtime] = Field(..., min_items=1, description="List of showtimes")
    cinema: str = Field(..., min_length=1, max_length=200, description="Cinema name")
    location: str = Field(..., min_length=1, max_length=200, description="Cinema location/city")
    island: str = Field(..., description="Island (Mallorca, Menorca, Ibiza, Formentera)")
    version: str = Field(default="VOSE", description="Movie version (VOSE, VO, etc.)")
    raw_text: Optional[str] = Field(None, description="Raw HTML text for debugging")
    scraped_at: str = Field(..., description="ISO timestamp when scraped")

    @field_validator('island')
    @classmethod
    def validate_island(cls, v: str) -> str:
        """Validate island is one of the Balearic Islands"""
        valid_islands = ["Mallorca", "Menorca", "Ibiza", "Formentera"]
        if v not in valid_islands:
            raise ValueError(f"Island must be one of {valid_islands}, got: {v}")
        return v

    @field_validator('scraped_at')
    @classmethod
    def validate_scraped_at(cls, v: str) -> str:
        """Validate scraped_at is a valid ISO datetime"""
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"scraped_at must be an ISO format datetime, got: {v}")

    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate and clean movie title"""
        # Remove excessive whitespace
        title = ' '.join(v.split())
        if not title:
            raise ValueError("Title cannot be empty after cleaning")
        return title

    model_config = ConfigDict(from_attributes=True)


class ScraperRun(BaseModel):
    """Validation schema for a complete scraper run"""
    scraper_name: str = Field(..., description="Name of the scraper (e.g., 'CineCiutat', 'Aficine')")
    started_at: datetime = Field(..., description="When the scraper started")
    completed_at: Optional[datetime] = Field(None, description="When the scraper completed")
    movies: List[ScrapedMovie] = Field(default_factory=list, description="Movies scraped")
    total_movies: int = Field(default=0, description="Total number of movies found")
    total_showtimes: int = Field(default=0, description="Total number of showtimes found")
    errors: List[str] = Field(default_factory=list, description="Errors encountered during scraping")
    success: bool = Field(default=True, description="Whether the scraper run was successful")

    @field_validator('total_movies', 'total_showtimes')
    @classmethod
    def validate_non_negative(cls, v: int) -> int:
        """Validate counts are non-negative"""
        if v < 0:
            raise ValueError(f"Count must be non-negative, got: {v}")
        return v

    model_config = ConfigDict(from_attributes=True)


class ScraperValidationResult(BaseModel):
    """Result of validating scraped data"""
    valid: bool = Field(..., description="Whether the data passed validation")
    total_items: int = Field(..., description="Total number of items validated")
    valid_items: int = Field(..., description="Number of valid items")
    invalid_items: int = Field(..., description="Number of invalid items")
    errors: List[dict] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")

    model_config = ConfigDict(from_attributes=True)
