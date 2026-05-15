# Content Generation Platform — MVP Scope

> **Purpose of this document:** Lock in functional scope and product decisions for v1. Architecture, tech stack, and implementation details are deliberately out of scope and will be addressed in a follow-up document.

---

## 1. Overview

An internal tool for generating SEO-optimised content (service pages, PLPs, PDPs, blogs, etc.) per client. The tool guides the user through a staged generation flow: input → outline review → content generation → automated QA → manual edit → export to Google Docs. Designed for use by a small team (~few users) inside a single organisation (@digitaltreasury).

## 2. Goals

- Generate high-quality, on-brand, Google-best-practice-aligned content per client and content type.
- Apply humanisation principles automatically and surface QA feedback to the user.
- Provide a staged workflow with one approval gate (outline) so users can steer before tokens are spent on a full draft.
- Export final content directly to Google Docs.
- Track LLM cost per generation, per client, and per user.

## 3. Non-Goals (v1)

The following are explicitly **out of scope** for v1:

- **Section reprompting** — deferred to post-v1. Manual rich-text editing is the v1 substitute for fixing generated content.
- **Content storage / versioning** — drafts live in FE session state only, then are exported or discarded.
- **Publishing to a CMS** — output goes to Google Docs; humans handle publication.
- **Image generation.**
- **Custom / user-definable content types** — fixed library only.
- **Type-specific structured input fields** — a single large "additional context" field covers type-specific needs.
- **Sitemap auto-refresh** — manual re-upload only.
- **Tables in the rich text editor.**
- **Rank tracking, SERP monitoring, analytics.**

---

## 4. Users & Authentication

- **Google SSO from day one.**
- Domain-restricted: only `@digitaltreasury` accounts can sign in.
- The Google OAuth token obtained at sign-in is reused for Google Docs export (no separate OAuth flow at export time).
- No public registration. All access is via SSO.

## 5. Concurrency Model

- One active piece of work per user at a time (single in-flight generation).
- Multiple users can use the tool simultaneously (independent sessions).
- No collaborative editing in v1.

---

## 6. Data Model

### 6.1 Persisted entities

- **Users** — identity, email, SSO metadata, role (TBD if roles are needed in v1).
- **Clients** — see §7 for full schema.
- **Sitemaps** — attached to clients, see §7.4.
- **Usage records** — generation metadata, token counts, costs (see §11). Note: **the generated content itself is NOT persisted**, only the metadata about its generation.

### 6.2 Ephemeral (FE session state only, lost on browser close or abort)

- The user's in-progress generation: input data, outline, generated content per section, QA notes, manual edits.

> ⚠️ **Implication:** Closing the browser mid-flow loses work. FE should warn before navigation away from an active generation.

---

## 7. Client Registry

Standard CRUD: create, read, update, delete clients. Each client has structured fields, all separated (no single blob).

### 7.1 Identity

- Client name
- Industry
- Primary website URL

### 7.2 Brand voice & audience (structured, each a separate field)

- Brand voice / tone descriptors
- Audience definition (free text; multi-persona allowed by writing multiple)
- Author / E-E-A-T signals (author bios, credentials, citations to prefer)

### 7.3 Style rules (structured)

- Language variant (e.g. AU English / US English / UK English)
- Reading level target
- Sentence length preference (e.g. short / mixed / longer)
- Banned words / phrases (list)
- Approved phrases / boilerplate (list)
- Oxford comma preference (or other punctuation conventions as needed)

### 7.4 Internal linking

- **Sitemap per client.** Accepts:
  - `.xml` sitemap file upload, OR
  - Pasted list of URLs (one per line).
- Stored per client. No auto-refresh in v1 — user re-uploads when stale.
- At generation time, sitemap is **filtered** by topical relevance to the piece's primary/secondary keywords (keyword match against URL slugs / page titles is sufficient for v1; top N ~ 5–10 most relevant passed to the LLM). Full sitemap is **never** dumped into the prompt.

---

## 8. Content Types

