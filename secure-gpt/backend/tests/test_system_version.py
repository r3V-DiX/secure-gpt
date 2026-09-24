import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.asyncio
async def test_system_version_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/system/version")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["version"] == settings.app_version
        assert "commit" in data
        assert "buildTime" in data
        assert "components" in data
