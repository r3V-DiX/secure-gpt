# backend/tests/test_org_service.py
import unittest
from app.services.org_service import is_public_domain, extract_domain_from_email, generate_dns_txt_token


class TestOrgValidationService(unittest.TestCase):
    def test_extract_domain_from_email(self):
        self.assertEqual(extract_domain_from_email("admin@acmecorp.com"), "acmecorp.com")
        self.assertEqual(extract_domain_from_email("USER@COMPANY.ORG"), "company.org")
        self.assertIsNone(extract_domain_from_email("invalid-email"))

    def test_block_public_domains(self):
        self.assertTrue(is_public_domain("gmail.com"))
        self.assertTrue(is_public_domain("yahoo.com"))
        self.assertTrue(is_public_domain("outlook.com"))
        self.assertTrue(is_public_domain("hotmail.com"))
        self.assertFalse(is_public_domain("acmecorp.com"))
        self.assertFalse(is_public_domain("securegpt.io"))

    def test_generate_dns_txt_token(self):
        token = generate_dns_txt_token()
        self.assertTrue(token.startswith("securegpt-verification="))
        self.assertGreater(len(token), 30)


if __name__ == "__main__":
    unittest.main()
