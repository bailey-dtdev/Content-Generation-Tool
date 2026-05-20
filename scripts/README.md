# scripts/

One-off utilities. Not part of the platform; out of MVP scope.

## wp_meta_upload.py — bulk update Yoast meta from CSV

Reads a CSV of staging URLs + desired Yoast titles/descriptions and pushes
updates via the WordPress REST API.

### Prerequisites

- Python 3.10+
- `pip install requests`
- A WordPress **application password** for a user with edit rights:
  - WP admin → Users → your user → Application Passwords → "New Application Password"
  - Copy the generated value (it's only shown once).
- The `_yoast_wpseo_title` and `_yoast_wpseo_metadesc` meta keys must be
  exposed via REST. Yoast does this for posts/pages out of the box on recent
  versions. For **categories/tags** this depends on your Yoast version — if
  taxonomy updates report `meta not persisted`, you'll need Yoast SEO
  Premium or a small MU plugin that calls `register_term_meta(...,
  ['show_in_rest' => true])` for those keys.

### Usage

```bash
export WP_BASE_URL='https://wordpress-1259916-6305249.cloudwaysapps.com'
export WP_USER='your-wp-username'
export WP_APP_PASSWORD='xxxx xxxx xxxx xxxx xxxx xxxx'

# 1. Dry run — resolves every row, writes no data, produces a report:
python scripts/wp_meta_upload.py --csv scripts/data/vaada_meta.csv --dry-run

# 2. Inspect the report at logs/wp_meta_upload_*.csv. Check that:
#    - rows resolved (resolved_id is populated)
#    - the "would-update" count matches expectations
#    - "not-found" rows are explainable

# 3. Live run for posts/pages only first (lowest risk):
python scripts/wp_meta_upload.py --csv scripts/data/vaada_meta.csv \
  --only-types post_or_page

# 4. Then taxonomies:
python scripts/wp_meta_upload.py --csv scripts/data/vaada_meta.csv \
  --only-types category,tag
```

### Flags

- `--dry-run` — resolve and report, write nothing.
- `--limit N` — process at most N rows after filtering.
- `--start-row N` — resume from CSV row N (1-based, header is row 1).
- `--only-types post_or_page,category,tag` — restrict to subset.
- `--log path/to/report.csv` — override the report path.

### What gets skipped

- Rows where both Upload Title and Upload Description are blank.
- Author archives (`/author/...`) — Yoast doesn't reliably support these via REST.
- The home page row — set manually via Yoast → Search Appearance.

### Report

Every run writes a CSV report to `logs/wp_meta_upload_YYYYMMDD_HHMMSS.csv` with
one row per input row, columns: row, obj_type, endpoint, resolved_id, status,
message, staging_url, upload_title, upload_desc.

Status values: `updated`, `would-update` (dry-run), `skipped`, `not-found`,
`failed`.
