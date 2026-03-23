# ─────────────────────────────────────────────
# Redaction Schemas
# ─────────────────────────────────────────────

from pydantic import BaseModel, Field
from typing import List


class RedactionRegion(BaseModel):
    page: int = Field(..., ge=0)
    x: float
    y: float
    width: float
    height: float


class RedactionRequest(BaseModel):
    regions: List[RedactionRegion]
