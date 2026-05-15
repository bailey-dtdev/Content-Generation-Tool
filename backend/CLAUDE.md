# CLAUDE.md — Backend

Conventions for the FastAPI backend. Read the root `CLAUDE.md` and
`docs/architecture-design.md` first — this file only covers backend
specifics.

## Stack

Python 3.12 · FastAPI · SQLAlchemy 2.0 async · asyncpg · Alembic ·
Pydantic v2 · Anthropic SDK (async) · `uv` package manager · `ruff` ·
`mypy` (strict on `app/`). Full list: arch §3.

## Layout (`backend/app/`)

| Dir / file        | Holds                                              |
|-------------------|----------------------------------------------------|
| `main.py`         | App construction, middleware, router mount         |
| `config.py`       | `Settings` (pydantic-settings) — single source     |
| `db.py`           | Async engine, session factory, `get_db()`          |
| `deps.py`         | FastAPI dependencies (auth, db)                     |
| `security.py`     | JWT + Fernet helpers                                |
| `models/`         | SQLAlchemy ORM — one file per aggregate root        |
| `schemas/`        | Pydantic request/response models                   |
| `routers/`        | One router per resource, mounted under `/api/v1`    |
| `services/`       | Business logic — keep routers thin                 |
| `prompts/`        | Markdown prompt templates (frontmatter + body)      |
| `config_files/`   | `model_rates.yaml`, `ai_tells.yaml`                 |

## Conventions

- **Async everywhere.** No sync DB or HTTP calls in request handlers.
- **Routers thin, services fat.** A router validates input, calls a
  service, shapes the response. Logic lives in `services/`.
- **One session per request.** Use the `get_db()` dependency; never
  construct sessions ad hoc.
- **Typed.** `mypy` runs strict on `app/`. No `# type: ignore` without a
  reason comment.
- **Settings only via `config.Settings`.** Never read `os.environ`
  directly elsewhere.
- **Structured logs.** Use `structlog`; bind `request_id` / `user_id`.
  Never log secrets or token values.
- **Migrations.** Every schema change is an Alembic migration. Never edit
  applied migrations — add a new one.

## Commands

Run via the root `Makefile`: `make up`, `make migrate`,
`make migration name=...`, `make test`, `make lint`. `make lint` =
`ruff check` + `mypy app/`.

## Definition of done (backend change)

`ruff check` clean · `mypy app/` clean · `pytest` green · new behaviour
covered by a test · migration added if schema changed.
