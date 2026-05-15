# Rule: Coding standards

Applies to all code in `backend/` and `frontend/`. Stack-specific detail is
in the respective `CLAUDE.md`; this file is the shared baseline.

## Scope discipline

- **Build what the phase needs — nothing more.** No speculative
  abstraction, no "might need it later" parameters, no feature flags.
- **No backwards-compat shims.** This is a greenfield v1 with no users.
  Change code directly; don't keep dead paths.
- **Three similar lines beat a premature abstraction.** Extract a helper
  only on the third real use.
- **Stay in v1 scope.** The MVP scope §3 non-goals are out. If a change
  drifts toward them, stop and re-read the scope.

## Quality

- **Typed.** `mypy` strict on `backend/app/`; no `any` in TypeScript.
  A suppression needs a one-line reason.
- **Linted and formatted.** `ruff` for Python, `eslint` + `prettier` for
  TS. Never commit lint failures; never bypass with ignore comments.
- **Errors at boundaries only.** Validate user input, external API
  responses, and fetched HTML. Trust internal calls and framework
  guarantees — don't add defensive checks for states that can't happen.
- **Secrets via env vars.** Never hardcode, never commit, never log. The
  Anthropic key and Google tokens in particular must never appear in logs.

## Comments

- Default to **no comments**. Names should carry the meaning.
- Write a comment only for a non-obvious *why*: a hidden constraint, a
  workaround, a subtle invariant.
- Never comment *what* the code does, and never reference the task/PR/issue
  that prompted the change.
- **Stub files are the exception** — a stub carries one `Stub:` line naming
  its purpose and target phase. Delete that line when the stub is filled.

## Testing

- New behaviour ships with a test. Bug fixes ship with a regression test.
- Backend: `pytest` (+ `pytest-asyncio`). Frontend: `vitest` + RTL.
- A phase is not done until its acceptance criteria — including tests —
  are met (see `build-process.md`).

## Definition of done

See the "Definition of done" section in `backend/CLAUDE.md` /
`frontend/CLAUDE.md`. In short: lint clean, types clean, tests green,
behaviour covered, docs updated.
