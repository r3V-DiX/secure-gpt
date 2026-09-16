# SecureGPT - Production Release Tracker

Single source of truth for deployments, releases, database migrations, and component versions across production environments (`securegpt.rkavach.com`, `admin.securegpt.rkavach.com`, `api.securegpt.rkavach.com`).

---

## Release History

### [v1.2.2-ext] - Extension Maintenance & Domain Gating Enforcement
- **Date**: 2026-09-16
- **Commit**: `ext-v1.2.2`
- **Environment**: Production (`ap-south-1` / Chrome Web Store)
- **Status**: Production Stable
- **Component**: `@securegpt/extension` `1.2.2`

#### What Was Added & Improved
- **Extension Version Bump**: Upgraded Chrome Extension version to `1.2.2` across `manifest.json` and `package.json`.
- **Domain Verification & Onboarding Gating Alignment**: Unified extension telemetry and authentication with strict corporate domain verification gates.
- **Radial Risk Gauge & Interceptor Reliability**: Refined client-side DOM risk gauge positioning and input event decoupling on supported LLM sites.

#### Component Matrix
| Component | Service Name | Version | Image / Artifact |
|---|---|---|---|
| User Backend API | `secure-gpt-backend` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-backend:prod-latest` |
| Admin Backend API | `securegpt-admin-backend` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-backend:prod-latest` |
| User Dashboard | `secure-gpt-dashboard` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-dashboard:prod-latest` |
| Admin Frontend | `securegpt-admin-frontend` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-frontend:prod-latest` |
| Chrome Extension | `@securegpt/extension` | `1.2.2` | Chrome Web Store / dist archive |

---

### [v1.1.2] - Radial UX Polish & Version Synchronization
- **Date**: 2026-09-11
- **Commit**: `prod-v1.1.2`
- **Environment**: Production (`ap-south-1`)
- **Status**: Ready for Deployment

#### What Was Added & Improved
- **Radial Risk Gauge UX**: Permanently removed floating live warning tooltip modals in favor of a sleek, unobtrusive circular percentage gauge anchored to prompt fields.
- **Synchronous DLP Blocking**: Preserved synchronous blocking enforcement strictly on Enter key and Send button clicks.
- **Component Parity**: Bumped extension to `1.2.1` and application suite to `1.1.2`.

#### Component Matrix
| Component | Service Name | Version | Image / Artifact |
|---|---|---|---|
| User Backend API | `secure-gpt-backend` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-backend:prod-latest` |
| Admin Backend API | `securegpt-admin-backend` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-backend:prod-latest` |
| User Dashboard | `secure-gpt-dashboard` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-dashboard:prod-latest` |
| Admin Frontend | `securegpt-admin-frontend` | `1.1.2` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-frontend:prod-latest` |
| Chrome Extension | `@securegpt/extension` | `1.2.1` | Chrome Web Store / dist archive |

---

### [v1.1.0] - Phase 1 Complete (Interception & Policy Controls, TPRM Org Onboarding & Stability)
- **Date**: 2026-09-11
- **Commit**: `prod-v1.1.0`
- **Environment**: Production (`ap-south-1`)
- **Status**: Released

#### What Was Added & Improved
- **Prompt Evaluation UX**: Non-blocking asynchronous live debouncing with dynamic radial percentage risk gauge anchored to LLM prompt areas.
- **Document & File Scanning Policy**: Admin policy toggle to enable/disable file inspection for PDF, Office documents, and images.
- **15+ LLM Platform Coverage**: Added domain mappings and DOM selectors for ChatGPT, Claude, Gemini, Copilot, Perplexity, Meta AI, Poe, Mistral, Cursor Web, v0, Replit, HuggingChat, DeepSeek, Phind, Notion AI, Jasper, Copy.ai.
- **Identity & Microsoft OAuth**: Microsoft Entra ID (Azure AD) OAuth integration alongside Google Workspace.
- **Role Management & TPRM Onboarding**:
  - Live role changing (EMPLOYEE / ORG_ADMIN / USER) directly in team table.
  - Domain verification gating preventing invitations before DNS TXT challenge completion.
  - Sticky department back-navigation on policy page.
  - Account Type & Role Badges throughout dashboards.
  - Policy trigger leaderboards on Admin Dashboard.

#### Component Matrix
| Component | Service Name | Version | Image / Artifact |
|---|---|---|---|
| User Backend API | `secure-gpt-backend` | `1.1.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-backend:prod-latest` |
| Admin Backend API | `securegpt-admin-backend` | `1.1.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-backend:prod-latest` |
| User Dashboard | `secure-gpt-dashboard` | `1.1.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/secure-gpt-dashboard:prod-latest` |
| Admin Frontend | `securegpt-admin-frontend` | `1.1.0` | `443370715886.dkr.ecr.ap-south-1.amazonaws.com/securegpt-admin-frontend:prod-latest` |
| Chrome Extension | `@securegpt/extension` | `1.2.0` | Chrome Web Store / dist archive |

---

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
