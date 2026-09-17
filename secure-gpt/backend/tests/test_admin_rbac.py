import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_admin_rbac_routes_registered():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Route exists and requires auth/permissions, returning 401/403 rather than 404
        resp = await ac.get("/api/v1/admin/users")
        assert resp.status_code in (401, 403)

        resp_roles = await ac.get("/api/v1/admin/roles")
        assert resp_roles.status_code in (401, 403)

        resp_perms = await ac.get("/api/v1/admin/permissions")
        assert resp_perms.status_code in (401, 403)

        resp_logs = await ac.get("/api/v1/admin/system-logs")
        assert resp_logs.status_code in (401, 403)

        resp_orgs = await ac.get("/api/v1/admin/orgs")
        assert resp_orgs.status_code in (401, 403)

        resp_org_verify = await ac.post("/api/v1/admin/orgs/verify", json={"org_id": "dummy"})
        assert resp_org_verify.status_code in (401, 403)
