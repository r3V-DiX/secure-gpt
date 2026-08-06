# backend/app/core/pagination.py
# ─────────────────────────────────────────────────────────────────────────────
# Reusable server-side pagination dependency.
# Inject `Pagination` into any route that returns a list.
# ─────────────────────────────────────────────────────────────────────────────

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Query


@dataclass
class PaginationParams:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


async def pagination_params(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


# Annotated shorthand for injection
Pagination = Annotated[PaginationParams, Depends(pagination_params)]