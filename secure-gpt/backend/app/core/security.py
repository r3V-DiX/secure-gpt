# backend/app/core/security.py
# ─────────────────────────────────────────────────────────────────────────────
# Security utilities.
# Email/password auth is removed — Google OAuth only.
# This file kept minimal for any future needs.
# ─────────────────────────────────────────────────────────────────────────────

import hashlib
import hmac
import secrets


def generate_token(nbytes: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(nbytes)


def hash_token(token: str, secret: str) -> str:
    """HMAC-SHA256 hash of a token with a secret key."""
    return hmac.new(
        secret.encode(),
        token.encode(),
        hashlib.sha256,
    ).hexdigest()