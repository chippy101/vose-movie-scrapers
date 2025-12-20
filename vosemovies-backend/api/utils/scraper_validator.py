"""
Utility for validating scraper data with Pydantic schemas
Provides validation, error collection, and data cleaning
"""
from typing import List, Dict, Tuple
from pydantic import ValidationError
from api.schemas.scraper import ScrapedMovie, ScraperValidationResult
import logging

logger = logging.getLogger(__name__)


class ScraperDataValidator:
    """Validates scraped movie data using Pydantic schemas"""

    @staticmethod
    def validate_movies(movies: List[Dict]) -> Tuple[List[ScrapedMovie], ScraperValidationResult]:
        """
        Validate a list of scraped movies

        Args:
            movies: List of raw movie dictionaries from scrapers

        Returns:
            Tuple of (valid_movies, validation_result)
            - valid_movies: List of validated ScrapedMovie objects
            - validation_result: Summary of validation results
        """
        valid_movies = []
        errors = []
        warnings = []

        for idx, movie_data in enumerate(movies):
            try:
                # Validate using Pydantic model
                validated_movie = ScrapedMovie(**movie_data)
                valid_movies.append(validated_movie)

                # Warnings for edge cases
                if len(validated_movie.showtimes) > 50:
                    warnings.append(
                        f"Movie '{validated_movie.title}' has {len(validated_movie.showtimes)} showtimes (unusually high)"
                    )

            except ValidationError as e:
                # Collect validation errors with context
                error_detail = {
                    'index': idx,
                    'movie_title': movie_data.get('title', 'Unknown'),
                    'cinema': movie_data.get('cinema', 'Unknown'),
                    'errors': []
                }

                for error in e.errors():
                    error_detail['errors'].append({
                        'field': '.'.join(str(x) for x in error['loc']),
                        'message': error['msg'],
                        'type': error['type']
                    })

                errors.append(error_detail)
                logger.warning(
                    f"Validation failed for movie at index {idx} ({movie_data.get('title', 'Unknown')}): {error_detail}"
                )

            except Exception as e:
                # Catch any other unexpected errors
                error_detail = {
                    'index': idx,
                    'movie_title': movie_data.get('title', 'Unknown'),
                    'cinema': movie_data.get('cinema', 'Unknown'),
                    'errors': [{'field': 'unknown', 'message': str(e), 'type': 'unexpected_error'}]
                }
                errors.append(error_detail)
                logger.error(f"Unexpected error validating movie at index {idx}: {e}")

        # Create validation result summary
        total_items = len(movies)
        valid_items = len(valid_movies)
        invalid_items = len(errors)

        result = ScraperValidationResult(
            valid=len(errors) == 0,
            total_items=total_items,
            valid_items=valid_items,
            invalid_items=invalid_items,
            errors=errors,
            warnings=warnings
        )

        # Log summary
        if errors:
            logger.warning(
                f"Validation completed: {valid_items}/{total_items} valid, {invalid_items} invalid"
            )
        else:
            logger.info(f"Validation completed: All {total_items} items valid")

        return valid_movies, result

    @staticmethod
    def validate_and_filter(movies: List[Dict], strict: bool = False) -> List[ScrapedMovie]:
        """
        Validate movies and return only valid ones

        Args:
            movies: List of raw movie dictionaries
            strict: If True, raise exception if any validation fails

        Returns:
            List of validated ScrapedMovie objects (invalid ones filtered out)

        Raises:
            ValidationError: If strict=True and any validation fails
        """
        valid_movies, result = ScraperDataValidator.validate_movies(movies)

        if strict and not result.valid:
            error_msg = f"Validation failed: {result.invalid_items} invalid items out of {result.total_items}"
            logger.error(error_msg)
            raise ValidationError(error_msg)

        if result.invalid_items > 0:
            logger.warning(
                f"Filtered out {result.invalid_items} invalid movies. "
                f"Using {result.valid_items} valid movies."
            )

        return valid_movies

    @staticmethod
    def get_validation_summary(result: ScraperValidationResult) -> str:
        """
        Get a human-readable summary of validation results

        Args:
            result: Validation result object

        Returns:
            Formatted string summary
        """
        summary = [
            f"Validation Summary:",
            f"  Total items: {result.total_items}",
            f"  Valid: {result.valid_items}",
            f"  Invalid: {result.invalid_items}",
            f"  Status: {'✓ PASSED' if result.valid else '✗ FAILED'}"
        ]

        if result.warnings:
            summary.append(f"\nWarnings ({len(result.warnings)}):")
            for warning in result.warnings:
                summary.append(f"  - {warning}")

        if result.errors:
            summary.append(f"\nErrors ({len(result.errors)}):")
            for error in result.errors[:5]:  # Show first 5 errors
                summary.append(
                    f"  - Movie '{error['movie_title']}' at {error['cinema']}: "
                    f"{len(error['errors'])} validation error(s)"
                )
            if len(result.errors) > 5:
                summary.append(f"  ... and {len(result.errors) - 5} more errors")

        return '\n'.join(summary)