### 8.1 Supported types (fixed library)

- Service page
- Product Listing Page (PLP) / category page
- Product Detail Page (PDP)
- Blog post

(More can be added in future versions; the type list is hardcoded in v1.)

### 8.2 Input fields (uniform UI across all types)

Per-piece input (collected once at the start of a generation):

- **Client** (selector — pulls from registry)
- **Content type** (selector — fixed list above)
- **Primary keyword**
- **Secondary keywords** (list)
- **Search intent** (informational / commercial / transactional / navigational)
- **Competitor URLs** (list — used by the fetcher, see §9)
- **Target URL** (optional, if updating an existing page)
- **Target word count**
- **Additional context** (single large free-text field — captures all type-specific information such as product specs, service offering details, blog angle, etc.)

> **Note:** Although the FE input is uniform, the **backend prompt strategy varies per content type**. The selected type determines which prompt template / instruction set is used at the outline and content generation stages.

---

## 9. Pre-Generation Fetching

A backend fetching layer runs **before both outline generation and content generation** (i.e. its outputs are passed into both Claude calls).

### 9.1 What it fetches

- **Competitor URLs** (from user input) — content is fetched, parsed, and formatted into a structured summary (headings, key topics covered, approximate word counts, gaps).
- **Client sitemap** — filtered to top N most topically relevant URLs (as per §7.4) for internal linking suggestions.

### 9.2 Behaviour

- Fetched data is formatted into a single structured block that the LLM can consume.
- If a competitor URL fails to fetch (blocked, JS-heavy, 4xx/5xx), it is skipped with a note returned to the user; generation continues with whatever succeeded.

---

## 10. Generation Flow

The main user journey, in order:

### Step 1 — Setup

User selects client, selects content type, and fills in input fields (§8.2).

### Step 2 — Pre-generation fetch

Backend runs the fetcher (§9). Surfaces any fetch failures to the user but proceeds with whatever succeeded.

### Step 3 — Outline generation

Claude produces a sectional outline:

- Heading per section
- Short descriptive blurb per section explaining what that section will cover

The outline is informed by competitor analysis and respects the client's brand voice and style rules (brand voice is applied at this stage).

### Step 4 — Outline editing (user gate)

User can:

- Edit any heading
- Edit any blurb
- Reorder sections (drag-and-drop)
- Add a new section (heading + blurb)
- Delete a section
- **Regenerate the entire outline** (full re-roll if the first attempt is poor)

User must explicitly approve the outline to proceed.

### Step 5 — Content generation

Two modes available, **user picks per generation** (toggle in UI):

- **Single-call mode** — one Claude call returns all sections. Cheaper, faster, less per-section depth.
- **Sequential mode** — one Claude call per section, each with full document context. Higher quality, supports streaming progress in the UI, more expensive and slower.

Brand voice and style rules are applied at this stage. Filtered sitemap URLs are passed in so the model can suggest internal links contextually.

### Step 6 — Automated QA pass

Both rule-based and LLM-based checks run:

- **Rule-based** (regex / dictionary / heuristics): banned words/phrases from client, common AI tells (e.g. "delve", "tapestry", "navigate the landscape of"), sentence length distribution, keyword density, reading level estimate, language-variant violations (US vs AU spellings, etc.).
- **LLM-based** (a second Claude call): humanisation pattern adherence, brand voice fit, Google helpful-content alignment, E-E-A-T signal presence.

Brand voice is **also applied at this stage** (the QA pass checks against it).

### Step 7 — Review & edit

User sees the generated content with QA notes presented **two ways simultaneously**:

- **Side panel** — list of all flagged issues with severity, type, and section reference.
- **Inline highlights** — issues highlighted within the content; click/hover reveals the note.

User can manually edit the content in a **rich text editor** (see §12). No reprompting in v1.

### Step 8 — Export or abort

- **Export:** content is pushed to a new Google Doc using the user's SSO token. See §13.
- **Abort:** session is discarded. Tokens already spent are still counted in usage records (no rollback). FE confirms before discarding.

