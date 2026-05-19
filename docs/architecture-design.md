# Content Generation Platform — Architecture Design (v1)

> **Companion to:** `content-generation-platform-mvp-scope.md`
> **Audience:** Claude IDE agent (Claude Code) doing the majority of the build, plus the human engineers reviewing PRs.
> **Status:** Locked. Open questions explicitly called out per section.

---

## 1. Purpose

This doc translates the MVP scope into concrete technical decisions: stack, structure, data model, deployment, conventions, and the patterns to apply for the tricky bits (streaming, OAuth, cost tracking, concurrency). It is intentionally prescriptive — the goal is to remove ambiguity so the agent can build without having to make architectural judgement calls mid-flow.

If a decision was deliberately left open in the MVP scope and isn't covered here, it's still open and should be raised before implementation.

---

## 2. Architecture at a glance

Two-tier split:

```
┌──────────────────────┐       HTTPS         ┌──────────────────────┐
│                      │  ────────────────►  │                      │
│  Frontend (Netlify)  │   JSON + SSE        │  Backend (Fly.io)    │
│  Vite + React + TS   │  ◄────────────────  │  FastAPI (Python)    │
│  Static bundle       │                     │  Single container    │
│                      │                     │                      │
└──────────────────────┘                     └──────────┬───────────┘
                                                        │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                              ▼                         ▼                         ▼
                   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
                   │  Postgres (Neon) │      │  Anthropic API   │      │  Google APIs     │
                   │  Managed,        │      │  Claude Sonnet   │      │  OAuth, Drive,   │
                   │  scales to zero  │      │  Claude Haiku    │      │  Docs            │
                   └──────────────────┘      └──────────────────┘      └──────────────────┘
```

No queue, no Redis, no background workers. Streaming is server-sent events directly from the FastAPI request handler. Concurrency is enforced via a Postgres partial unique index. Sequential-mode generation runs in the request handler with async I/O.

---

## 3. Tech stack — definitive list

### Backend

| Concern | Choice | Version | Rationale |
|---|---|---|---|
| Language | Python | 3.12 | Stable, modern typing |
| Web framework | FastAPI | latest | Async, auto OpenAPI, Pydantic |
| ASGI server | Uvicorn | latest | Standard FastAPI pairing |
| ORM | SQLAlchemy | 2.0 (async) | Mature, async support |
| DB driver | asyncpg | latest | Fast async Postgres |
| Migrations | Alembic | latest | SQLAlchemy's canonical migration tool |
| Validation | Pydantic | v2 | Bundled with FastAPI |
| Auth (Google) | Authlib | latest | Handles OAuth + ID token verification |
| JWT | PyJWT | latest | Session token signing |
| Encryption (refresh tokens) | cryptography (Fernet) | latest | Symmetric encryption for tokens at rest |
| HTTP client | httpx | latest | Async, used for competitor fetching |
| HTML parsing | BeautifulSoup4 + lxml | latest | Fetcher parsing |
| Anthropic SDK | anthropic | latest (async client) | Official SDK, supports streaming + usage metadata |
| Google SDK | google-api-python-client + google-auth | latest | For Drive/Docs export |
| Markdown | mistune | latest | Parsing prompt frontmatter + rendering content for export |
| Frontmatter | python-frontmatter | latest | Prompt template metadata |
| YAML | PyYAML | latest | Rates and AI-tells config |
| Logging | structlog | latest | Structured JSON logs |
| Error tracking | sentry-sdk[fastapi] | latest | Auto-captures unhandled exceptions |
| Testing | pytest + pytest-asyncio + httpx | latest | Standard async test stack |
| Linting/format | ruff | latest | Single tool for lint + format |
| Type checking | mypy | latest | Strict mode on `app/` |
| Package manager | uv | latest | Fast, lockfile-based |

### Frontend

| Concern | Choice | Version | Rationale |
|---|---|---|---|
| Build tool | Vite | latest | Fast dev server, static output |
| Framework | React | 18 | Standard |
| Language | TypeScript | 5.x | Strict mode |
| Routing | React Router | v6 | Standard |
| State | Zustand | latest | Minimal boilerplate, persists to sessionStorage |
| Forms | React Hook Form | latest | Good DX for the multi-field input step |
| Rich text | TipTap | v2 | Extensible, ProseMirror under the hood |
| Drag-and-drop (outline) | @dnd-kit/sortable | latest | Modern, accessible |
| API client | Generated via openapi-typescript-codegen | latest | Types generated from FastAPI OpenAPI |
| HTTP client | Native fetch + a small wrapper | — | No axios needed |
| SSE client | Native EventSource (or custom fetch+ReadableStream for POST-with-body) | — | See §6.7 |
| Styling | Tailwind CSS | latest | Internal tool, speed of iteration |
| UI primitives | shadcn/ui (selectively) | — | Drop-in components, no runtime |
| Icons | lucide-react | latest | — |
| Testing | Vitest + React Testing Library | latest | Native Vite integration |
| Linting/format | ESLint + Prettier | latest | Standard |
| Package manager | pnpm | latest | Fast, disk-efficient |

### Infrastructure

| Concern | Choice | Notes |
|---|---|---|
| Frontend hosting | Netlify | Static deploy from GitHub on merge to `main` |
| Backend hosting | Fly.io | Single small VM, auto-stop when idle |
| Database | Neon (Postgres) | Free tier, serverless, scales to zero |
| Secrets | Fly secrets (BE) + Netlify env vars (FE) | No separate secret manager needed |
| CI/CD | GitHub Actions | Test on PR, deploy on merge |
| Error tracking | Sentry | Free tier |
| Logs | Fly built-in log stream | structlog → stdout → Fly captures |

