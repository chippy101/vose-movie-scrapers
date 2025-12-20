"""Cinema endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from api.database.config import get_db
from api.models import Cinema
from api.schemas import CinemaResponse

router = APIRouter(prefix="/cinemas", tags=["cinemas"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/", response_model=List[CinemaResponse])
@limiter.limit("100/minute")
def get_all_cinemas(
    request: Request,
    island: Optional[str] = Query(None, description="Filter by island"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get all cinemas"""
    query = db.query(Cinema)

    if island:
        query = query.filter(Cinema.island == island)

    query = query.order_by(Cinema.island, Cinema.name)
    cinemas = query.offset(skip).limit(limit).all()
    return cinemas


@router.get("/islands", response_model=List[str])
@limiter.limit("100/minute")
def get_islands(request: Request, db: Session = Depends(get_db)):
    """Get list of all islands with cinemas"""
    islands = db.query(Cinema.island).distinct().order_by(Cinema.island).all()
    return [island[0] for island in islands]


@router.get("/{cinema_id}", response_model=CinemaResponse)
@limiter.limit("100/minute")
def get_cinema(request: Request, cinema_id: int, db: Session = Depends(get_db)):
    """Get a specific cinema by ID"""
    cinema = db.query(Cinema).filter(Cinema.id == cinema_id).first()
    if not cinema:
        raise HTTPException(status_code=404, detail="Cinema not found")
    return cinema
