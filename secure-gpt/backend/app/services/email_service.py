# backend/app/services/email_service.py

import os
import smtplib
import logging
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def _send_smtp_sync(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Sync SMTP sender run in a separate thread."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM", "no-reply@securegpt.com")

    if not smtp_host or not smtp_port:
        app_env = os.getenv("APP_ENV", "development")
        safe_content = text_content if app_env == "development" else "[REDACTED FOR SECURITY IN NON-DEVELOPMENT ENVIRONMENT]"
        logger.warning(
            f"[EMAIL MOCK] No SMTP_HOST/SMTP_PORT configured. Printing email to logs:\n"
            f"To: {to_email}\nSubject: {subject}\nContent:\n{safe_content}"
        )
        return True

    try:
        port = int(smtp_port)
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_from
        msg["To"] = to_email

        # Attach text and html parts
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Send via SMTP
        # Determine if SSL or TLS/STARTTLS based on port
        if port == 465:
            server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, port, timeout=10)
            if port == 587:
                server.starttls()

        if smtp_username and smtp_password:
            server.login(smtp_username, smtp_password)

        server.sendmail(smtp_from, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully sent email to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {str(e)}")
        # Print fallback to stdout so we never fail completely in dev/test
        app_env = os.getenv("APP_ENV", "development")
        safe_content = text_content if app_env == "development" else "[REDACTED FOR SECURITY IN NON-DEVELOPMENT ENVIRONMENT]"
        logger.info(
            f"[EMAIL FALLBACK] Printing email to logs due to SMTP failure:\n"
            f"To: {to_email}\nSubject: {subject}\nContent:\n{safe_content}"
        )
        return False


async def send_otp_email(to_email: str, otp_code: str) -> bool:
    """Sends OTP email asynchronously using Resend API or falls back to SMTP."""
    from app.services.email_renderer import render_email_template

    resend_api_key = os.getenv("RESEND_API_KEY")
    email_from = os.getenv("EMAIL_FROM", "support@rkavach.com")
    
    # Security requirement: OTP should not be visible in Subject line
    subject = "Your SecureGPT verification code"
    text_content = (
        f"Your SecureGPT login verification code is: {otp_code}\n\n"
        f"This code will expire in 10 minutes. Do not share it with anyone.\n\n"
        f"If you did not request this, you can ignore this email.\n"
    )
    
    html_content = render_email_template(
        "emails/otp.html",
        {
            "title": "Your SecureGPT Verification Code",
            "otp_code": otp_code,
            "expires_in_minutes": 10,
        },
    )
    return await send_email_dispatch(to_email, subject, html_content, text_content)


async def send_email_dispatch(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Dispatches email asynchronously via Resend API or falls back to SMTP."""
    resend_api_key = os.getenv("RESEND_API_KEY")
    email_from = os.getenv("EMAIL_FROM", "support@rkavach.com")

    if resend_api_key:
        import httpx
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": f"SecureGPT <{email_from}>",
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                        "text": text_content
                    }
                )
                if resp.status_code in (200, 201):
                    logger.info(f"Successfully sent email to {to_email} via Resend")
                    return True
                else:
                    logger.error(f"Resend returned status code {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Failed to send email via Resend: {str(e)}")

    return await asyncio.to_thread(
        _send_smtp_sync, to_email, subject, html_content, text_content
    )


async def send_deactivation_email(to_email: str) -> bool:
    """Sends immediate account deactivation/deletion scheduling email."""
    resend_api_key = os.getenv("RESEND_API_KEY")
    email_from = os.getenv("EMAIL_FROM", "support@rkavach.com")
    
    subject = "Your SecureGPT account is scheduled for deletion"
    text_content = (
        f"Your SecureGPT account ({to_email}) has been scheduled for permanent deletion.\n\n"
        f"We will keep your account on hold (deactivated) for 45 days. You can restore your "
        f"account at any time during this period simply by logging back in and confirming the restoration.\n\n"
        f"If you do not restore your account, it will be permanently deleted on the 46th day.\n"
    )
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f5f6; padding: 20px; }}
            .card {{ background: #ffffff; border: 1px solid #e1e8ed; border-radius: 12px; padding: 30px; max-width: 480px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }}
            .logo {{ font-size: 20px; font-weight: bold; color: #dc2626; margin-bottom: 24px; text-align: center; }}
            .title {{ font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 8px; }}
            .desc {{ font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 20px; }}
            .footer {{ font-size: 11px; color: #9ca3af; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="logo">SecureGPT</div>
            <div class="title">Account Scheduled for Deletion</div>
            <div class="desc">Your account ({to_email}) has been successfully scheduled for deletion.</div>
            <div class="desc">As per our policy, your account will remain in a deactivated state for a <strong>45-day grace period</strong>. You can restore your account and all data at any point before then simply by logging back in.</div>
            <div class="desc">If no action is taken, your account will be permanently deleted on the 46th day.</div>
            <div class="footer">SecureGPT DLP Solutions &copy; 2026</div>
        </div>
    </body>
    </html>
    """

    return await send_email_dispatch(to_email, subject, html_content, text_content)