---

## 4. Repository layout

Single monorepo. Plain folders — no pnpm workspaces or Turborepo (FE and BE share no code, type sharing is via generated OpenAPI client).

```
content-gen/
├── README.md
├── docker-compose.yml                # Local dev: postgres + backend + frontend
├── netlify.toml                      # Netlify build config + /api proxy
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + test on PR
│       ├── deploy-backend.yml        # Deploy to Fly on main merge
│       └── deploy-frontend.yml       # Deploy to Netlify on main merge
├── docs/
│   ├── content-generation-platform-mvp-scope.md
│   ├── architecture-design.md        # This doc
│   └── runbook.md                    # Operational notes (to be written)
│
├── backend/
│   ├── pyproject.toml                # uv + ruff + mypy config
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── fly.toml
│   ├── .env.example
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app + middleware + router mount
│   │   ├── config.py                 # Settings (pydantic-settings, env-driven)
│   │   ├── db.py                     # Engine, session factory
│   │   ├── deps.py                   # FastAPI dependencies (auth, db)
│   │   ├── logging.py                # structlog setup
│   │   ├── sentry.py                 # Sentry init
│   │   ├── security.py               # JWT, Fernet encryption helpers
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── user.py
│   │   │   ├── client.py
│   │   │   ├── sitemap.py
│   │   │   └── generation.py
│   │   ├── schemas/                  # Pydantic request/response models
│   │   │   ├── auth.py
│   │   │   ├── client.py
│   │   │   ├── generation.py
│   │   │   └── usage.py
│   │   ├── routers/                  # FastAPI routers, one per resource
│   │   │   ├── auth.py
│   │   │   ├── clients.py
│   │   │   ├── sitemaps.py
│   │   │   ├── generations.py
│   │   │   ├── usage.py
│   │   │   └── export.py
│   │   ├── services/                 # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── fetcher.py            # Competitor + sitemap fetching
│   │   │   ├── claude_service.py     # Anthropic SDK wrapper
│   │   │   ├── qa_service.py         # Rule-based + LLM QA
│   │   │   ├── cost_service.py       # Token → cost calculation
│   │   │   ├── export_service.py     # Google Docs export
│   │   │   └── prompts.py            # Prompt template loader
│   │   ├── prompts/                  # Markdown prompt templates
│   │   │   ├── outline_service_page.md
│   │   │   ├── outline_plp.md
│   │   │   ├── outline_pdp.md
│   │   │   ├── outline_blog.md
│   │   │   ├── content_service_page.md
│   │   │   ├── content_plp.md
│   │   │   ├── content_pdp.md
│   │   │   ├── content_blog.md
│   │   │   └── qa_review.md
│   │   └── config_files/
│   │       ├── model_rates.yaml      # Anthropic pricing
│   │       └── ai_tells.yaml         # Banned phrases / common AI tells
│   └── tests/
│       ├── conftest.py
│       ├── unit/
│       └── integration/
│
└── frontend/
    ├── package.json
    ├── pnpm-lock.yaml
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── .env.example
    ├── index.html
    ├── public/
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/                      # Generated OpenAPI client
        │   └── generated/            # `pnpm run gen:api` regenerates
        ├── lib/
        │   ├── http.ts               # Fetch wrapper, auth
        │   ├── sse.ts                # SSE client for POST-with-body
        │   └── utils.ts
        ├── stores/                   # Zustand stores
        │   ├── auth.ts
        │   └── generation.ts         # Persists to sessionStorage
        ├── routes/                   # Page-level components
        │   ├── Login.tsx
        │   ├── ClientList.tsx
        │   ├── ClientEdit.tsx
        │   ├── GenerationNew.tsx     # Step 1: input
        │   ├── GenerationOutline.tsx # Steps 2-4: fetch + outline + edit
        │   ├── GenerationContent.tsx # Steps 5-7: generate + QA + edit
        │   └── UsageDashboard.tsx
        ├── components/
        │   ├── ui/                   # shadcn primitives
        │   ├── ClientForm.tsx
        │   ├── SitemapUpload.tsx
        │   ├── OutlineEditor.tsx
        │   ├── ContentEditor.tsx     # TipTap wrapper
        │   ├── QAPanel.tsx
        │   └── CostBadge.tsx
        └── tests/
```

---

## 5. Local development

### 5.1 Prerequisites

