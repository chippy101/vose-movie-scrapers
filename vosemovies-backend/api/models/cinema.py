"""Cinema model"""
from sqlalchemy import Column, Integer, String, Text, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from api.database.config import Base


class Cinema(Base):
    __tablename__ = "cinemas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    island = Column(String(50), nullable=False, index=True)  # Mallorca, Menorca, Ibiza
    address = Column(Text)
    website = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    showtimes = relationship("Showtime", back_populates="cinema", cascade="all, delete-orphan")

    # Unique constraint on name + location
    __table_args__ = (
        UniqueConstraint('name', 'location', name='uq_cinema_name_location'),
    )

    def __repr__(self):
        return f"<Cinema(id={self.id}, name='{self.name}', island='{self.island}')>"
