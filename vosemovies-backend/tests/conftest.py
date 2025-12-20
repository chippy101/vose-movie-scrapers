"""
Pytest configuration and fixtures for VoseMovies Backend tests
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.main import app
from api.database.config import Base, get_db


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test
    Rolls back after each test to ensure isolation
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a test client with a clean database
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_movie(db_session):
    """Create a sample movie for testing"""
    from api.models import Movie
    movie = Movie(
        title="Test Movie",
        link="https://example.com/movie/1",
        tmdb_id="12345",
        poster_url="https://image.tmdb.org/poster.jpg",
        rating=8.5,
        release_year=2024
    )
    db_session.add(movie)
    db_session.commit()
    db_session.refresh(movie)
    return movie


@pytest.fixture
def sample_cinema(db_session):
    """Create a sample cinema for testing"""
    from api.models import Cinema
    cinema = Cinema(
        name="Test Cinema",
        location="Test Location",
        island="Mallorca"
    )
    db_session.add(cinema)
    db_session.commit()
    db_session.refresh(cinema)
    return cinema


@pytest.fixture
def sample_showtime(db_session, sample_movie, sample_cinema):
    """Create a sample showtime for testing"""
    from api.models import Showtime
    from datetime import date, time

    showtime = Showtime(
        movie_id=sample_movie.id,
        cinema_id=sample_cinema.id,
        showtime_date=date.today(),
        showtime_time=time(19, 30),
        version="VOSE",
        is_active=True
    )
    db_session.add(showtime)
    db_session.commit()
    db_session.refresh(showtime)
    return showtime
