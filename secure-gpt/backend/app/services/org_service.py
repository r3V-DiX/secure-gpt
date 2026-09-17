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


async def verify_dns_txt_record(domain: str, expected_token: str) -> bool:
    """
    Checks whether the DNS TXT record for the domain contains the expected token.
    Queries multiple public DNS resolvers (1.1.1.1, 8.8.8.8) via DNS-over-HTTPS or dns.resolver.
    """
    import httpx
    
    # 1. Primary: Cloudflare DNS-over-HTTPS JSON API
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://cloudflare-dns.com/dns-query",
                params={"name": domain, "type": "TXT"},
                headers={"accept": "application/dns-json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                answers = data.get("Answer", [])
                for ans in answers:
                    val = ans.get("data", "").replace('"', '').strip()
                    if expected_token in val:
                        return True
    except Exception:
        pass

    # 2. Fallback: Google DNS-over-HTTPS JSON API
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://dns.google/resolve",
                params={"name": domain, "type": "TXT"},
            )
            if resp.status_code == 200:
                data = resp.json()
                answers = data.get("Answer", [])
                for ans in answers:
                    val = ans.get("data", "").replace('"', '').strip()
                    if expected_token in val:
                        return True
    except Exception:
        pass

    return False


async def migrate_domain_personal_users_to_employees(db, org_id: str, domain: str) -> int:
    """
    When an organization's DNS is verified, automatically migrates all existing
    personal accounts (role: USER) under that domain to role: EMPLOYEE linked to org_id,
    and safely disables their personal DLP policies.
    """
    from app.models.user import User, UserRole
    from app.models.policy import Policy
    from sqlalchemy import select, update

    # Find users whose email ends with @{domain} and role is USER or unlinked
    domain_suffix = f"%@{domain.lower()}"
    res = await db.execute(
        select(User).where(
            User.email.ilike(domain_suffix),
            User.org_id.is_(None) | (User.org_id == org_id),
            User.role == UserRole.USER
        )
    )
    users_to_migrate = res.scalars().all()
    count = len(users_to_migrate)

    for u in users_to_migrate:
        u.org_id = org_id
        u.role = UserRole.EMPLOYEE

        # Disable personal policies in favor of organization policies
        await db.execute(
            update(Policy)
            .where(Policy.user_id == u.id)
            .values(is_disabled_by_org=True)
        )

    if count > 0:
        await db.flush()

    return count
