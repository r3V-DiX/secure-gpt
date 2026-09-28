# backend/tests/test_email_service.py

import unittest
from unittest.mock import patch, AsyncMock
from app.services.email_renderer import render_email_template
from app.services.email_service import send_otp_email
from app.services.email_notifications import (
    send_employee_invitation_email,
    send_dns_instructions_email,
    send_dns_verification_success_email,
    send_role_change_notification_email,
)


class TestEmailTemplatesAndService(unittest.IsolatedAsyncioTestCase):
    def test_otp_template_rendering(self):
        otp = "849201"
        rendered = render_email_template(
            "emails/otp.html",
            {
                "title": "Your SecureGPT Verification Code",
                "otp_code": otp,
                "expires_in_minutes": 10,
            },
        )
        self.assertIn("849201", rendered)
        self.assertIn("10 minutes", rendered)
        self.assertIn("Security Notice", rendered)
        self.assertIn("SecureGPT", rendered)
        self.assertIn("<svg", rendered)
        self.assertIn("Security Verification", rendered)

    @patch("app.services.email_service._send_smtp_sync", return_value=True)
    async def test_send_otp_email_subject_omits_otp(self, mock_smtp):
        otp = "773190"
        with patch.dict("os.environ", {"RESEND_API_KEY": ""}):
            result = await send_otp_email("test@securegpt.com", otp)
            self.assertTrue(result)
            mock_smtp.assert_called_once()
            args, _ = mock_smtp.call_args
            to_email, subject, html_content, text_content = args

            self.assertEqual(to_email, "test@securegpt.com")
            self.assertNotIn(otp, subject)
            self.assertEqual(subject, "Your SecureGPT verification code")
            self.assertIn(otp, html_content)
            self.assertIn(otp, text_content)
            self.assertIn("10 minutes", text_content)

    @patch("app.services.email_service._send_smtp_sync", return_value=True)
    async def test_employee_invitation_email(self, mock_smtp):
        with patch.dict("os.environ", {"RESEND_API_KEY": ""}):
            result = await send_employee_invitation_email(
                to_email="dev@acme.com",
                org_name="Acme Corp",
                inviter_name="Alice Admin",
                invite_url="/login?invite=abc123token",
                role="Employee",
            )
            self.assertTrue(result)
            args, _ = mock_smtp.call_args
            to_email, subject, html_content, text_content = args
            self.assertEqual(to_email, "dev@acme.com")
            self.assertIn("Acme Corp", subject)
            self.assertIn("Acme Corp", html_content)
            self.assertIn("Alice Admin", html_content)
            self.assertIn("login?invite=abc123token", html_content)
            self.assertIn("<svg", html_content)
            self.assertIn("Team Invitation", html_content)

    @patch("app.services.email_service._send_smtp_sync", return_value=True)
    async def test_dns_instructions_email(self, mock_smtp):
        with patch.dict("os.environ", {"RESEND_API_KEY": ""}):
            result = await send_dns_instructions_email(
                to_email="admin@acme.com",
                org_name="Acme Corp",
                domain="acme.com",
                txt_token="securegpt-domain-token-998877",
            )
            self.assertTrue(result)
            args, _ = mock_smtp.call_args
            to_email, subject, html_content, text_content = args
            self.assertIn("acme.com", subject)
            self.assertIn("TXT", html_content)
            self.assertIn("securegpt-domain-token-998877", html_content)
            self.assertIn("Domain Setup", html_content)

    @patch("app.services.email_service._send_smtp_sync", return_value=True)
    async def test_dns_verification_success_email(self, mock_smtp):
        with patch.dict("os.environ", {"RESEND_API_KEY": ""}):
            result = await send_dns_verification_success_email(
                to_email="admin@acme.com",
                org_name="Acme Corp",
                domain="acme.com",
            )
            self.assertTrue(result)
            args, _ = mock_smtp.call_args
            to_email, subject, html_content, text_content = args
            self.assertIn("Domain Verified", subject)
            self.assertIn("acme.com", html_content)
            self.assertIn("Domain Verified", html_content)

    @patch("app.services.email_service._send_smtp_sync", return_value=True)
    async def test_role_change_notification_email(self, mock_smtp):
        with patch.dict("os.environ", {"RESEND_API_KEY": ""}):
            result = await send_role_change_notification_email(
                to_email="bob@acme.com",
                new_roles=["Org Admin", "Security Auditor"],
                updated_by="Super Admin",
            )
            self.assertTrue(result)
            args, _ = mock_smtp.call_args
            to_email, subject, html_content, text_content = args
            self.assertIn("role has been updated", subject)
            self.assertIn("bob@acme.com", html_content)
            self.assertIn("Org Admin", html_content)
            self.assertIn("Super Admin", html_content)


if __name__ == "__main__":
    unittest.main()
