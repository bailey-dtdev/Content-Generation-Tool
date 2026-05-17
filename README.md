# Content Generation Platform

Internal SEO content generation tool for `@digitaltreasury.com.au`. Guides a
user through a staged flow: input → outline review → content generation →
automated QA → manual edit → export to Google Docs.

## Documentation

| Document | Purpose |
|---|---|
| [`docs/content-generation-platform-mvp-scope.md`](docs/content-generation-platform-mvp-scope.md) | Functional scope — *what* v1 is |
| [`docs/architecture-design.md`](docs/architecture-design.md) | Technical decisions — *how* it's built |
| [`docs/build-plan.md`](docs/build-plan.md) | Phased build plan — *in what order*; §3 is the live tracker |
| [`docs/runbook.md`](docs/runbook.md) | Operational notes |
| [`docs/rules/`](docs/rules/) | Working standards for every change |
| [`CLAUDE.md`](CLAUDE.md) | Guidance for Claude Code and contributors |

## Layout

```
backend/    FastAPI + Python 3.12
frontend/   Vite + React + TypeScript
docs/       Source docs, build plan, rules, runbook
.claude/    Governance skills (/cleanup-docs, /verify-rules, /build-status)
.github/    CI/CD workflows
```

## Status

Phase 0 (repo scaffold & governance). The repository is currently a
scaffold of stub files — see `docs/build-plan.md` §3 for live progress.
Each stub file names the phase that will implement it.

## Getting started

Local development runs via Docker Compose (`make up`). Prerequisites and
environment setup are in `docs/architecture-design.md` §5. The toolchain
itself lands in Phase 1.
