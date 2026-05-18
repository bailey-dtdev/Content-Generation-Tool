# Runbook

Operational guide for the Content Generation Platform — first deploy and
day-to-day operations.

## 1. Accounts and credentials needed

Before deploying, have access to:

- A **GCP project** under the `digitaltreasury.com.au` Workspace.
- An **Anthropic** API key (org account).
- A **Neon** account (Postgres).
- A **Fly.io** account (backend hosting).
- A **Netlify** account (frontend hosting).
- A **Sentry** account (error tracking) — Phase 16.

## 2. First deploy

Do these in order; later steps depend on earlier outputs.

### 2.1 Google OAuth (GCP)

1. Create / select a GCP project in the `digitaltreasury.com.au` Workspace.
2. Enable the **Google Drive API** and **Google Docs API**.
3. Configure the OAuth consent screen: internal user type; scopes
   `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file`.
4. Create an **OAuth 2.0 Client ID** (type: Web application). Add authorized
   redirect URIs:
   - `http://localhost:8000/api/v1/auth/callback` (local dev)
   - `https://<fly-app>.fly.dev/api/v1/auth/callback` (added after 2.4)
5. Keep the **client ID** and **client secret**.

### 2.2 Database (Neon)

1. Create a Neon project; note the **pooled** connection string.
2. Convert it to the async form for the app:
   `postgresql+asyncpg://USER:PASSWORD@HOST/DB`.
   Migrations are applied automatically by the Fly release command.

### 2.3 Backend (Fly.io)

1. `cd backend && flyctl launch --no-deploy` (or `flyctl apps create`).
   If `content-gen-backend` is taken, pick another name and update it in
   `backend/fly.toml` and the `/api` proxy in `frontend/netlify.toml`.
2. Set secrets:
   ```
   flyctl secrets set \
     DATABASE_URL=... ANTHROPIC_API_KEY=... \
     GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
     GOOGLE_REDIRECT_URI=https://<fly-app>.fly.dev/api/v1/auth/callback \
     JWT_SECRET=<32+ random bytes> FERNET_KEY=<Fernet.generate_key()> \
     ALLOWED_EMAIL_DOMAIN=digitaltreasury.com.au \
     FRONTEND_ORIGIN=https://<netlify-site>.netlify.app \
     SENTRY_DSN=<optional>
   ```
3. `flyctl deploy`. The release command runs `alembic upgrade head`.
4. Verify: `curl https://<fly-app>.fly.dev/healthz` returns 200.

### 2.4 Frontend (Netlify)

1. Create a Netlify site from the GitHub repo; set the **base directory**
   to `frontend`.
2. Set env var `VITE_API_BASE_URL` to empty (same-origin; `/api` is proxied
   by `netlify.toml`).
3. Deploy. The `netlify.toml` proxy forwards `/api/*` to the Fly backend.

### 2.5 Wire-up

1. Add the real Fly callback URL to the GCP OAuth client (step 2.1.4).
2. Set the `FRONTEND_ORIGIN` Fly secret to the Netlify URL (CORS).
3. Smoke test: sign in, create a client, run a generation, export a Doc.

### 2.6 CI/CD (GitHub)

- Add repository secrets: `FLY_API_TOKEN`, `NETLIFY_BUILD_HOOK`.
- Enable branch protection on `main`: require the **CI** check to pass
  before merge.

## 3. Verify pricing

`backend/app/config_files/model_rates.yaml` holds **placeholder** rates.
Confirm them against <https://www.anthropic.com/pricing> before relying on
cost figures.

## 4. Observability (Phase 16)

- Create Sentry projects (dev + prod); set `SENTRY_DSN` (backend Fly secret)
  and `VITE_SENTRY_DSN` (Netlify env var).
- Backend logs: `flyctl logs`.

## 5. Common incidents

- **Anthropic rate limit (429):** the SDK retries with backoff; on
  exhaustion the generation surfaces a retryable error. Re-run the section.
- **Competitor fetch failures:** non-fatal — failed URLs are reported and
  generation continues.
- **Google token expired:** access tokens refresh automatically from the
  stored refresh token. If refresh fails, the user must sign in again.
- **Cold start latency:** Fly auto-stops idle machines; the first request
  after idle takes a few seconds.
