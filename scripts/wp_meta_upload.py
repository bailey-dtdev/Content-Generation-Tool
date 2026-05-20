#!/usr/bin/env python3
"""
Bulk-update Yoast SEO meta titles and descriptions on a WordPress site from a CSV.

Reads a CSV with columns:
    Staging URL, Staging Path, Upload Title, Upload Description, ...
For each row, resolves the URL to a WordPress object (page, post, category, tag)
and PATCHes its Yoast meta fields via the WP REST API using Basic auth with an
application password.

Author archives are skipped (Yoast does not reliably expose author archive meta
for write via REST without Yoast Premium).

Rows where both Upload Title and Upload Description are empty are skipped.

Usage:
    export WP_BASE_URL='https://wordpress-1259916-6305249.cloudwaysapps.com'
    export WP_USER='your-wp-username'
    export WP_APP_PASSWORD='xxxx xxxx xxxx xxxx xxxx xxxx'

    # Dry run first — resolves every row, reports what would change, writes no data:
    python scripts/wp_meta_upload.py --csv scripts/data/vaada_meta.csv --dry-run

    # Live run, starting fresh:
    python scripts/wp_meta_upload.py --csv scripts/data/vaada_meta.csv

    # Live run, only pages and posts:
    python scripts/wp_meta_upload.py --csv scripts/data/vaada_meta.csv --only-types post_or_page

    # Resume from row N if interrupted:
    python scripts/wp_meta_upload.py --csv scripts/data/vaada_meta.csv --start-row 423
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Iterable
from urllib.parse import urlparse

import requests
from requests.auth import HTTPBasicAuth

TIMEOUT = 30
RETRY_STATUSES = {429, 500, 502, 503, 504}
MAX_RETRIES = 4


@dataclass
class Row:
    index: int
    staging_url: str
    staging_path: str
    upload_title: str
    upload_desc: str
    obj_type: str = ""
    resolved_id: int | None = None
    resolved_endpoint: str = ""
    status: str = ""
    message: str = ""


def classify(path: str) -> str:
    p = path.strip("/")
    if not p:
        return "home"
    head = p.split("/", 1)[0]
    if head == "category":
        return "category"
    if head == "tag":
        return "tag"
    if head == "author":
        return "author"
    return "post_or_page"


def normalize_url(u: str) -> str:
    return u.strip().rstrip("/").lower()


class WP:
    def __init__(self, base_url: str, user: str, app_password: str):
        self.base = base_url.rstrip("/")
        self.auth = HTTPBasicAuth(user, app_password)
        self.s = requests.Session()
        self.s.headers.update({"User-Agent": "vaada-meta-uploader/1.0"})

    def _request(self, method: str, url: str, **kw) -> requests.Response:
        last: requests.Response | None = None
        for attempt in range(MAX_RETRIES):
            r = self.s.request(method, url, auth=self.auth, timeout=TIMEOUT, **kw)
            if r.status_code not in RETRY_STATUSES:
                return r
            last = r
            time.sleep(2 ** attempt)
        assert last is not None
        return last

    def find_by_slug_and_url(self, endpoint: str, slug: str, full_url: str) -> dict | None:
        """Look up an object by slug, then disambiguate by matching the canonical link."""
        url = f"{self.base}/wp-json/wp/v2/{endpoint}"
        r = self._request("GET", url, params={"slug": slug, "per_page": 100, "context": "edit"})
        if r.status_code == 401:
            raise PermissionError(f"401 from {url} — check WP_USER / WP_APP_PASSWORD")
        if r.status_code >= 400:
            return None
        candidates = r.json() if isinstance(r.json(), list) else []
        if not candidates:
            return None
        target = normalize_url(full_url)
        for c in candidates:
            if normalize_url(c.get("link", "")) == target:
                return c
        return candidates[0] if len(candidates) == 1 else None

    def resolve_post_or_page(self, full_url: str, path: str) -> tuple[str, dict] | None:
        slug = path.strip("/").split("/")[-1]
        if not slug:
            return None
        for endpoint in ("pages", "posts"):
            obj = self.find_by_slug_and_url(endpoint, slug, full_url)
            if obj:
                return endpoint, obj
        return None

    def resolve_taxonomy(self, kind: str, full_url: str, path: str) -> tuple[str, dict] | None:
        # kind is "category" or "tag"
        endpoint = "categories" if kind == "category" else "tags"
        # path is like /category/publication/media-release/ — last segment is the term slug
        segments = [s for s in path.strip("/").split("/") if s]
        if len(segments) < 2:
            return None
        slug = segments[-1]
        obj = self.find_by_slug_and_url(endpoint, slug, full_url)
        return (endpoint, obj) if obj else None

    def update_meta(self, endpoint: str, obj_id: int, title: str | None, desc: str | None) -> tuple[bool, str]:
        meta: dict[str, str] = {}
        if title:
            meta["_yoast_wpseo_title"] = title
        if desc:
            meta["_yoast_wpseo_metadesc"] = desc
        if not meta:
            return True, "no-op (no fields)"
        url = f"{self.base}/wp-json/wp/v2/{endpoint}/{obj_id}"
        r = self._request("POST", url, json={"meta": meta})
        if r.status_code in (200, 201):
            body = r.json()
            stored = body.get("meta", {}) if isinstance(body, dict) else {}
            check_pairs = []
            if title:
                check_pairs.append(("_yoast_wpseo_title", title, stored.get("_yoast_wpseo_title")))
            if desc:
                check_pairs.append(("_yoast_wpseo_metadesc", desc, stored.get("_yoast_wpseo_metadesc")))
            mismatches = [(k, want, got) for (k, want, got) in check_pairs if got != want]
            if mismatches:
                return False, f"meta not persisted (key likely not exposed via REST): {mismatches}"
            return True, "updated"
        return False, f"HTTP {r.status_code}: {r.text[:200]}"


def load_rows(csv_path: Path) -> list[Row]:
    rows: list[Row] = []
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, raw in enumerate(reader, start=2):  # row 2 = first data line
            staging_url = raw.get("Staging URL", "").strip()
            staging_path = raw.get("Staging Path", "").strip()
            if not staging_path and staging_url:
                staging_path = urlparse(staging_url).path
            rows.append(Row(
                index=i,
                staging_url=staging_url,
                staging_path=staging_path,
                upload_title=raw.get("Upload Title", "").strip(),
                upload_desc=raw.get("Upload Description", "").strip(),
            ))
    return rows


def write_report(rows: Iterable[Row], out_path: Path) -> None:
    fields = ["row", "obj_type", "endpoint", "resolved_id", "status", "message",
              "staging_url", "upload_title", "upload_desc"]
    with out_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(fields)
        for r in rows:
            w.writerow([
                r.index, r.obj_type, r.resolved_endpoint, r.resolved_id or "",
                r.status, r.message, r.staging_url, r.upload_title, r.upload_desc,
            ])


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--csv", required=True, type=Path)
    p.add_argument("--base-url", default=os.environ.get("WP_BASE_URL"))
    p.add_argument("--user", default=os.environ.get("WP_USER"))
    p.add_argument("--app-password", default=os.environ.get("WP_APP_PASSWORD"))
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--start-row", type=int, default=0,
                   help="Skip rows whose index < start-row (1-based CSV row including header)")
    p.add_argument("--only-types", default="",
                   help="Comma-separated subset of: post_or_page,category,tag")
    p.add_argument("--log", type=Path,
                   default=Path("logs") / f"wp_meta_upload_{datetime.now():%Y%m%d_%H%M%S}.csv")
    args = p.parse_args()

    if not args.base_url or not args.user or not args.app_password:
        print("Missing creds. Set WP_BASE_URL, WP_USER, WP_APP_PASSWORD (or pass --base-url etc).",
              file=sys.stderr)
        return 2

    only = {t.strip() for t in args.only_types.split(",") if t.strip()}
    rows = load_rows(args.csv)
    print(f"Loaded {len(rows)} rows from {args.csv}")

    wp = WP(args.base_url, args.user, args.app_password)

    args.log.parent.mkdir(parents=True, exist_ok=True)
    processed = 0
    counts = {"updated": 0, "would-update": 0, "skipped": 0, "failed": 0, "not-found": 0}

    try:
        for r in rows:
            if r.index < args.start_row:
                continue
            if args.limit is not None and processed >= args.limit:
                break

            r.obj_type = classify(r.staging_path)

            if not (r.upload_title or r.upload_desc):
                r.status = "skipped"
                r.message = "no upload fields"
                counts["skipped"] += 1
                continue
            if r.obj_type == "author":
                r.status = "skipped"
                r.message = "author archive (accept default)"
                counts["skipped"] += 1
                continue
            if r.obj_type == "home":
                r.status = "skipped"
                r.message = "home page — update via Yoast > Search Appearance"
                counts["skipped"] += 1
                continue
            if only and r.obj_type not in only:
                r.status = "skipped"
                r.message = f"filtered out (--only-types {sorted(only)})"
                counts["skipped"] += 1
                continue

            try:
                if r.obj_type == "post_or_page":
                    found = wp.resolve_post_or_page(r.staging_url, r.staging_path)
                else:
                    found = wp.resolve_taxonomy(r.obj_type, r.staging_url, r.staging_path)
            except PermissionError as e:
                print(f"FATAL: {e}", file=sys.stderr)
                r.status = "failed"
                r.message = str(e)
                counts["failed"] += 1
                break

            if not found:
                r.status = "not-found"
                r.message = f"no WP object matched {r.staging_url}"
                counts["not-found"] += 1
                processed += 1
                continue

            endpoint, obj = found
            r.resolved_endpoint = endpoint
            r.resolved_id = obj.get("id")

            if args.dry_run:
                r.status = "would-update"
                r.message = (
                    f"would PATCH {endpoint}/{r.resolved_id} "
                    f"title={'Y' if r.upload_title else '-'} "
                    f"desc={'Y' if r.upload_desc else '-'}"
                )
                counts["would-update"] += 1
            else:
                ok, msg = wp.update_meta(endpoint, r.resolved_id,
                                         r.upload_title or None, r.upload_desc or None)
                r.status = "updated" if ok else "failed"
                r.message = msg
                counts["updated" if ok else "failed"] += 1

            processed += 1
            if processed % 25 == 0:
                print(f"  ... {processed} processed (updated={counts['updated']} "
                      f"would-update={counts['would-update']} not-found={counts['not-found']} "
                      f"failed={counts['failed']})")
    finally:
        write_report(rows, args.log)
        print(f"\nReport: {args.log}")
        print(f"Summary: {counts}")

    return 0 if counts["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
