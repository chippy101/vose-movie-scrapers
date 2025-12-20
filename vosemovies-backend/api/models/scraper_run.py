"""Scraper run tracking model"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from api.database.config import Base


class ScraperRun(Base):
    __tablename__ = "scraper_runs"

    id = Column(Integer, primary_key=True, index=True)
    scraper_name = Column(String(100), nullable=False)  # 'cineciutat', 'aficine', 'unified'
    status = Column(String(20), nullable=False)  # 'success', 'failed', 'partial'
    movies_found = Column(Integer, default=0)
    showtimes_found = Column(Integer, default=0)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)

    def __repr__(self):
        return f"<ScraperRun(id={self.id}, scraper='{self.scraper_name}', status='{self.status}')>"
