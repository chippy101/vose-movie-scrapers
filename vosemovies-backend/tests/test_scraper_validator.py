"""
Tests for scraper data validation
"""
import pytest
from datetime import datetime
from api.utils import ScraperDataValidator
from api.schemas import ScrapedMovie


def test_valid_movie():
    """Test validating a valid movie"""
    valid_movie = {
        'title': 'Test Movie',
        'link': 'https://example.com/movie',
        'showtimes': [
            {'date': '2025-11-18', 'time': '19:30'},
            {'date': '2025-11-18', 'time': '22:00'}
        ],
        'cinema': 'Test Cinema',
        'location': 'Test Location',
        'island': 'Mallorca',
        'version': 'VOSE',
        'scraped_at': datetime.now().isoformat()
    }

    validator = ScraperDataValidator()
    valid_movies, result = validator.validate_movies([valid_movie])

    assert result.valid == True
    assert result.total_items == 1
    assert result.valid_items == 1
    assert result.invalid_items == 0
    assert len(valid_movies) == 1


def test_invalid_movie_missing_fields():
    """Test validating movie with missing required fields"""
    invalid_movie = {
        'title': 'Test Movie',
        'showtimes': [],  # Empty showtimes (invalid)
        'cinema': 'Test Cinema'
        # Missing: location, island, scraped_at
    }

    validator = ScraperDataValidator()
    valid_movies, result = validator.validate_movies([invalid_movie])

    assert result.valid == False
    assert result.total_items == 1
    assert result.valid_items == 0
    assert result.invalid_items == 1
    assert len(result.errors) == 1


def test_invalid_island():
    """Test validating movie with invalid island"""
    invalid_movie = {
        'title': 'Test Movie',
        'link': 'https://example.com/movie',
        'showtimes': [{'date': '2025-11-18', 'time': '19:30'}],
        'cinema': 'Test Cinema',
        'location': 'Test Location',
        'island': 'InvalidIsland',  # Invalid
        'version': 'VOSE',
        'scraped_at': datetime.now().isoformat()
    }

    validator = ScraperDataValidator()
    valid_movies, result = validator.validate_movies([invalid_movie])

    assert result.valid == False
    assert result.invalid_items == 1


def test_invalid_date_format():
    """Test validating movie with invalid date format"""
    invalid_movie = {
        'title': 'Test Movie',
        'link': 'https://example.com/movie',
        'showtimes': [{'date': '18-11-2025', 'time': '19:30'}],  # Invalid format
        'cinema': 'Test Cinema',
        'location': 'Test Location',
        'island': 'Mallorca',
        'version': 'VOSE',
        'scraped_at': datetime.now().isoformat()
    }

    validator = ScraperDataValidator()
    valid_movies, result = validator.validate_movies([invalid_movie])

    assert result.valid == False
    assert result.invalid_items == 1


def test_mixed_valid_invalid():
    """Test validating mix of valid and invalid movies"""
    movies = [
        {
            'title': 'Valid Movie',
            'link': 'https://example.com/movie1',
            'showtimes': [{'date': '2025-11-18', 'time': '19:30'}],
            'cinema': 'Test Cinema',
            'location': 'Test Location',
            'island': 'Mallorca',
            'version': 'VOSE',
            'scraped_at': datetime.now().isoformat()
        },
        {
            'title': 'Invalid Movie',
            'showtimes': []  # Missing fields
        }
    ]

    validator = ScraperDataValidator()
    valid_movies, result = validator.validate_movies(movies)

    assert result.valid == False
    assert result.total_items == 2
    assert result.valid_items == 1
    assert result.invalid_items == 1
    assert len(valid_movies) == 1


def test_validation_summary():
    """Test validation summary generation"""
    movies = [
        {
            'title': 'Valid Movie',
            'link': 'https://example.com/movie',
            'showtimes': [{'date': '2025-11-18', 'time': '19:30'}],
            'cinema': 'Test Cinema',
            'location': 'Test Location',
            'island': 'Mallorca',
            'version': 'VOSE',
            'scraped_at': datetime.now().isoformat()
        }
    ]

    validator = ScraperDataValidator()
    valid_movies, result = validator.validate_movies(movies)
    summary = validator.get_validation_summary(result)

    assert "Validation Summary" in summary
    assert "Total items: 1" in summary
    assert "Valid: 1" in summary
