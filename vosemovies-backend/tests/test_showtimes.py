"""
Tests for showtime endpoints
"""
import pytest
from fastapi import status
from datetime import date, time


def test_get_showtimes_empty(client):
    """Test getting showtimes when database is empty"""
    response = client.get("/showtimes/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []


def test_get_showtimes_with_data(client, sample_showtime):
    """Test getting showtimes with data"""
    response = client.get("/showtimes/")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Movie"
    assert data[0]["cinema_name"] == "Test Cinema"
    assert data[0]["island"] == "Mallorca"
    assert data[0]["version"] == "VOSE"


def test_get_showtimes_today(client, sample_showtime):
    """Test getting today's showtimes"""
    response = client.get("/showtimes/today")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Movie"


def test_get_showtimes_filter_by_island(client, sample_showtime):
    """Test filtering showtimes by island"""
    # Should find it
    response = client.get("/showtimes/?island=Mallorca")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

    # Should not find it
    response = client.get("/showtimes/?island=Menorca")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 0


def test_get_showtimes_upcoming(client, sample_showtime):
    """Test getting upcoming showtimes"""
    response = client.get("/showtimes/upcoming?days=7")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_get_showtimes_pagination(client, sample_showtime):
    """Test showtime pagination"""
    # Test with limit
    response = client.get("/showtimes/?limit=1")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) <= 1

    # Test with offset
    response = client.get("/showtimes/?skip=0&limit=10")
    assert response.status_code == status.HTTP_200_OK
