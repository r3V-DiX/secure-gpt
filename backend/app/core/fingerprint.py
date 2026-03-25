# backend/app/core/fingerprint.py
# ─────────────────────────────────────────────────────────────────────────────
# Device fingerprint computation.
# Uses only stable, browser-level signals — NO IP address.
# IP is excluded because it changes frequently (mobile networks, VPNs, DHCP)
# and would cause legitimate users to be logged out constantly.
#
# Signals used (all stable across sessions for the same browser/device):
#   - User-Agent       → browser + OS version
#   - Accept-Language  → locale preference
#   - X-Client-Fingerprint header → client-side: platform, timezone, screen res
# ─────────────────────────────────────────────────────────────────────────────

import hashlib
import hmac
import logging

from fastapi import Request

from app.core.config import settings

logger = logging.getLogger(__name__)

# Header sent by the dashboard frontend on every request
FINGERPRINT_HEADER = "X-Client-Fingerprint"


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