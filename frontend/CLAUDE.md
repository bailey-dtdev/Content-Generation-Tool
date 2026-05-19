# CLAUDE.md — Frontend

Conventions for the React frontend. Read the root `CLAUDE.md` and
`docs/architecture-design.md` first — this file only covers frontend
specifics.

## Stack

Vite · React 18 · TypeScript 5 (strict) · React Router v6 · Zustand ·
React Hook Form + Zod · TipTap v2 · `@dnd-kit/sortable` · `pnpm`.

Styling is the in-repo **design system** (`src/styles/tokens.css` +
`app.css`), ported from `frontend/design/`. Semantic class names, not
utility classes — Tailwind is not used.

## Layout (`frontend/src/`)

| Dir / file       | Holds                                               |
|------------------|-----------------------------------------------------|
| `main.tsx`       | Entry point                                         |
| `App.tsx`        | Router + route guard                                |
| `api/generated/` | OpenAPI client — generated, do not hand-edit        |
| `lib/`           | `http.ts`, `sse.ts`, `utils.ts`, `sentry.ts`        |
| `stores/`        | Zustand stores (`auth`, `generation`)               |
| `styles/`        | Design-system CSS (`tokens.css`, `app.css`)         |
| `routes/`        | Page-level components, one per route                |
| `components/`    | Reusable components; `components/ui/` = primitives  |

## Conventions

- **API calls go through the generated client.** No hand-written fetch to
  the backend. After backend API changes, run `make gen-api` and commit
  the regenerated `api/generated/`.
- **Two stores only.** `auth` (in-memory) and `generation` (persisted to
  `sessionStorage` — this is the *only* place in-progress generation
  content lives; the backend does not store it).
- **Warn before losing work.** Any navigation away from an active
  generation must confirm first (scope §6.2).
- **SSE via `lib/sse.ts`.** The streaming endpoint is POST-with-body, so
  use the `fetch` + `ReadableStream` wrapper, not native `EventSource`.
  Components own an `AbortController` and abort on unmount.
- **Strict TypeScript.** No `any`. `tsc --noEmit` must pass.
- **Styling via the design system.** Use the semantic classes from
  `src/styles/` (`.card`, `.btn`, `.field`, …). Shared primitives —
  `Icon`, `Button`, `Chip`, `Field` — live in `components/ui/`.
- **Forms:** React Hook Form + Zod schemas for the input step.

## Commands

`pnpm dev`, `pnpm test`, `pnpm build`, `pnpm lint`. API client regen:
`make gen-api` (from repo root, backend must be running).

## Definition of done (frontend change)

`eslint` clean · `tsc --noEmit` clean · `vitest` green · `pnpm build`
succeeds · feature verified in the browser (golden path + edge cases).
