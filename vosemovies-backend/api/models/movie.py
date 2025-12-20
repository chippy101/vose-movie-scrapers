"""Movie model"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from api.database.config import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, unique=True, index=True)
    original_title = Column(String(255))
    link = Column(Text)

    # TMDB metadata
    tmdb_id = Column(Integer, index=True)
    poster_url = Column(Text)
    backdrop_url = Column(Text)
    overview = Column(Text)
    rating = Column(Float)  # TMDB vote_average
    release_year = Column(Integer)
    runtime = Column(Integer)  # in minutes
    genres = Column(String(255))  # comma-separated genre names
    certification = Column(String(10))  # Age rating: G, PG, PG-13, R, etc.
    trailer_key = Column(String(20))  # YouTube video key for trailer
    director = Column(String(255))  # Director name
    cast_members = Column(Text)  # Comma-separated list of main cast

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    showtimes = relationship("Showtime", back_populates="movie", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Movie(id={self.id}, title='{self.title}')>"
