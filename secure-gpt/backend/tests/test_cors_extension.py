import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_extension_cors_allowed_in_dev():
    settings.debug = True
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.options(
            "/api/v1/system/version",
            headers={"Origin": "chrome-extension://abcdefghijklmnop"}
        )
        assert res.status_code == 200
        assert res.headers.get("access-control-allow-origin") == "chrome-extension://abcdefghijklmnop"

@pytest.mark.asyncio
async def test_extension_cors_forbidden_in_prod_when_not_allowlisted():
    settings.debug = False
    settings.allowed_extension_ids = "approvedextensionid123"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get(
            "/api/v1/system/version",
            headers={"Origin": "chrome-extension://maliciousunapprovedid"}
        )
        assert res.status_code == 403
        data = res.json()
        assert data["error"]["code"] == "FORBIDDEN_ORIGIN"
    settings.debug = True  # reset
