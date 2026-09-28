# backend/app/services/email_notifications.py
"""
High-level enterprise email dispatchers for team invitations,
DNS TXT verification, role updates, and DLP security incident alerts.
"""

import os
from typing import Any, Dict, List, Optional
from app.services.email_renderer import render_email_template
from app.services.email_service import send_email_dispatch


async def send_employee_invitation_email(
    to_email: str,
    org_name: str,
    inviter_name: str,
    invite_url: str,
    role: str = "Employee",
) -> bool:
    """Dispatches a team invitation email with 1-click accept link."""
    dashboard_base = os.getenv("DASHBOARD_URL", "http://localhost:3000")
    if invite_url.startswith("/"):
        full_invite_url = f"{dashboard_base.rstrip('/')}{invite_url}"
    else:
        full_invite_url = invite_url

    subject = f"Invitation to join {org_name} on SecureGPT"
    text_content = (
        f"You have been invited by {inviter_name} to join {org_name} on SecureGPT as an {role}.\n\n"
        f"Accept your invitation here:\n{full_invite_url}\n\n"
        f"This invitation will expire in 7 days."
    )

    html_content = render_email_template(
        "emails/employee_invite.html",
        {
            "org_name": org_name,
            "inviter_name": inviter_name,
            "invite_url": full_invite_url,
            "role": role,
        },
    )

    return await send_email_dispatch(to_email, subject, html_content, text_content)


async def send_dns_instructions_email(
    to_email: str,
    org_name: str,
    domain: str,
    txt_token: str,
) -> bool:
    """Dispatches step-by-step DNS TXT setup instructions to an Org Admin."""
    dashboard_base = os.getenv("DASHBOARD_URL", "http://localhost:3000")
    dashboard_url = f"{dashboard_base.rstrip('/')}/admin/settings"

    subject = f"DNS TXT Verification Guide for {domain}"
    text_content = (
        f"DNS TXT Verification Guide for {org_name} ({domain})\n\n"
        f"Record Type: TXT\n"
        f"Host / Name: @ (or {domain})\n"
        f"Token Value: {txt_token}\n\n"
        f"Once added, return to your SecureGPT admin dashboard to verify domain ownership:\n"
        f"{dashboard_url}"
    )

    html_content = render_email_template(
        "emails/dns_instructions.html",
        {
            "org_name": org_name,
            "domain": domain,
            "txt_token": txt_token,
            "dashboard_url": dashboard_url,
        },
    )

    return await send_email_dispatch(to_email, subject, html_content, text_content)


async def send_dns_verification_success_email(
    to_email: str,
    org_name: str,
    domain: str,
) -> bool:
    """Dispatches verification success alert to Org Admin."""
    dashboard_base = os.getenv("DASHBOARD_URL", "http://localhost:3000")
    dashboard_url = f"{dashboard_base.rstrip('/')}/admin"

    subject = f"Domain Verified: {domain} is now active"
    text_content = (
        f"Domain verification for {domain} has succeeded!\n\n"
        f"Your organization {org_name} is now ACTIVE. Users with @{domain} emails "
        f"will automatically be enrolled under your enterprise policies."
    )

    html_content = render_email_template(
        "emails/dns_success.html",
        {
            "org_name": org_name,
            "domain": domain,
            "dashboard_url": dashboard_url,
        },
    )

    return await send_email_dispatch(to_email, subject, html_content, text_content)


async def send_role_change_notification_email(
    to_email: str,
    new_roles: Any,
    updated_by: Optional[str] = None,
) -> bool:
    """Notifies a user when their workspace permissions/roles are switched."""
    roles_str = ", ".join(new_roles) if isinstance(new_roles, (list, set, tuple)) else str(new_roles)
    subject = "Your SecureGPT workspace role has been updated"
    text_content = (
        f"Your workspace role on SecureGPT has been updated to: {roles_str}.\n"
        f"These privileges are effective immediately."
    )

    html_content = render_email_template(
        "emails/role_change.html",
        {
            "user_email": to_email,
            "new_roles": new_roles,
            "updated_by": updated_by,
        },
    )

    return await send_email_dispatch(to_email, subject, html_content, text_content)
