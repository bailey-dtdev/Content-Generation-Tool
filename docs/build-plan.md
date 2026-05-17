# Content Generation Platform — Build Plan (v1)

> **Companion to:** `content-generation-platform-mvp-scope.md` (what) and
> `architecture-design.md` (how).
> **Purpose:** The ordered, phased breakdown of what we build and in what
> order. This is the master tracker. Each phase is one or more PRs.
> **Status of phases:** see the checklist in §3.

---

## 1. How to read this document

The MVP scope locks *functional* scope. The architecture design locks
*technical* decisions. This document sequences the work into **phases** —
each phase is a coherent, shippable slice with explicit dependencies,
deliverables, and acceptance criteria.

Rules of engagement:

- **One phase = one or more focused PRs.** Don't bundle unrelated phases.
- **Don't start a phase until its dependencies are green.** Dependencies
  are listed per phase.
- **Each phase has acceptance criteria.** A phase is "done" only when every
  criterion is met — not when the code merely exists.
- **Follow the rules suite** in `docs/rules/` for every change. Run the
  `/verify-rules` skill before committing and `/cleanup-docs` before any
  PR that touches markdown.
- **Update the §3 checklist** as phases complete. The checklist is the
  single source of truth for project progress.

When a phase references the architecture or scope docs, the section number
(e.g. "arch §6.7") is the authority. If this plan and those docs disagree,
the source doc wins — fix this plan.

---

## 2. Phase map

```
Phase 0  Repo scaffold & governance        ─┐ (this PR)
Phase 1  Backend foundation                 │  no external deps
Phase 2  Database & migrations              │
Phase 3  Auth — Google SSO end-to-end       │  needs GCP project (human task)
Phase 4  Frontend foundation                │
Phase 5  Client registry (CRUD + sitemap)   │
Phase 6  Fetcher service                    │
Phase 7  Prompts directory & loader         │
Phase 8  Outline generation                 │
Phase 9  Content generation (SSE streaming) │
Phase 10 QA pass                            │
Phase 11 Rich text editor                   │
Phase 12 Google Docs export                 │
Phase 13 Cost tracking & dashboards         │
Phase 14 CI/CD                              │
Phase 15 Production deploy                  │
Phase 16 Observability (Sentry)            ─┘
```

Phases 1–13 are roughly sequential but have parallelism: once Phase 1–2 land,
backend feature phases (5–13) and frontend phases can interleave. Phase 14
(CI) can land early — ideally right after Phase 1 — so every later PR is
gated by tests. It is listed at 14 only because the *full* matrix needs all
test suites to exist; a minimal CI can and should land sooner.

---

## 3. Progress checklist

Update this as phases land. `[ ]` not started, `[~]` in progress, `[x]` done.

- [x] **Phase 0** — Repo scaffold & governance
- [x] **Phase 1** — Backend foundation
- [~] **Phase 2** — Database & migrations
- [ ] **Phase 3** — Auth (Google SSO)
- [ ] **Phase 4** — Frontend foundation
- [ ] **Phase 5** — Client registry
- [ ] **Phase 6** — Fetcher service
- [ ] **Phase 7** — Prompts directory & loader
- [ ] **Phase 8** — Outline generation
- [ ] **Phase 9** — Content generation streaming
- [ ] **Phase 10** — QA pass
- [ ] **Phase 11** — Rich text editor
- [ ] **Phase 12** — Google Docs export
- [ ] **Phase 13** — Cost tracking & dashboards
- [ ] **Phase 14** — CI/CD
- [ ] **Phase 15** — Production deploy
- [ ] **Phase 16** — Observability

---

## 4. Phases in detail

Each phase lists: **Goal**, **Depends on**, **Deliverables**, **Acceptance
criteria**, **Governing docs**.

### Phase 0 — Repo scaffold & governance

- **Goal:** Lay down the full directory structure, stub files, and the
  governance suite (CLAUDE.md hierarchy, rules, skills) so every later
  phase has a place to put code and a standard to follow.
- **Depends on:** nothing.
- **Deliverables:**
  - Directory tree per arch §4 with placeholder stub files.
  - `docs/build-plan.md` (this file).
  - `CLAUDE.md` hierarchy: root, `backend/`, `frontend/`.
  - `docs/rules/` suite (documentation, coding standards, git workflow,
    build process).
  - `.claude/skills/` governance skills: `cleanup-docs`, `verify-rules`,
    `build-status`.
  - Root `README.md`, `.gitignore`.
