# SecureGPT - Production Release Tracker

Single source of truth for deployments, releases, database migrations, and component versions across production environments (`securegpt.rkavach.com`, `admin.securegpt.rkavach.com`, `api.securegpt.rkavach.com`).

---

## Release History

### [v1.0.0] - Baseline Production Release
- **Date**: 2026-09-11
- **Commit**: `prod-v1.0.0`
- **Environment**: Production (`ap-south-1`)
- **Status**: Stable Deployed

#### Component Matrix
| Component | Service Name | Version | Image / Artifact |
|---|---|---|---|
| User Backend API | `secure-gpt-backend` | `1.0.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-backend:prod-latest` |
| Admin Backend API | `securegpt-admin-backend` | `1.0.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-backend:prod-latest` |
| User Dashboard | `secure-gpt-dashboard` | `1.0.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-dashboard:prod-latest` |
| Admin Frontend | `securegpt-admin-frontend` | `1.0.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-frontend:prod-latest` |
| Chrome Extension | `@securegpt/extension` | `1.2.0` | Chrome Web Store / dist archive |

#### Database Schema Migrations
- Base schema sync (Alembic / SQLAlchemy metadata)
- Columns verified:
  - `users.deactivated_at` (TIMESTAMP WITH TIME ZONE)
  - `users.deactivation_reason` (VARCHAR(50))
  - `users.pre_deletion_email_sent` (BOOLEAN DEFAULT FALSE)

#### Key Endpoints for Live Health & Version
- User API: `GET /api/v1/system/version`
- Admin API: `GET /api/v1/system/version`
- Health check: `GET /health`

---

## Release Checklist (for Deployments)
1. **Bump Version**: Bump target package version in corresponding `package.json` / backend `config.py`.
2. **Build & Push ECR Images**: Build with tag `vX.Y.Z` and `prod-latest`.
3. **Execute Migrations**: Run database migrations before container reload.
4. **Deploy / Update**: Run `scripts/secure-gpt-update.sh` or `scripts/secure-gpt-deploy.sh`.
5. **Verify Version Endpoint**:
   ```bash
   curl -sf http://api.securegpt.rkavach.com/api/v1/system/version
   curl -sf http://admin-api.securegpt.rkavach.com/api/v1/system/version
   ```
6. **Log Entry**: Append new version entry to this file.