- Docker + Docker Compose
- Node 20+ and pnpm
- Python 3.12 and uv (for native backend dev outside Docker, optional)
- A `.env` file in `backend/` (copy from `.env.example`) with:
  - `ANTHROPIC_API_KEY` (org's Anthropic key, dev tier is fine)
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (from the GCP project)
  - `JWT_SECRET` (any 32+ random bytes)
  - `FERNET_KEY` (generate with `Fernet.generate_key()`)
  - `SENTRY_DSN` (optional in dev)
  - `DATABASE_URL` is set automatically by compose

### 5.2 The compose file

`docker-compose.yml` at repo root:

- `postgres`: official postgres:16 image, named volume, port 5432 exposed locally
- `backend`: built from `backend/Dockerfile`, mounts `backend/app` as a volume for hot reload, runs `uvicorn app.main:app --reload --host 0.0.0.0`, depends on `postgres`, port 8000
- `frontend`: node:20 image, mounts `frontend/`, runs `pnpm dev`, port 5173

One-liner to start: `docker compose up`. Claude IDE agent should be able to `docker compose up -d`, run migrations, run tests, and hit the API directly.

### 5.3 Common dev commands

Make targets at repo root (`Makefile`):

- `make up` — `docker compose up -d`
- `make down` — `docker compose down`
- `make logs` — tail backend logs
- `make migrate` — `docker compose exec backend alembic upgrade head`
- `make migration name=foo` — `docker compose exec backend alembic revision --autogenerate -m foo`
- `make test` — `docker compose exec backend pytest && docker compose exec frontend pnpm test`
- `make lint` — ruff + mypy on backend, eslint + tsc on frontend
- `make gen-api` — regenerate FE OpenAPI client from BE

---

## 6. Backend architecture

### 6.1 Application bootstrap

`app/main.py` does the standard FastAPI app construction:

1. Initialise Sentry (`app.sentry.init()`) before anything else.
2. Configure structlog (`app.logging.configure()`).
3. Construct the `FastAPI` app with CORS middleware allowing the frontend origin.
4. Mount routers under `/api/v1/...`.
5. Add a `/healthz` endpoint that returns 200 + the current git SHA.

Async lifespan handler creates the SQLAlchemy engine on startup and disposes on shutdown.

### 6.2 Configuration

`app/config.py` uses `pydantic-settings` to read env vars into a `Settings` class. Single source of truth. Tested by importing and asserting required fields.

```python
class Settings(BaseSettings):
    database_url: str
    anthropic_api_key: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    jwt_secret: str
    jwt_expiry_days: int = 7
    fernet_key: str
    sentry_dsn: str | None = None
    allowed_email_domain: str = "digitaltreasury.com.au"
    frontend_origin: str
    model_generation: str = "claude-sonnet-4-6"
    model_qa: str = "claude-haiku-4-5-20251001"
```

### 6.3 Database layer

- SQLAlchemy 2.0 async engine.
- Single `AsyncSessionLocal` factory in `app/db.py`.
- FastAPI dependency `get_db()` yields a session per request, wraps in transaction, commits on success / rolls back on exception.
- Models in `app/models/`, one file per aggregate root.
- A `Base` class in `app/models/base.py` with common columns (`id` UUID, `created_at`, `updated_at`).

### 6.4 Authentication & sessions

#### 6.4.1 Sign-in flow

1. Frontend redirects user to `GET /api/v1/auth/login` — backend constructs the Google OAuth URL with scopes `openid email profile https://www.googleapis.com/auth/drive.file` and `access_type=offline` + `prompt=consent` (forces refresh token issuance) and redirects.
2. Google redirects back to `GET /api/v1/auth/callback?code=...`.
3. Backend exchanges code for tokens via Authlib, verifies the ID token, extracts email.
4. If email's domain ≠ `allowed_email_domain`, return 403.
5. Upsert the `User` row by email. Encrypt the Google **refresh token** with Fernet, store it (along with current access token and its expiry) on the user record. Refresh tokens are long-lived; access tokens we'll refresh on demand.
6. Issue a signed JWT (HS256, 7-day expiry, `sub = user.id`).
7. Set JWT as an httpOnly, secure, SameSite=Lax cookie named `dt_session`.
8. Redirect to frontend `/`.

#### 6.4.2 Request authentication

A FastAPI dependency `get_current_user(db, request)`:

1. Reads `dt_session` cookie.
2. Verifies JWT signature and expiry.
3. Loads `User` from DB.
4. Returns user or raises 401.

All authenticated routes use `Depends(get_current_user)`.

#### 6.4.3 Google access token refresh

A helper `services/auth_service.get_google_access_token(user, db)` returns a valid access token, refreshing via Google's token endpoint if expired (with the stored refresh token). Used by the export service.

### 6.5 The Claude integration

#### 6.5.1 SDK setup

Single `AsyncAnthropic` client instance per backend process, constructed at app startup, injected via FastAPI dependency.

```python
from anthropic import AsyncAnthropic
client = AsyncAnthropic(api_key=settings.anthropic_api_key)
```

#### 6.5.2 Calling Claude (non-streaming, e.g. outline)

The outline is short enough to return as one response:

```python
async def generate_outline(prompt: str, model: str) -> tuple[str, Usage]:
    message = await client.messages.create(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    text = message.content[0].text
    return text, message.usage  # usage has input_tokens, output_tokens
```

#### 6.5.3 Streaming (content generation, both modes)

Use the async context manager pattern:

```python
async def stream_content(prompt: str, model: str) -> AsyncIterator[StreamEvent]:
    async with client.messages.stream(
        model=model,
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text_delta in stream.text_stream:
            yield StreamEvent(type="delta", text=text_delta)
        final = await stream.get_final_message()
        yield StreamEvent(type="done", usage=final.usage)
```

The router converts this into SSE — see §6.7.

#### 6.5.4 Cancellation

When the SSE client disconnects, FastAPI raises a `ClientDisconnect` exception inside the async generator. The `async with` context manager exits, which closes the underlying HTTP connection to Anthropic, halting token consumption. **No additional cancellation logic needed** — this is built into the async iterator pattern.

### 6.6 Prompts

Prompts live as markdown files in `app/prompts/` with frontmatter:

```markdown
---
id: outline_service_page
version: 1
description: Generates a section outline for a service page.
variables:
  - client
  - primary_keyword
  - secondary_keywords
  - search_intent
  - target_word_count
  - additional_context
  - competitor_summary
  - relevant_sitemap_urls
---

You are an expert SEO content strategist writing for {{ client.name }}, a {{ client.industry }} business...

[full prompt body with {{ variable }} substitutions]
```

Loader in `app/services/prompts.py`:

```python
def load_prompt(prompt_id: str) -> PromptTemplate:
    path = PROMPTS_DIR / f"{prompt_id}.md"
    post = frontmatter.load(path)
    return PromptTemplate(meta=post.metadata, body=post.content)

def render_prompt(prompt_id: str, **vars) -> str:
    template = load_prompt(prompt_id)
    return jinja2.Template(template.body).render(**vars)
```

Each content type has two prompt files (outline + content). The QA prompt is shared across types.

### 6.7 SSE streaming pattern

FastAPI returns an `EventSourceResponse` (or just a `StreamingResponse` with `text/event-stream`) that wraps the async generator from §6.5.3.

The generation streaming endpoint is `POST /api/v1/generations/{id}/content/stream`. Note: because SSE traditionally uses GET, and we need to POST a body, the frontend uses `fetch` with a `ReadableStream` reader instead of native `EventSource`. The helper `frontend/src/lib/sse.ts` wraps this.

Event format (one event per line, newline-delimited JSON inside `data:`):

```
event: section_start
data: {"section_id": "uuid", "heading": "What is..."}

event: delta
data: {"section_id": "uuid", "text": "Service pages..."}

event: section_complete
data: {"section_id": "uuid", "usage": {"input_tokens": 1234, "output_tokens": 567}}

event: generation_complete
data: {"total_usage": {...}, "total_cost_usd": 0.12}

event: error
data: {"section_id": "uuid", "message": "...", "retryable": true}
```

In sequential mode, each section runs as its own Claude call within the same SSE response. In single-call mode, the whole response is one Claude call but the same event types are emitted (with section boundaries detected from the prompt structure or post-parsed).

### 6.8 Concurrency lock

Enforced at the DB level. The `generations` table has a partial unique index:

```sql
CREATE UNIQUE INDEX one_active_generation_per_user
ON generations (user_id)
WHERE status = 'in_progress';
```

When a user POSTs to start a generation, the INSERT either succeeds or fails with a unique violation. The router catches this and returns a 409 with the existing in-progress generation ID so the FE can show the "resume or abort" banner.

States: `draft` (input collected, not yet started) → `in_progress` (outline or content being generated) → `awaiting_review` (content generated, QA done) → `exported` (final) | `aborted` (user-discarded) | `failed` (terminal error).

Note: `draft` rows don't conflict with the partial index since the index is filtered to `in_progress`.

### 6.9 The fetcher

`app/services/fetcher.py`. Two responsibilities:

1. **Competitor URL fetching.** Async function takes a list of URLs, runs `httpx.AsyncClient.get` with a 10s timeout and a realistic User-Agent header, parses with BeautifulSoup, extracts:
   - Page title (`<title>` and `<h1>`)
   - Headings outline (h2/h3 with text)
   - Approximate word count (visible text only, no script/style)
   - Meta description if present
   
   Returns a structured `CompetitorSummary`. Failures (timeout, 4xx, 5xx, no parseable body) are caught individually and returned as `CompetitorFetchError(url, reason)`. The router surfaces these to the FE so the user sees which URLs failed and the generation proceeds with the rest.
   
   Fetches run concurrently via `asyncio.gather(*, return_exceptions=True)`.

2. **Sitemap filtering.** Given a client's stored sitemap (XML or URL list) and the primary/secondary keywords, return top-N (default 8) URLs by relevance. Relevance scoring for v1 is simple: tokenize URL slug and any stored title; score = count of keyword matches; tiebreak by URL length (shorter first). No semantic similarity / embedding — keep it cheap.

**Note on JS-rendered sites:** v1 uses httpx only. Some modern SPAs will fail to fetch usefully. This is an explicit, accepted limitation — adding Playwright would 5x the container size and slow fetches. If failure rates are high in production, revisit by adding a Playwright fallback service.

### 6.10 The QA pass

`app/services/qa_service.py`. Runs two checks in sequence after content generation completes.

#### 6.10.1 Rule-based checks

Returns a list of `QANote` objects, each with `severity` (`info` | `warning` | `error`), `category`, `message`, `section_id`, `span` (character offsets within the section).

Checks:

- **Banned words/phrases** from client's `banned_words` list (case-insensitive substring match).
- **Common AI tells** from `config_files/ai_tells.yaml` (e.g. "delve", "tapestry", "navigate the landscape of", "in today's fast-paced world").
- **Language variant violations.** Maintain a small dictionary mapping US ↔ AU/UK spellings (organize/organise, color/colour, etc.). For each client language variant setting, flag the foreign forms.
- **Sentence length distribution.** Flag if mean sentence length exceeds a threshold tied to the client's `sentence_length_preference`.
- **Keyword density.** Flag if primary keyword density > 3% or < 0.3%.
- **Reading level.** Compute Flesch-Kincaid Grade Level on visible prose; flag if it doesn't match client target ± 2.

#### 6.10.2 LLM QA pass

Single Haiku call. The prompt (`prompts/qa_review.md`) takes the generated content + client brand/style settings + the rule-based findings and returns a JSON array of additional `QANote`s focused on:

- Brand voice fit
- Google helpful-content alignment (E-E-A-T signals, originality, depth)
- Humanisation pattern adherence
- Suggested improvements

The QA call uses JSON mode (forced via `messages.create` with a system prompt that demands JSON output, then validated against a Pydantic schema). On parse failure, log and proceed with only rule-based notes.

### 6.11 Cost tracking

`config_files/model_rates.yaml`:

```yaml
# Rates per million tokens, USD. Update when Anthropic changes pricing.
# Verify against https://www.anthropic.com/pricing before relying on these.
models:
  claude-sonnet-4-6:
    input_per_mtok: 3.00
    output_per_mtok: 15.00
  claude-haiku-4-5-20251001:
    input_per_mtok: 1.00
    output_per_mtok: 5.00
  claude-opus-4-7:
    input_per_mtok: 15.00
    output_per_mtok: 75.00
```

> **Note for the agent building this:** the values above are placeholders. Look up the current pricing at https://www.anthropic.com/pricing and update before first deploy.

`app/services/cost_service.py`:

```python
def cost_for(model: str, input_tokens: int, output_tokens: int) -> Decimal:
    rates = MODEL_RATES[model]
    return (
        Decimal(input_tokens) / 1_000_000 * Decimal(str(rates["input_per_mtok"]))
        + Decimal(output_tokens) / 1_000_000 * Decimal(str(rates["output_per_mtok"]))
    )
```

Every Claude call's usage + model is appended to a `usage_records` row tied to the `generation_id` and `user_id`, with a `stage` field (`outline` | `content` | `qa`). Aggregation queries roll up to per-generation / per-client / per-user / per-org. Cost stored as `NUMERIC(10, 6)` USD.

### 6.12 Retry & failure handling

- **Outline generation failure.** Whole-flow error. Surface to user with retry button.
- **Content generation (sequential, single section failure).** Auto-retry that section once with the same prompt. On second failure, emit an SSE `error` event with `retryable: true`. The FE shows a "retry / skip / abort" choice. "Skip" marks the section as failed and continues; "retry" calls a new endpoint to re-run just that section; "abort" marks the generation as aborted.
- **Content generation (single-call) failure.** Auto-retry once, then surface to user with retry button.
- **QA failure.** Non-fatal. Log, proceed without LLM QA notes (rule-based still present).
- **Anthropic 429 (rate limit).** Caught at the SDK layer; SDK has built-in retry with exponential backoff (verify configured to 2-3 retries). On exhaustion, propagate as the section/whole-flow failure above.

### 6.13 Logging

`structlog` configured to emit JSON. Every log line includes: `timestamp`, `level`, `request_id` (from middleware), `user_id` (if authenticated), and any contextual fields bound via `log.bind(...)`.

Sentry captures unhandled exceptions (FastAPI integration auto-installs middleware) plus any `log.error(...)` calls (configured via the structlog → Sentry handler).

---

## 7. Frontend architecture

### 7.1 Application shell

`App.tsx` sets up React Router with these routes:

- `/login` — public
- `/` — authenticated, redirects to `/clients` or `/generations/new`
- `/clients` — list
- `/clients/new`, `/clients/:id` — CRUD
- `/generations/new` — step 1 (input)
- `/generations/:id/outline` — steps 2-4 (fetch + outline edit)
- `/generations/:id/content` — steps 5-7 (generate + QA + edit)
- `/usage` — dashboard

A route guard component checks the auth store; on miss, calls `GET /api/v1/auth/me` to validate the cookie session, redirects to `/login` if 401.

### 7.2 State management

Two Zustand stores:

- `auth.ts` — current user, login state. In-memory only.
- `generation.ts` — the in-progress generation (input, outline, sections, QA notes, edits). Persisted to `sessionStorage` via Zustand's `persist` middleware. Survives page refresh; lost on browser close. **This is critical because the backend doesn't persist generation content.**

```typescript
export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      generationId: null,
      input: null,
      outline: null,
      sections: {},
      qaNotes: [],
      // ... actions
    }),
    { name: "active-generation", storage: createJSONStorage(() => sessionStorage) }
  )
);
```

### 7.3 Type-safe API client

After backend changes, run `make gen-api` which:

1. Curls `http://localhost:8000/openapi.json`.
2. Runs `openapi-typescript-codegen` to generate `frontend/src/api/generated/`.
3. Commits the output.

All FE API calls go through the generated client. No hand-written API code.

### 7.4 SSE consumption

`frontend/src/lib/sse.ts` provides `streamPost(url, body, handlers)`:

```typescript
export async function streamPost<TEvent>(
  url: string,
  body: unknown,
  handlers: {
    onEvent: (event: TEvent) => void;
    onError: (err: Error) => void;
    onDone: () => void;
  },
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`SSE failed: ${res.status}`);

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      // Parse `event: foo\ndata: {...}` blocks
      // Dispatch to handlers.onEvent
    }
  }
  handlers.onDone();
}
```

The component owns an `AbortController` and calls `abort()` on unmount → backend sees the disconnect → Claude stream gets cancelled.

### 7.5 Rich text editor

`components/ContentEditor.tsx` wraps TipTap:

- Extensions: StarterKit, Link, Underline.
- No table, no image, no code-block-fancy extensions.
- Heading levels restricted to H1–H4.
- Content stored as ProseMirror JSON in the Zustand store.
- Inline QA highlight rendering uses a custom TipTap mark or decoration: each `QANote` with `span` offsets becomes a decoration showing a coloured underline; hover/click reveals the note in a popover, also reflected in the side panel.

For Google Docs export, the FE converts ProseMirror JSON → a normalized HTML representation and sends it to the BE; the BE maps HTML to the Google Docs API's `batchUpdate` requests. See §10.

### 7.6 Outline editor

`components/OutlineEditor.tsx`:

- Sections rendered as drag-handle cards via `@dnd-kit/sortable`.
- Inline editing of heading and blurb.
- Add/delete buttons per section.
- "Regenerate full outline" button at the top.
- "Approve & continue" button moves the generation forward.

### 7.7 Forms

`react-hook-form` + Zod for input-step validation. Schemas should ideally be shared with the BE's Pydantic schemas — for v1 we just maintain parallel definitions, since they're small. If they drift, add a codegen step later.

---

## 8. Data model

UUIDs everywhere (`gen_random_uuid()`). All timestamps `TIMESTAMPTZ`. All foreign keys `ON DELETE` is restrictive by default — see notes per table.

### 8.1 `users`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| email | TEXT NOT NULL UNIQUE | |
| name | TEXT | From Google profile |
| picture_url | TEXT | From Google profile, optional |
| role | TEXT NOT NULL DEFAULT 'user' | Enum: `user`, `admin`. No enforcement in v1. |
| google_access_token | TEXT | Encrypted with Fernet |
| google_access_token_expires_at | TIMESTAMPTZ | |
| google_refresh_token | TEXT | Encrypted with Fernet |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ NOT NULL DEFAULT now() | |
| last_login_at | TIMESTAMPTZ | |

### 8.2 `clients`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | TEXT NOT NULL | |
| industry | TEXT | |
| website_url | TEXT | |
| brand_voice | TEXT | Free text, tone descriptors |
| audience | TEXT | Free text, multi-persona by paragraph |
| eeat_signals | TEXT | Author bios, citations to prefer |
| language_variant | TEXT NOT NULL DEFAULT 'en-AU' | `en-AU` / `en-US` / `en-GB` |
| reading_level_target | TEXT | e.g. "Grade 8-10" |
| sentence_length_preference | TEXT | `short` / `mixed` / `longer` |
| banned_words | TEXT[] | |
| approved_phrases | TEXT[] | |
| oxford_comma | BOOLEAN NOT NULL DEFAULT true | |
| created_by | UUID FK → users.id | RESTRICT |
| created_at, updated_at | TIMESTAMPTZ | |

### 8.3 `sitemaps`

One per client (1:1).

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| client_id | UUID FK → clients.id UNIQUE | CASCADE |
| source_type | TEXT NOT NULL | `xml` / `pasted` |
| raw_content | TEXT NOT NULL | Original XML or pasted URLs |
| urls | JSONB NOT NULL | Parsed: `[{url, title?}, ...]` |
| uploaded_at | TIMESTAMPTZ NOT NULL DEFAULT now() | |
| uploaded_by | UUID FK → users.id | |

### 8.4 `generations`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → users.id NOT NULL | RESTRICT |
| client_id | UUID FK → clients.id NOT NULL | RESTRICT |
| content_type | TEXT NOT NULL | `service_page` / `plp` / `pdp` / `blog` |
| status | TEXT NOT NULL | `draft` / `in_progress` / `awaiting_review` / `exported` / `aborted` / `failed` |
| mode | TEXT | `single_call` / `sequential`, set when content gen starts |
| input | JSONB NOT NULL | The user's step-1 input fields |
| competitor_summaries | JSONB | Output of fetcher (per-URL summary or error) |
| relevant_sitemap_urls | JSONB | URLs selected by relevance filter |
| outline | JSONB | `[{section_id, heading, blurb}, ...]` |
| exported_doc_url | TEXT | Set when exported |
| created_at, updated_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |

> **Note:** Generated content body is **not** stored. Only metadata above persists.

Partial unique index for concurrency lock (see §6.8):

```sql
CREATE UNIQUE INDEX one_active_generation_per_user
ON generations (user_id) WHERE status = 'in_progress';
```

### 8.5 `usage_records`

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| generation_id | UUID FK → generations.id NOT NULL | CASCADE |
| user_id | UUID FK → users.id NOT NULL | RESTRICT |
| client_id | UUID FK → clients.id NOT NULL | RESTRICT |
| stage | TEXT NOT NULL | `outline` / `content` / `qa` |
| model | TEXT NOT NULL | |
| input_tokens | INTEGER NOT NULL | |
| output_tokens | INTEGER NOT NULL | |
| cost_usd | NUMERIC(10, 6) NOT NULL | |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT now() | |

Indexes on `user_id`, `client_id`, `generation_id`, `created_at` for dashboard queries.

---

## 9. API surface

All routes under `/api/v1`. JSON request/response unless noted.

### Auth

- `GET /auth/login` — redirects to Google
- `GET /auth/callback` — handles Google redirect, sets session cookie
- `POST /auth/logout` — clears cookie
- `GET /auth/me` — returns current user

### Clients

- `GET /clients` — list
- `POST /clients` — create
- `GET /clients/{id}` — read
- `PUT /clients/{id}` — update
- `DELETE /clients/{id}` — delete
- `POST /clients/{id}/sitemap` — multipart upload (XML) or JSON body (pasted URLs)
- `GET /clients/{id}/sitemap` — read
- `GET /clients/{id}/usage` — cumulative cost for this client

### Generations

- `POST /generations` — create draft with input, return generation_id. Triggers fetcher in the background of this request — response includes competitor summaries (or errors) and selected sitemap URLs.
- `POST /generations/{id}/outline` — trigger outline generation (Claude, non-streamed), returns outline. 409 if user has an active generation.
- `POST /generations/{id}/outline/regenerate` — same as above but explicit re-roll.
- `PUT /generations/{id}/outline` — save user edits to outline.
- `POST /generations/{id}/approve-outline` — moves status to allow content generation.
- `POST /generations/{id}/content/stream` — SSE. Body: `{mode: "single_call" | "sequential"}`. Streams events per §6.7.
- `POST /generations/{id}/content/retry-section` — retry a single failed section. Body: `{section_id}`. Returns SSE.
- `POST /generations/{id}/qa` — runs QA pass on content the FE pushes back (since content isn't stored). Body: `{sections: [{id, content}]}`. Returns QA notes.
- `POST /generations/{id}/export` — push to Google Docs. Body: `{sections: [{id, heading, content_html}]}`. Returns the Doc URL.
- `POST /generations/{id}/abort` — mark aborted.
- `GET /generations/active` — return current in-progress generation for user (for the "you have an active generation" banner).

### Usage

- `GET /usage/me` — current user's cumulative cost
- `GET /usage/org` — org-wide rollup (clients × users × time)

---

## 10. Google Docs export

`app/services/export_service.py`.

1. Get a valid Google access token via `get_google_access_token(user)`.
2. Build a Google API client: `build("docs", "v1", credentials=Credentials(token=access_token))` and `build("drive", "v3", ...)`.
3. Create the Doc: `drive.files().create(body={"name": <generated-name>, "mimeType": "application/vnd.google-apps.document"}).execute()`. This places it in the user's My Drive root.
4. Name format: `[Client Name] - [Content Type Label] - [Primary Keyword] - YYYY-MM-DD`. Sanitize for filesystem-unsafe chars.
5. Convert sections (HTML) → Google Docs `batchUpdate` requests:
   - Build the document in a single `batchUpdate` call: `insertText`, `updateParagraphStyle` (heading levels), `updateTextStyle` (bold/italic), `createParagraphBullets` (lists), and `updateTextStyle` with `link` for hyperlinks.
   - Heading mapping: H1 → `HEADING_1`, H2 → `HEADING_2`, etc.
   - HTML parsed by BeautifulSoup; walk the tree emitting Doc API requests.
6. Return the Doc URL: `https://docs.google.com/document/d/{file_id}/edit`.
7. Store `exported_doc_url` and set `status = 'exported'`.

The HTML → Docs mapping is the riskiest implementation detail. The first pass should be deliberately simple — paragraphs, headings, bold, italic, lists, links. Skip anything more complex (don't try to support nested lists beyond two levels in v1).

---

## 11. Deployment

### 11.1 Backend on Fly.io

`backend/fly.toml`:

```toml
app = "content-gen-backend"
primary_region = "syd"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"

[http_service]
  internal_port = 8000
  force_https = true
  auto_stop_machines = "stop"     # Scale to zero
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
  memory = "512mb"

[deploy]
  release_command = "alembic upgrade head"
```

`backend/Dockerfile`:

- Multi-stage: builder with uv installs deps, runtime is python:3.12-slim with the venv copied in
- Final command: `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1`
- Single worker is fine for <5 users; FastAPI's async handles concurrency within the worker

Fly secrets to set:

- `DATABASE_URL` (from Neon)
- `ANTHROPIC_API_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `JWT_SECRET`
- `FERNET_KEY`
- `SENTRY_DSN`
- `ALLOWED_EMAIL_DOMAIN=digitaltreasury.com.au`
- `FRONTEND_ORIGIN=https://content-gen.netlify.app` (or final domain)

### 11.2 Frontend on Netlify

`netlify.toml` (repo root — Netlify reads it only from the build base
directory, so it cannot live under `frontend/`):

```toml
[build]
  base = "frontend"
  command = "pnpm install --frozen-lockfile && pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
  PNPM_VERSION = "11"

[[redirects]]
  from = "/api/*"
  to = "https://content-gen-backend.fly.dev/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The `/api/*` proxy means the FE can call `/api/v1/...` directly and avoid CORS complexity in production. CORS still needed in local dev (different ports).

Netlify env vars: `VITE_API_BASE_URL` (defaults to `/api` in production, `http://localhost:8000/api` in dev).

### 11.3 Database on Neon

- One project, two branches: `main` for production, `dev` (optional) for staging.
- Connection string set as `DATABASE_URL` Fly secret.
- Use the **pooled** connection string (Neon's PgBouncer endpoint) — important for Fly's auto-stop behaviour, since cold-starting and opening fresh connections is more efficient through the pool.
- Backups: Neon's automatic point-in-time recovery. No additional config.

---

## 12. CI/CD (GitHub Actions)

### 12.1 `.github/workflows/ci.yml`

Runs on every PR and push to `main`.

Jobs:

- **backend-test**: spin up postgres service, install uv + deps, run `ruff check`, `mypy app/`, `pytest`.
- **frontend-test**: install pnpm + deps, run `eslint`, `tsc --noEmit`, `pnpm test`.
- **frontend-build**: `pnpm build` (catches build-time errors before deploy).

### 12.2 `.github/workflows/deploy-backend.yml`

Runs on push to `main`. Uses Fly's GitHub Action: `flyctl deploy --remote-only`. Requires `FLY_API_TOKEN` secret.

### 12.3 `.github/workflows/deploy-frontend.yml`

Not needed if using Netlify's native GitHub integration (Netlify watches `main` and rebuilds automatically). If we want gating on the CI workflow, add a job that triggers Netlify's build hook only on green CI.

---

## 13. Observability

### 13.1 Logs

structlog → JSON → stdout → Fly captures. View live: `flyctl logs`. For longer retention, no aggregation in v1 (revisit if needed).

### 13.2 Errors

Sentry. Init in `app/sentry.py`:

```python
sentry_sdk.init(
    dsn=settings.sentry_dsn,
    integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    traces_sample_rate=0.0,  # No perf tracing in v1
    environment="production",
)
```

FE Sentry too (browser SDK), captures React errors and unhandled promise rejections.

### 13.3 What we deliberately skip in v1

- APM / distributed tracing
- Metrics dashboards (Prometheus/Grafana)
- Uptime monitoring (Fly's built-in healthcheck is enough)
- Log aggregation beyond Fly's built-in viewer

---

## 14. Security

- **All secrets via env vars.** No secrets in code, no secrets committed.
- **Session cookies:** httpOnly, secure, SameSite=Lax, path=`/`, configurable max-age (default 7 days).
- **CSRF:** Same-site Lax + same-origin requests via the Netlify proxy mean CSRF risk is minimal for state-changing endpoints. Add explicit CSRF token if a future feature requires cross-site posting.
- **CORS:** allowed origins = `[FRONTEND_ORIGIN]` only. Credentials allowed.
- **Refresh tokens at rest:** encrypted with Fernet using a key from `FERNET_KEY`. Rotate via a future migration if compromised.
- **Anthropic API key:** single org key, Fly secret. Never returned to FE. Never logged.
- **SSO domain restriction:** enforced in the callback handler; users outside the domain see a 403 and no user row is created.
- **DB access:** Neon connection string includes a strong password; only the Fly backend has it.
- **No public registration**, no password-based auth, no password storage. Reduces attack surface.

---

## 15. Setup checklist (bootstrap order)

Suggested order for the agent. Each step should be a commit/PR.

1. **Repo scaffold.** Create the folder structure per §4. Empty files where needed. README and this doc copied in.
2. **GCP project setup (human task).** Create a GCP project under the `digitaltreasury.com.au` workspace. Enable Google Drive API and Google Docs API. Create an OAuth 2.0 Client ID (type: Web application). Configure authorized redirect URIs (`http://localhost:8000/api/v1/auth/callback` for dev, `https://<netlify-site>.netlify.app/api/v1/auth/callback` for prod — the prod callback routes through Netlify's `/api` proxy so it shares an origin with the login request). Configure OAuth consent screen with scopes: `email`, `profile`, `openid`, `drive.file`. Restrict to internal users. Hand the client ID and secret to the build process.
3. **Backend skeleton.** `pyproject.toml` with all deps, `app/main.py` with healthcheck, `app/config.py` with settings, `Dockerfile`. Verify `docker compose up` boots a healthcheck-passing backend.
4. **Database + first migration.** `app/db.py`, `app/models/base.py`, alembic init. First migration creates all tables per §8.
5. **Auth flow end-to-end.** Implement `/auth/login`, `/auth/callback`, `/auth/me`, `/auth/logout`. Session JWT + cookie. Domain check. Manual smoke test by signing in.
6. **Frontend skeleton.** Vite app, Tailwind, React Router, Zustand auth store, generated API client, `Login` and basic shell. Manual smoke test: sign in, land on `/clients`.
7. **Clients CRUD.** BE routers + FE pages. Form fields per scope §7. No sitemap yet.
8. **Sitemap upload.** XML parser + pasted-URL parser → stored as JSONB per §8.3.
9. **Fetcher service.** Competitor URL fetching + sitemap filtering. Unit tests with VCR-style fixtures for HTTP.
10. **Prompts directory + loader.** All eight prompt templates with placeholder content. The agent should iterate on the actual prompt content with the human user — these are the core IP.
11. **Outline generation.** Non-streaming Claude call. BE endpoint + FE page with outline editor (drag-drop, edit, regenerate, approve).
12. **Content generation streaming.** SSE endpoint + FE consumer. Both modes. Section retry. Cancellation on disconnect.
13. **QA pass.** Rule-based + LLM. AI tells YAML. FE inline highlights + side panel.
14. **Rich text editor.** TipTap integration. ProseMirror JSON in store. QA decorations.
15. **Google Docs export.** Access token refresh helper. HTML → Docs `batchUpdate` mapping. FE export button.
16. **Cost tracking dashboards.** Per-generation indicator in the active flow. Per-client cumulative on client detail page. Per-user and org-wide on `/usage`.
17. **CI workflows.** Ruff + mypy + pytest on PR. ESLint + tsc + vitest. Build check.
18. **Production deploy.** Fly app creation, secrets, first deploy. Netlify site creation, env vars, first deploy. Update GCP redirect URI with the real Netlify hostname. Smoke test end-to-end in prod.
19. **Sentry setup.** Project per env (dev/prod), DSNs configured.

---

## 16. What's deliberately not in this doc

- Detailed prompt content. The prompt files are scaffolded with placeholders. Actual prompt engineering is collaborative between the team and Claude during iteration, not pre-specified here.
- Exact UI mockups. Component structure is laid out; visual design is a separate concern, done in TipTap-style minimal Tailwind first, polished later.
- Future features explicitly out of scope per the MVP doc (§3): section reprompting, content storage/versioning, CMS publishing, image gen, custom content types, type-specific input fields, sitemap auto-refresh, tables, analytics.

---

## 17. Future considerations (post-v1)

Captured so they don't get lost:

- **Playwright fallback in the fetcher** if non-JS-rendered fetches are consistently empty for SEO-relevant competitor pages.
- **Persistent content storage** to enable section reprompting, drafts, and history. Would add a `generation_sections` table with content TEXT.
- **A real admin role** enforced on usage dashboards and destructive operations.
- **Background job queue** (probably Arq or Dramatiq with Redis) if generations grow long enough that holding HTTP connections becomes a problem.
- **Prompt versioning + A/B testing** moving prompts from files to DB with version pinning per generation.
- **Embeddings-based sitemap relevance** instead of keyword match.
- **Multi-tenancy** if the tool ever serves outside `@digitaltreasury.com.au`.

---

*End of architecture design v1.*