- **Acceptance criteria:**
  - The tree matches arch §4 (modulo Python `__init__.py` files added for
    package correctness).
  - Every stub file names its purpose and target phase.
  - `.DS_Store` is untracked and ignored.
- **Governing docs:** arch §4, §15.

### Phase 1 — Backend foundation

- **Goal:** A backend that boots, serves `/healthz`, and is configured.
- **Depends on:** Phase 0.
- **Deliverables:**
  - `backend/pyproject.toml` with all deps (arch §3) and ruff/mypy config.
  - `backend/Dockerfile` (multi-stage, uv → python:3.12-slim).
  - `app/main.py` — FastAPI app, CORS, router mount, `/healthz` returning
    200 + git SHA, async lifespan.
  - `app/config.py` — `Settings` via pydantic-settings (arch §6.2).
  - `app/logging.py`, `app/sentry.py` — wired but Sentry inert without DSN.
  - Root `docker-compose.yml` and `Makefile`.
- **Acceptance criteria:**
  - `docker compose up` boots a backend; `GET /healthz` returns 200.
  - `make lint` passes (ruff + mypy) on `app/`.
  - `Settings` import fails loudly when required env vars are missing.
- **Governing docs:** arch §3, §5, §6.1, §6.2, §6.13.

### Phase 2 — Database & migrations

- **Goal:** Schema exists; migrations run.
- **Depends on:** Phase 1.
- **Deliverables:**
  - `app/db.py` — async engine, `AsyncSessionLocal`, `get_db()` dependency.
  - `app/models/` — `base.py` + `user`, `client`, `sitemap`, `generation`,
    `usage_records` per arch §8.
  - Alembic initialised; first migration creates all tables, including the
    `one_active_generation_per_user` partial unique index (arch §6.8).
- **Acceptance criteria:**
  - `make migrate` applies cleanly to an empty DB.
  - Partial unique index exists and rejects a second `in_progress` row per
    user.
  - `mypy` clean on models.
- **Governing docs:** arch §6.3, §6.8, §8.

### Phase 3 — Auth (Google SSO end-to-end)

- **Goal:** A `@digitaltreasury.com.au` user can sign in; session works.
- **Depends on:** Phase 2. **Human task:** GCP project + OAuth client
  (arch §15 step 2) must be done first.
- **Deliverables:**
  - `app/security.py` — JWT sign/verify, Fernet encrypt/decrypt.
  - `app/routers/auth.py` — `/auth/login`, `/auth/callback`, `/auth/me`,
    `/auth/logout`.
  - `app/services/auth_service.py` — token exchange, domain check, user
    upsert, Google access-token refresh helper.
  - `app/deps.py` — `get_current_user` dependency.
- **Acceptance criteria:**
  - Sign-in with an in-domain account sets the `dt_session` cookie and
    lands the user back on the frontend.
  - Out-of-domain account gets a 403 and no `users` row is created.
  - Refresh token stored encrypted; never logged.
- **Governing docs:** scope §4, arch §6.4, §14.

### Phase 4 — Frontend foundation

- **Goal:** A frontend that boots, has routing, auth guard, and the
  generated API client.
- **Depends on:** Phase 1 (OpenAPI), Phase 3 (auth to test against).
- **Deliverables:**
  - Vite + React + TS app, Tailwind, React Router (arch §7.1).
  - `src/stores/auth.ts` Zustand store; route guard.
  - Generated API client via `make gen-api` (arch §7.3).
  - `Login` route + app shell.
- **Acceptance criteria:**
  - `pnpm dev` serves the app; sign-in flow works against the local
    backend and lands on `/clients`.
  - `eslint` + `tsc --noEmit` clean.
- **Governing docs:** arch §7.1, §7.2, §7.3.

### Phase 5 — Client registry (CRUD + sitemap)

- **Goal:** Full client CRUD and per-client sitemap upload.
- **Depends on:** Phase 4.
- **Deliverables:**
  - `app/routers/clients.py`, `app/routers/sitemaps.py`, matching schemas.
  - Sitemap XML parser + pasted-URL parser → JSONB (arch §8.3).
  - FE `ClientList`, `ClientEdit`, `ClientForm`, `SitemapUpload`.
