"""Movie Pydantic schemas"""
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class MovieBase(BaseModel):
    title: str
    original_title: Optional[str] = None
    link: Optional[str] = None


class MovieCreate(MovieBase):
    pass


class MovieResponse(MovieBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
