# backend/app/schemas/release_schema.py
# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas for System Releases & Changelog API
# ─────────────────────────────────────────────────────────────────────────────

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SystemReleaseBase(BaseModel):
    component: str = Field(default="baseline", description="Category: baseline, admin, extension")
    version: str = Field(..., description="Semver string, e.g. 1.1.5")
    release_date: str = Field(..., description="Human readable date or ISO date")
    status: str = Field(default="Production Stable", description="Release status")
    tag: str = Field(default="", description="Release headline / title tag")
    commit_hash: str = Field(default="", description="Git commit / release tag")
    summary: str = Field(default="", description="Brief executive summary")
    info: str = Field(default="", description="Detailed release description")
    whats_new: List[str] = Field(default_factory=list, description="List of what's new bullet points")
    changed_functionality: List[str] = Field(default_factory=list, description="List of changed functionality")
    improvements: List[str] = Field(default_factory=list, description="List of performance and UX improvements")
    problems_solved: List[str] = Field(default_factory=list, description="List of resolved issues")
    is_active: bool = Field(default=True, description="Whether this release is visible")
    order_index: int = Field(default=0, description="Display order ranking")


class SystemReleaseCreate(SystemReleaseBase):
    pass


class SystemReleaseUpdate(BaseModel):
    component: Optional[str] = None
    version: Optional[str] = None
    release_date: Optional[str] = None
    status: Optional[str] = None
    tag: Optional[str] = None
    commit_hash: Optional[str] = None
    summary: Optional[str] = None
    info: Optional[str] = None
    whats_new: Optional[List[str]] = None
    changed_functionality: Optional[List[str]] = None
    improvements: Optional[List[str]] = None
    problems_solved: Optional[List[str]] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None


class SystemReleaseResponse(BaseModel):
    id: str
    component: str
    version: str
    date: str
    status: str
    tag: str
    commit: str
    summary: str
    info: str
    whatsNew: List[str]
    changedFunctionality: List[str]
    improvements: List[str]
    problemsSolved: List[str]
    isActive: bool
    orderIndex: int
    createdAt: Optional[str] = None

    class Config:
        from_attributes = True


class SystemReleasesGroupedResponse(BaseModel):
    status: str = "ok"
    currentVersion: str
    components: Dict[str, str]
    releases: Dict[str, List[SystemReleaseResponse]]