- **Acceptance criteria:**
  - Create/read/update/delete a client through the UI.
  - Upload an `.xml` sitemap and a pasted URL list; both parse and persist.
  - All client fields from scope §7 are present.
- **Governing docs:** scope §7, arch §8.2, §8.3, §9 (clients/sitemaps).

### Phase 6 — Fetcher service

- **Goal:** Competitor URL fetching + sitemap relevance filtering.
- **Depends on:** Phase 5 (needs stored sitemaps).
- **Deliverables:**
  - `app/services/fetcher.py` — concurrent competitor fetch with per-URL
    error capture; sitemap keyword-relevance filter (arch §6.9).
  - Unit tests with recorded HTTP fixtures.
- **Acceptance criteria:**
  - A list of URLs yields structured summaries; failures are captured
    individually, not fatal.
  - Sitemap filter returns top-N by keyword match.
- **Governing docs:** scope §9, arch §6.9.

### Phase 7 — Prompts directory & loader

- **Goal:** All prompt templates exist and render.
- **Depends on:** Phase 1.
- **Deliverables:**
  - Eight content prompt files + `qa_review.md` in `app/prompts/` with
    frontmatter (arch §6.6) — placeholder bodies, iterated with the team.
  - `app/services/prompts.py` loader + Jinja2 renderer.
- **Acceptance criteria:**
  - Every prompt loads, frontmatter parses, and renders with sample vars.
  - Prompt *content* is explicitly flagged as collaborative IP — bodies
    start as placeholders (arch §16).
- **Governing docs:** arch §6.6, §8.1 (content types).

### Phase 8 — Outline generation

- **Goal:** Claude produces an editable outline; user gate works.
- **Depends on:** Phases 3, 6, 7.
- **Deliverables:**
  - `app/services/claude_service.py` — `AsyncAnthropic` wrapper,
    non-streaming outline call (arch §6.5.2).
  - `app/routers/generations.py` — `POST /generations`,
    `/outline`, `/outline/regenerate`, `PUT /outline`, `/approve-outline`,
    `/active`, `/abort`; 409 concurrency handling (arch §6.8).
  - FE `GenerationNew`, `GenerationOutline`, `OutlineEditor` (drag-drop).
- **Acceptance criteria:**
  - End-to-end: input → fetch → outline → edit → approve.
  - Second concurrent generation returns 409 with the active id.
- **Governing docs:** scope §10 steps 1–4, arch §6.5.2, §6.8, §9.

### Phase 9 — Content generation streaming

- **Goal:** Content streams to the FE in both modes; cancellation works.
- **Depends on:** Phase 8.
- **Deliverables:**
  - `claude_service.py` streaming (arch §6.5.3); SSE endpoint
    `POST /generations/{id}/content/stream` + `retry-section`.
  - `frontend/src/lib/sse.ts` consumer; `GenerationContent` route.
  - Section retry / skip / abort handling (arch §6.12).
- **Acceptance criteria:**
  - Single-call and sequential modes both stream and complete.
  - Closing the tab cancels the Claude stream (arch §6.5.4).
  - A failed section auto-retries once, then offers retry/skip/abort.
- **Governing docs:** scope §10 step 5, arch §6.5.3, §6.7, §6.12, §7.4.

### Phase 10 — QA pass

- **Goal:** Rule-based + LLM QA notes surfaced to the user.
- **Depends on:** Phase 9.
- **Deliverables:**
  - `app/services/qa_service.py` — rule checks (arch §6.10.1) +
    Haiku LLM pass (arch §6.10.2).
  - `app/config_files/ai_tells.yaml` populated.
  - `POST /generations/{id}/qa`; FE `QAPanel` + inline highlights.
- **Acceptance criteria:**
  - Rule checks produce `QANote`s with severity/category/span.
  - LLM QA failure is non-fatal — rule notes still returned.
- **Governing docs:** scope §10 step 6, arch §6.10.

### Phase 11 — Rich text editor

- **Goal:** TipTap editor with QA decorations.
- **Depends on:** Phase 10.
- **Deliverables:**
  - `frontend/src/components/ContentEditor.tsx` — TipTap, H1–H4, bold,
    italic, lists, links; ProseMirror JSON in the store.
  - QA highlight decorations from `QANote` spans (arch §7.5).
