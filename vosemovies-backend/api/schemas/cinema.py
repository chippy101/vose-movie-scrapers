"""Cinema Pydantic schemas"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CinemaBase(BaseModel):
    name: str
    location: str
    island: str
    address: Optional[str] = None
    website: Optional[str] = None


class CinemaCreate(CinemaBase):
    pass


class CinemaResponse(CinemaBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
