# backend/app/services/org_service.py

import secrets
import re

PUBLIC_EMAIL_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.co.in",
    "yahoo.co.uk",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "zoho.com",
    "proton.me",
    "protonmail.com",
    "mail.com",
    "gmx.com",
    "yandex.com",
}


def extract_domain_from_email(email: str) -> str | None:
    if not email or "@" not in email:
        return None
    parts = email.strip().split("@")
    if len(parts) != 2 or not parts[1]:
        return None
    return parts[1].lower()


def is_public_domain(domain: str) -> bool:
    if not domain:
        return True
    domain_clean = domain.strip().lower()
    return domain_clean in PUBLIC_EMAIL_DOMAINS


def generate_dns_txt_token() -> str:
    random_hex = secrets.token_hex(16)
    return f"securegpt-verification=sgpt-{random_hex}"