- **Acceptance criteria:**
  - Content editable; QA notes render inline and in the side panel.
  - Only the supported formatting set is available (scope §12).
- **Governing docs:** scope §12, arch §7.5.

### Phase 12 — Google Docs export

- **Goal:** Export a generation to a new Google Doc.
- **Depends on:** Phases 3, 11.
- **Deliverables:**
  - `app/services/export_service.py` — token refresh, Doc creation,
    HTML → `batchUpdate` mapping (arch §10).
  - `POST /generations/{id}/export`; FE export button.
- **Acceptance criteria:**
  - Export creates a Doc named per arch §10 step 4 and returns its URL.
  - Headings, bold, italic, lists, links map correctly.
- **Governing docs:** scope §13, arch §10.

### Phase 13 — Cost tracking & dashboards

- **Goal:** Cost visible per generation, client, user, and org.
- **Depends on:** Phase 9 (usage records start accruing once Claude is
  called; can be built incrementally alongside 8–12).
- **Deliverables:**
  - `app/services/cost_service.py`; `model_rates.yaml` with **verified**
    pricing (arch §6.11 — look up current rates before deploy).
  - `usage_records` written for every Claude call.
  - `app/routers/usage.py`; FE `CostBadge`, client cost, `UsageDashboard`.
- **Acceptance criteria:**
  - Every outline/content/QA call writes a `usage_records` row.
  - Per-generation, per-client, per-user, per-org rollups are correct.
- **Governing docs:** scope §11, arch §6.11, §8.5, §9 (usage).

### Phase 14 — CI/CD

- **Goal:** Tests gate every PR; merges deploy.
- **Depends on:** Phase 1 (minimal CI can land here); full matrix needs
  the test suites from later phases.
- **Deliverables:**
  - `.github/workflows/ci.yml` — backend (ruff, mypy, pytest) +
    frontend (eslint, tsc, vitest, build).
  - `deploy-backend.yml` (Fly), `deploy-frontend.yml` (or Netlify native).
- **Acceptance criteria:**
  - CI runs on every PR and blocks merge on failure.
  - Merge to `main` triggers deploys.
- **Governing docs:** arch §12.

### Phase 15 — Production deploy

- **Goal:** The app runs in production end-to-end.
- **Depends on:** Phases 1–14.
- **Deliverables:**
  - `backend/fly.toml`, Fly app + secrets; `frontend/netlify.toml`,
    Netlify site + env vars; Neon DB; GCP redirect URI updated.
- **Acceptance criteria:**
  - Full flow (sign-in → generate → export) works in production.
- **Governing docs:** arch §11.

### Phase 16 — Observability

- **Goal:** Errors tracked.
- **Depends on:** Phase 15.
- **Deliverables:**
  - Sentry projects (dev/prod), DSNs configured, BE + FE SDKs verified.
- **Acceptance criteria:**
  - A deliberately thrown error appears in Sentry for BE and FE.
- **Governing docs:** arch §13.

---

## 5. Cross-cutting conventions

These apply to **every** phase — see `docs/rules/` for the full text.

- **Branching & PRs:** `docs/rules/git-workflow.md`.
- **Code standards:** `docs/rules/coding-standards.md` — typed, linted,
  no over-engineering, no speculative abstraction.
- **Documentation hygiene:** `docs/rules/documentation.md` — keep docs in
  `docs/`, keep this plan's §3 checklist current, run `/cleanup-docs`
  before merging markdown changes.
- **Build process:** `docs/rules/build-process.md` — how a phase moves
  from start to done.

---

## 6. Open items carried from the source docs

These must be resolved at or before the phase that needs them:

- **Phase 3:** GCP project, OAuth client, consent screen, redirect URIs —
  a human task (arch §15 step 2). Blocks auth.
- **Phase 13:** Anthropic pricing in `model_rates.yaml` is placeholder —
  verify against current pricing before Phase 15 (arch §6.11).
- **Phase 9:** Confirm the Anthropic SDK retry count is 2–3 (arch §6.12).
- **Phase 12:** Doc destination is the user's My Drive root for v1
  (arch §10 step 3); per-client shared folders are post-v1.

---

*End of build plan v1. Update §3 as phases land.*
