# backend/app/api/v1/admin_rbac.py
# Backward-compatibility bridge after modular decomposition into app.api.v1.admin.*
from app.api.v1.admin import router

__all__ = ["router"]
