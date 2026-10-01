# backend/tests/test_super_admin_features.py
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_super_admin_freeze_and_impersonate_routes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Emergency killswitch freeze route requires Super Admin auth (returns 401 unauthenticated)
        resp_freeze = await ac.post("/api/v1/admin/orgs/test-org-id/freeze", json={"confirmation": "FREEZE"})
        assert resp_freeze.status_code in (401, 403)

        # Impersonate route requires Super Admin auth (returns 401 unauthenticated)
        resp_impersonate = await ac.post("/api/v1/admin/orgs/test-org-id/impersonate")
        assert resp_impersonate.status_code in (401, 403)

        # Exit requires an active impersonation session.
        resp_exit = await ac.post("/api/v1/auth/impersonate/exit")
        assert resp_exit.status_code in (401, 403)
