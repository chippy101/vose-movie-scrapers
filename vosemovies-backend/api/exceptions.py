"""
Custom exception handlers for the API

This module provides centralized error handling for database errors,
validation errors, and other exceptions that may occur during request processing.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)


class DatabaseConnectionError(Exception):
    """Raised when database connection fails"""
    pass


class ResourceNotFoundError(Exception):
    """Raised when a requested resource doesn't exist"""
    def __init__(self, resource_type: str, resource_id: any):
        self.resource_type = resource_type
        self.resource_id = resource_id
        super().__init__(f"{resource_type} with ID {resource_id} not found")


async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Handle SQLAlchemy database errors

    Returns appropriate HTTP status codes and error messages
    without leaking internal database details.
    """
    logger.error(
        f"Database error on {request.method} {request.url.path}: {type(exc).__name__}",
        exc_info=True
    )

    if isinstance(exc, OperationalError):
        # Database connection or operational issues
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": "Service Temporarily Unavailable",
                "message": "Database is currently unavailable. Please try again later.",
                "type": "database_connection_error"
            }
        )

    elif isinstance(exc, IntegrityError):
        # Constraint violations (unique, foreign key, etc.)
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": "Conflict",
                "message": "A database constraint was violated. This operation cannot be completed.",
                "type": "integrity_error"
            }
        )

    else:
        # Generic database error
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal Server Error",
                "message": "An unexpected database error occurred. Please try again later.",
                "type": "database_error"
            }
        )


async def validation_exception_handler(request: Request, exc: ValidationError):
    """
    Handle Pydantic validation errors

    Returns detailed validation error information to help clients
    correct their requests.
    """
    logger.warning(
        f"Validation error on {request.method} {request.url.path}: {exc}",
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Request data validation failed",
            "type": "validation_error",
            "details": exc.errors()
        }
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler for unexpected exceptions

    Logs the full exception details while returning a safe
    error message to the client.
    """
    logger.error(
        f"Unhandled exception on {request.method} {request.url.path}: {type(exc).__name__} - {str(exc)}",
        exc_info=True
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
            "type": "internal_error"
        }
    )


def register_exception_handlers(app):
    """
    Register all custom exception handlers with the FastAPI app

    Call this function during app initialization to enable
    centralized error handling.
    """
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    logger.info(" Exception handlers registered")
