import unittest
import importlib.util
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from fastapi import Request, Response
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import Session as SyncSession

import app.models  # noqa: F401
from app.core.database import Base
from app.core.exceptions import BadRequest
from app.models.impersonation_handoff import ImpersonationHandoff
from app.models.org import Organisation
from app.models.session import Session
from app.models.user import User, UserRole
from app.services import session_service


class AsyncDbAdapter:
    def __init__(self, db: SyncSession):
        self.db = db

    def add(self, obj):
        self.db.add(obj)

    async def execute(self, statement):
        return self.db.execute(statement)

    async def get(self, model, key):
        return self.db.get(model, key)

    async def flush(self):
        self.db.flush()


class ImpersonationCookieTests(unittest.IsolatedAsyncioTestCase):
    async def test_admin_and_standard_cookies_have_distinct_names(self):
        self.assertNotEqual(
            session_service.cookie_name_for_portal("admin"),
            session_service.cookie_name_for_portal("standard"),
        )
        response = Response()
        with patch.object(session_service, "SESSION_COOKIE_NAME", session_service.cookie_name_for_portal("admin")):
            session_service.set_session_cookie(response, "admin-session", 900)
        cookie = response.headers["set-cookie"]
        self.assertIn("sgpt_admin_session=admin-session", cookie)
        self.assertNotIn("domain=", cookie.lower())

    async def test_cookie_names_coexist_on_subdomains_and_localhost_ports(self):
        for admin_origin, user_origin in (
            ("https://admin.securegpt.rkavach.com", "https://securegpt.rkavach.com"),
            ("http://localhost:3001", "http://localhost:3000"),
        ):
            def handler(request):
                response = Response()
                if request.url.path == "/admin-login":
                    with patch.object(session_service, "SESSION_COOKIE_NAME", "sgpt_admin_session"):
                        session_service.set_session_cookie(response, "admin-session", 900)
                elif request.url.path == "/user-login":
                    with patch.object(session_service, "SESSION_COOKIE_NAME", "sgpt_session"):
                        session_service.set_session_cookie(response, "user-session", 900)
                return httpx.Response(200, headers=dict(response.headers))

            with httpx.Client(transport=httpx.MockTransport(handler)) as client:
                client.get(f"{admin_origin}/admin-login")
                client.get(f"{user_origin}/user-login")
                admin_cookies = client.get(f"{admin_origin}/dashboard").request.headers.get("cookie", "")
                user_cookies = client.get(f"{user_origin}/dashboard").request.headers.get("cookie", "")
                self.assertIn("sgpt_admin_session=admin-session", admin_cookies)
                self.assertIn("sgpt_session=user-session", user_cookies)
                self.assertEqual(len(client.cookies), 2)

    @unittest.skipUnless(importlib.util.find_spec("email_validator"), "backend email-validator dependency unavailable")
    async def test_exit_restores_valid_previous_session(self):
        from app.api.v1.auth.session import exit_impersonation

        request = Request({"type": "http", "method": "POST", "path": "/api/v1/auth/impersonate/exit", "headers": [(b"cookie", b"sgpt_session=impersonation-session")]})
        request.state.is_impersonation = True
        prior = type("Prior", (), {
            "id": "original-session",
            "is_valid": True,
            "is_impersonation": False,
            "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
            "user": type("User", (), {"is_active": True})(),
        })()
        impersonation = type("Impersonation", (), {"previous_session_id": prior.id})()
        db = AsyncMock()

        with patch("app.api.v1.auth.session.get_session", new=AsyncMock(return_value=impersonation)), \
             patch("app.api.v1.auth.session.validate_session", new=AsyncMock(return_value=(prior, None))), \
             patch("app.api.v1.auth.session.revoke_session", new=AsyncMock()):
            response = Response()
            await exit_impersonation(request, response, db, current_user=object())

        self.assertIn(f"{session_service.SESSION_COOKIE_NAME}={prior.id}", response.headers.get("set-cookie", ""))

    @unittest.skipUnless(importlib.util.find_spec("email_validator"), "backend email-validator dependency unavailable")
    async def test_exit_does_not_restore_expired_previous_session(self):
        from app.api.v1.auth.session import exit_impersonation

        request = Request({"type": "http", "method": "POST", "path": "/api/v1/auth/impersonate/exit", "headers": [(b"cookie", b"sgpt_session=impersonation-session")]})
        request.state.is_impersonation = True
        impersonation = type("Impersonation", (), {"previous_session_id": "expired-session"})()
        db = AsyncMock()
        with patch("app.api.v1.auth.session.get_session", new=AsyncMock(return_value=impersonation)), \
             patch("app.api.v1.auth.session.validate_session", new=AsyncMock(return_value=(None, "SESSION_EXPIRED"))), \
             patch("app.api.v1.auth.session.revoke_session", new=AsyncMock()):
            response = Response()
            await exit_impersonation(request, response, db, current_user=object())

        self.assertIn("Max-Age=0", response.headers.get("set-cookie", ""))

    @unittest.skipUnless(importlib.util.find_spec("email_validator"), "backend email-validator dependency unavailable")
    async def test_redeem_form_keeps_previous_login_for_exit(self):
        from app.api.v1.auth.session import redeem_impersonation

        async def receive():
            return {"type": "http.request", "body": b"ticket=one-use-ticket", "more_body": False}

        request = Request({
            "type": "http", "method": "POST", "path": "/api/v1/auth/impersonate/redeem",
            "headers": [
                (b"content-type", b"application/x-www-form-urlencoded"),
                (b"cookie", b"sgpt_session=original-session"),
            ],
        }, receive)
        prior = SimpleNamespace(is_valid=True, is_impersonation=False, user=SimpleNamespace(is_active=True))
        create_session = AsyncMock(return_value=SimpleNamespace(id="impersonation-session"))
        db = AsyncMock()
        with patch("app.api.v1.auth.session.redeem_impersonation_handoff", new=AsyncMock(return_value=("target", "admin"))), \
             patch("app.api.v1.auth.session.get_session", new=AsyncMock(return_value=prior)), \
             patch("app.api.v1.auth.session.create_impersonation_session", new=create_session):
            response = await redeem_impersonation(request, db)

        self.assertEqual(response.status_code, 303)
        self.assertEqual(response.headers["location"], "/dashboard")
        self.assertIn("sgpt_session=impersonation-session", response.headers["set-cookie"])
        self.assertEqual(create_session.await_args.kwargs["previous_session_id"], "original-session")

    async def test_handoff_is_single_use_and_expires(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine, tables=[Organisation.__table__, User.__table__, Session.__table__, ImpersonationHandoff.__table__])
        with SyncSession(engine) as sync_db:
            db = AsyncDbAdapter(sync_db)
            sync_db.add(Organisation(id="org-1", name="Org", admin_email="admin@example.com", is_active=True))
            sync_db.add(User(id="admin-1", email="admin@example.com", role=UserRole.SUPER_ADMIN, is_active=True))
            sync_db.add(User(id="user-1", email="user@example.com", role=UserRole.USER, org_id="org-1", is_active=True))
            sync_db.commit()

            ticket = await session_service.create_impersonation_handoff(db, "user-1", "admin-1", "org-1")
            self.assertEqual(await session_service.redeem_impersonation_handoff(db, ticket), ("user-1", "admin-1"))
            with self.assertRaises(BadRequest):
                await session_service.redeem_impersonation_handoff(db, ticket)

            expired = await session_service.create_impersonation_handoff(db, "user-1", "admin-1", "org-1")
            grant = sync_db.get(ImpersonationHandoff, __import__("hashlib").sha256(expired.encode()).hexdigest())
            grant.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
            sync_db.commit()
            with self.assertRaises(BadRequest):
                await session_service.redeem_impersonation_handoff(db, expired)
        engine.dispose()


if __name__ == "__main__":
    unittest.main()
