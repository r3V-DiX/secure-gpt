# backend/app/core/fingerprint.py
# ─────────────────────────────────────────────────────────────────────────────
# Device fingerprint computation.
# Uses only stable, browser-level signals — NO IP address.
#
# EXTENSION BYPASS:
# Chrome extension background service workers have different headers than
# browser tabs (no Accept-Language, different UA). To prevent false
# FINGERPRINT_MISMATCH revocations, requests carrying X-Extension-Request: true
# are excluded from fingerprint binding and validation.
# The session cookie itself is still validated — only fingerprint check skipped.
# ─────────────────────────────────────────────────────────────────────────────

import hashlib
import hmac
import logging

from fastapi import Request

from app.core.config import settings

logger = logging.getLogger(__name__)

# Header sent by the dashboard frontend on every request
FINGERPRINT_HEADER = "X-Client-Fingerprint"

# Header sent by extension background service worker requests
# When present, fingerprint binding and validation is skipped
EXTENSION_REQUEST_HEADER = "X-Extension-Request"


def is_extension_request(request: Request) -> bool:
    """
    Returns True if the request originates from the Chrome extension
    background service worker.

    Extension background workers have unstable headers (no Accept-Language,
    different UA per Chrome version) that would cause constant fingerprint
    mismatches and session revocations for legitimate users.

    Security note: The session cookie is still fully validated — only the
    fingerprint check is skipped. An attacker cannot forge this header to
    bypass auth entirely since they still need a valid session cookie.
    """
    return request.headers.get(EXTENSION_REQUEST_HEADER, "").lower() == "true"


def compute_fingerprint(request: Request) -> str:
    """
    Compute a stable device fingerprint from request headers.
    Returns a hex digest string.

    Components:
        - User-Agent (browser + OS)
        - Accept-Language (locale)
        - X-Client-Fingerprint (client-collected: platform, timezone, screen)
    """
    user_agent = request.headers.get("user-agent", "")
    accept_language = request.headers.get("accept-language", "")
    client_fp = request.headers.get(FINGERPRINT_HEADER, "")

    raw = f"{user_agent}|{accept_language}|{client_fp}"

    # HMAC with the app secret key — prevents rainbow table attacks
    digest = hmac.new(
        settings.secret_key.encode(),
        raw.encode(),
        hashlib.sha256,
    ).hexdigest()

    return digest


def verify_fingerprint(request: Request, stored_hash: str) -> bool:
    """
    Verify the current request fingerprint matches the stored one.
    Returns True if they match, False if mismatch (suspicious activity).
    """
    current = compute_fingerprint(request)
    return hmac.compare_digest(current, stored_hash)