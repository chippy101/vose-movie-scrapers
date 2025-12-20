"""Showtime model - junction table for movies and cinemas"""
from sqlalchemy import Column, Integer, String, Date, Time, DateTime, Boolean, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from api.database.config import Base


class Showtime(Base):
    __tablename__ = "showtimes"

    id = Column(Integer, primary_key=True, index=True)
    movie_id = Column(Integer, ForeignKey("movies.id", ondelete="CASCADE"), nullable=False, index=True)
    cinema_id = Column(Integer, ForeignKey("cinemas.id", ondelete="CASCADE"), nullable=False, index=True)
    showtime_date = Column(Date, nullable=False, index=True)
    showtime_time = Column(Time, nullable=False)
    version = Column(String(20), default="VOSE")  # VOSE, VOS, etc.
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    movie = relationship("Movie", back_populates="showtimes")
    cinema = relationship("Cinema", back_populates="showtimes")

    # Unique constraint - prevent duplicate showtimes
    # Composite indexes for common query patterns (improves performance)
    __table_args__ = (
        UniqueConstraint('movie_id', 'cinema_id', 'showtime_date', 'showtime_time',
                        name='uq_showtime'),
        # Index for filtering active showtimes by date (most common query)
        Index('idx_active_date', 'is_active', 'showtime_date'),
        # Index for filtering by date and cinema (e.g., showtimes at specific cinema on a date)
        Index('idx_date_cinema', 'showtime_date', 'cinema_id'),
        # Index for movie showtimes lookup
        Index('idx_movie_date', 'movie_id', 'showtime_date', 'is_active'),
    )

    def __repr__(self):
        return f"<Showtime(movie_id={self.movie_id}, cinema_id={self.cinema_id}, date={self.showtime_date}, time={self.showtime_time})>"
