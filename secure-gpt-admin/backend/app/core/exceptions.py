# backend/app/core/exceptions.py
# ─────────────────────────────────────────────────────────────────────────────
# Custom exception hierarchy. Every error in the app raises one of these.
# The global error handler in error_handlers.py catches them all.
# ─────────────────────────────────────────────────────────────────────────────

from typing import Any


class AppException(Exception):
    """Base exception for all application errors."""

    status_code: int = 500
    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"

    def __init__(
        self,
        message: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message or self.__class__.message
        self.details = details or {}
        super().__init__(self.message)


# ─── Auth Errors (4xx) ────────────────────────────────────────────────────────

class AuthRequired(AppException):
    status_code = 401
    code = "AUTH_REQUIRED"
    message = "Authentication required"


class SessionExpired(AppException):
    status_code = 401
    code = "SESSION_EXPIRED"
    message = "Your session has expired. Please sign in again"


class SessionRevoked(AppException):
    status_code = 401
    code = "SESSION_REVOKED"
    message = "Your session has been revoked. Please sign in again"


class FingerprintMismatch(AppException):
    status_code = 401
    code = "FINGERPRINT_MISMATCH"
    message = "Session invalidated due to suspicious activity. Please sign in again"


class OAuthFailed(AppException):
    status_code = 400
    code = "OAUTH_FAILED"
    message = "Google authentication failed"


class UserInactive(AppException):
    status_code = 403
    code = "USER_INACTIVE"
    message = "Your account has been deactivated"


class Forbidden(AppException):
    status_code = 403
    code = "FORBIDDEN"
    message = "You do not have permission to perform this action"


# ─── Resource Errors (4xx) ────────────────────────────────────────────────────

class NotFound(AppException):
    status_code = 404
    code = "NOT_FOUND"
    message = "Resource not found"


class AlreadyExists(AppException):
    status_code = 409
    code = "ALREADY_EXISTS"
    message = "Resource already exists"


class ValidationError(AppException):
    status_code = 422
    code = "VALIDATION_ERROR"
    message = "Validation failed"


class RateLimited(AppException):
    status_code = 429
    code = "RATE_LIMITED"
    message = "Too many requests. Please slow down"


# ─── Extension Errors (4xx) ───────────────────────────────────────────────────

class InvalidLogBatch(AppException):
    status_code = 400
    code = "INVALID_LOG_BATCH"
    message = "Malformed log batch"


class BatchTooLarge(AppException):
    status_code = 400
    code = "BATCH_TOO_LARGE"
    message = "Batch exceeds maximum of 100 events"


class PolicyNotFound(AppException):
    status_code = 404
    code = "POLICY_NOT_FOUND"
    message = "No active policy found for this user"


# ─── Server Errors (5xx) ──────────────────────────────────────────────────────

class DatabaseError(AppException):
    status_code = 503
    code = "DATABASE_ERROR"
    message = "Database operation failed"


class ServiceUnavailable(AppException):
    status_code = 503
    code = "SERVICE_UNAVAILABLE"
    message = "Service temporarily unavailable"