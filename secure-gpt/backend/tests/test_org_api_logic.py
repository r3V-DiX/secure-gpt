# backend/tests/test_org_api_logic.py

import unittest
from app.services.org_service import is_public_domain, extract_domain_from_email


class TestOrgAPILogic(unittest.TestCase):
    def test_invite_domain_matching(self):
        org_domain = "acmecorp.com"
        
        # Matching domain
        self.assertEqual(extract_domain_from_email("alice@acmecorp.com"), org_domain)
        self.assertEqual(extract_domain_from_email("bob@ACMECORP.COM"), org_domain)
        
        # Mismatched domain
        self.assertNotEqual(extract_domain_from_email("external@gmail.com"), org_domain)
        self.assertNotEqual(extract_domain_from_email("hacker@othercorp.com"), org_domain)

    def test_registration_domain_validation(self):
        self.assertTrue(is_public_domain("gmail.com"))
        self.assertTrue(is_public_domain("yahoo.com"))
        self.assertFalse(is_public_domain("acmecorp.com"))


if __name__ == "__main__":
    unittest.main()
