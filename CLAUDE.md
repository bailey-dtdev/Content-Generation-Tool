# CLAUDE.md — Content Generation Platform

Guidance for Claude Code (and humans) working in this repo. Read this first.

## What this is

An internal tool for `@digitaltreasury.com.au` to generate SEO content per
client: input → outline review → content generation → automated QA → manual
edit → export to Google Docs.

## The three source-of-truth documents

Read these before making non-trivial changes. They are authoritative; this
file only summarises and points.

1. **`docs/content-generation-platform-mvp-scope.md`** — functional scope.
   *What* we build and what is explicitly out of scope.
2. **`docs/architecture-design.md`** — technical decisions. *How* we build:
   stack, structure, data model, patterns. Prescriptive by design.
3. **`docs/build-plan.md`** — the phased, ordered breakdown. *In what order*
   we build. Its §3 checklist is the live progress tracker.

If this file disagrees with a source doc, the source doc wins.

## Repository layout

Single monorepo, plain folders (no workspaces — FE/BE share no code; types
flow via the generated OpenAPI client).

```
backend/    FastAPI + Python 3.12 — see backend/CLAUDE.md
frontend/   Vite + React + TS     — see frontend/CLAUDE.md
docs/       Source docs, build plan, rules, runbook
.claude/    Governance skills
.github/    CI/CD workflows
```

## Golden rules

- **Work the plan.** Pick up the current phase from `docs/build-plan.md` §3.
  Don't jump ahead; don't bundle unrelated phases into one PR.
- **Respect the architecture.** Decisions in `architecture-design.md` are
  locked. If one seems wrong, raise it — don't quietly diverge.
- **Stay in v1 scope.** The MVP scope §3 non-goals are out. Don't build
  section reprompting, content storage, CMS publishing, etc.
- **No over-engineering.** Build what the phase needs. No speculative
  abstraction, no backwards-compat shims, no unrequested error handling.
- **Follow the rules suite.** See `docs/rules/`. It governs documentation,
  code standards, git workflow, and the build process.
- **Keep docs honest.** Update `docs/build-plan.md` §3 as phases progress.
  Run `/cleanup-docs` before any PR that touches markdown.
- **Secrets via env vars only.** Never commit secrets. Never log the
  Anthropic key or Google tokens.

## Governance skills

Project skills in `.claude/skills/`:

- **`/cleanup-docs`** — audit and tidy markdown: structure, staleness,
  stray files. Run before merging doc changes.
- **`/verify-rules`** — check the current diff against `docs/rules/`
  before committing.
- **`/build-status`** — report progress against `docs/build-plan.md` and
  name the next actionable phase.

## Sub-project guides

- `backend/CLAUDE.md` — Python/FastAPI conventions.
- `frontend/CLAUDE.md` — React/TS conventions.
