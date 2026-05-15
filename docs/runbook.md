# Runbook

Operational notes for the Content Generation Platform. This document grows
as the platform is deployed and operated.

> **Status:** placeholder. Filled in during Phase 15 (production deploy) and
> Phase 16 (observability). See `docs/build-plan.md`.

## Sections to fill in

- **Deploy** — how to deploy backend (Fly) and frontend (Netlify).
- **Secrets** — where each secret lives and how to rotate it.
- **Database** — Neon project, migrations, point-in-time recovery.
- **Monitoring** — Sentry projects, log access (`flyctl logs`).
- **Common incidents** — Anthropic rate limits, fetcher failures, OAuth
  token expiry, and how to respond to each.
