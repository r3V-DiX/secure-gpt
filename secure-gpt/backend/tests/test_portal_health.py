import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.main import app


@pytest.mark.asyncio
@pytest.mark.parametrize("portal_mode", ["standard", "admin"])
async def test_health_reports_portal_mode(monkeypatch, portal_mode):
    monkeypatch.setattr(settings, "portal_mode", portal_mode)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json()["portal_mode"] == portal_mode
