"""
Tests for main API endpoints (root, health check)
"""
import pytest
from fastapi import status


def test_root_endpoint(client):
    """Test the root endpoint returns correct information"""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["message"] == "VOSE Movies API"
    assert data["version"] == "1.0.0"
    assert "endpoints" in data
    assert "showtimes" in data["endpoints"]
    assert "movies" in data["endpoints"]
    assert "cinemas" in data["endpoints"]


def test_health_check_healthy(client):
    """Test health check returns healthy status with valid database"""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["status"] in ["healthy", "degraded"]  # degraded is ok (no data)
    assert data["service"] == "vose-movies-api"
    assert data["version"] == "1.0.0"
    assert "checks" in data
    assert "database" in data["checks"]
    assert data["checks"]["database"]["status"] == "healthy"


def test_health_check_tables(client):
    """Test health check verifies tables exist"""
    response = client.get("/health")
    data = response.json()

    assert "tables" in data["checks"]
    assert data["checks"]["tables"]["status"] == "healthy"
    assert "movies" in data["checks"]["tables"]["message"]
    assert "cinemas" in data["checks"]["tables"]["message"]
    assert "showtimes" in data["checks"]["tables"]["message"]


def test_health_check_data_freshness(client):
    """Test health check reports data freshness"""
    response = client.get("/health")
    data = response.json()

    assert "data_freshness" in data["checks"]
    # For empty test database, should be warning
    assert data["checks"]["data_freshness"]["status"] in ["healthy", "warning"]
