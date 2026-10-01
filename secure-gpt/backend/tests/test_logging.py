import json
import logging
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.core.logging import (
    setup_logging,
    get_request_id,
    set_request_id,
    RequestIdFilter,
    TextFormatter,
    JsonFormatter,
)
from app.main import app


def test_request_id_filter_and_context():
    set_request_id("test-req-123")
    assert get_request_id() == "test-req-123"

    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Hello test",
        args=(),
        exc_info=None,
    )
    filtr = RequestIdFilter()
    filtr.filter(record)
    assert record.request_id == "test-req-123"

    set_request_id(None)
    filtr.filter(record)
    assert record.request_id == "-"


def test_text_and_json_formatters():
    record = logging.LogRecord(
        name="test_logger",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="Structured log message",
        args=(),
        exc_info=None,
    )
    record.request_id = "req-abc"

    text_fmt = TextFormatter()
    text_out = text_fmt.format(record)
    assert "req-abc" in text_out
    assert "Structured log message" in text_out

    json_fmt = JsonFormatter()
    json_out = json_fmt.format(record)
    parsed = json.loads(json_out)
    assert parsed["level"] == "INFO"
    assert parsed["request_id"] == "req-abc"
    assert parsed["message"] == "Structured log message"


@pytest.mark.asyncio
async def test_request_id_header_in_response():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health", headers={"x-request-id": "custom-req-id"})

    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == "custom-req-id"