---

## 11. Cost Tracking

Tracked at all levels:

- **Per generation** — total tokens (input + output), total cost, breakdown by stage (outline / content / QA), displayed in the active session UI.
- **Per client cumulative** — total spend against each client (visible in client registry).
- **Per user cumulative** — total spend per user.
- **Aggregated dashboard** — organisation-wide view across all clients and users.

Token counts and cost metadata are **persisted** even though the generated content is not.

---

## 12. Rich Text Editor

In-FE editor for manual content edits before export.

### 12.1 Supported formatting

- Headings (H1–H4)
- Bold, italic
- Bulleted and numbered lists
- Hyperlinks

### 12.2 Not supported in v1

- Tables
- Images
- Code blocks (unless trivially included by editor library default)
- Custom blocks

> Library recommendation (deferred to architecture phase, but a sensible default): TipTap.

---

## 13. Google Docs Export

- Uses the user's existing Google SSO token (no separate OAuth consent at export time, assuming Drive scope is requested at sign-in — needs to be confirmed in architecture phase).
- Creates a new Google Doc with the content.
- Formatting (headings, bold, italic, lists, links) maps from the rich text editor into Doc formatting.
- **Open decisions (deferred to architecture phase):**
  - Destination: user's "My Drive" vs a shared Drive folder, possibly per-client.
  - Naming convention (suggested: `[Client] - [Page Type] - [Primary Keyword] - YYYY-MM-DD`).
  - Permission defaults on the created doc.

---

## 14. Open Decisions Deferred to Architecture Phase

Captured here so they don't get lost:

1. Google Drive scope at sign-in — confirm Drive write scope is requested so export works without re-prompting.
2. Google Doc destination, naming convention, default permissions.
3. Tech stack: FE framework, BE framework, DB choice.
4. Hosting / deployment.
5. Backend job model: synchronous request/response vs background job queue for sequential-mode generation.
6. Streaming strategy: server-sent events / websockets for streaming generated sections back to the FE.
7. Claude API rate limiting strategy for concurrent users.
8. Storage choice for persisted entities (Postgres assumed but not locked).
9. Retry / failure handling for partial generation failures (e.g. section 4 of 7 fails — retry just that section? error the whole flow?).
10. Roles / permissions model — v1 likely flat ("any signed-in @digitaltreasury user can see all clients"); confirm.

---

## 15. Glossary

- **Client** — a brand/business the tool is generating content for. Persisted entity.
- **Content type** — the page type being generated (service / PLP / PDP / blog). Drives prompt strategy.
- **Outline** — the sectional breakdown Claude produces before drafting; user-editable; the one approval gate in the flow.
- **Section** — a heading + body of content within a generated piece.
- **Fetcher** — backend module that retrieves competitor URLs and filters sitemap before sending data to Claude.
- **QA pass** — automated review of generated content using both rule-based and LLM-based checks.
- **Humanisation** — making AI-generated text read more naturally; in v1 surfaced as QA feedback only, not as an auto-rewrite.
- **Sitemap** — per-client URL set used for internal linking suggestions; filtered by topical relevance at generation time.

---

## 16. Summary of the v1 Linear Flow

```
Sign in (Google SSO, @digitaltreasury)
    ↓
Select / create client (registry)
    ↓
Start new generation: select client + content type + fill inputs
    ↓
Backend fetch (competitors + filtered sitemap)
    ↓
Claude → outline (heading + blurb per section)
    ↓
User edits outline (edit / reorder / add / delete / regenerate)
    ↓
User approves outline
    ↓
Claude → content (single-call OR sequential per section — user choice)
    ↓
QA pass (rule-based + LLM-based) → notes
    ↓
User reviews (inline highlights + side panel) and edits in rich text
    ↓
Export to Google Doc  ──OR──  Abort
    ↓
Usage / cost record persisted
```

---

*End of v1 scope document. Architecture document to follow in a separate thread.*
