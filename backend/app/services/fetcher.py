"""Competitor page fetching and sitemap relevance filtering.

Runs before outline and content generation; its output is fed into both
Claude calls. See architecture-design.md §6.9.
"""

import asyncio
from typing import Any

import httpx
import structlog
from bs4 import BeautifulSoup
from pydantic import BaseModel, Field

log = structlog.get_logger()

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
_TIMEOUT = 10.0
DEFAULT_SITEMAP_LIMIT = 8


class CompetitorSummary(BaseModel):
    url: str
    title: str | None = None
    h1: str | None = None
    headings: list[str] = Field(default_factory=list)
    word_count: int = 0
    meta_description: str | None = None


class CompetitorFetchError(BaseModel):
    url: str
    reason: str


class SitemapMatch(BaseModel):
    url: str
    title: str | None = None
    score: int


def parse_competitor_html(url: str, html: str) -> CompetitorSummary:
    """Extract a structured summary from a competitor page's HTML."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    title = soup.title.get_text(strip=True) if soup.title else None
    h1_tag = soup.find("h1")
    h1 = h1_tag.get_text(strip=True) if h1_tag else None
    headings = [
        text
        for tag in soup.find_all(["h2", "h3"])
        if (text := tag.get_text(strip=True))
    ]
    meta_tag = soup.find("meta", attrs={"name": "description"})
    meta_description = meta_tag.get("content") if meta_tag else None
    word_count = len(soup.get_text(separator=" ", strip=True).split())

    return CompetitorSummary(
        url=url,
        title=title or None,
        h1=h1 or None,
        headings=headings,
        word_count=word_count,
        meta_description=meta_description or None,
    )


async def fetch_competitor(
    client: httpx.AsyncClient, url: str
) -> CompetitorSummary | CompetitorFetchError:
    """Fetch and summarise one competitor URL; never raises."""
    try:
        response = await client.get(url, follow_redirects=True)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        log.info("fetcher.competitor_http_error", url=url, status=exc.response.status_code)
        return CompetitorFetchError(url=url, reason=f"HTTP {exc.response.status_code}")
    except httpx.HTTPError as exc:
        log.info("fetcher.competitor_request_failed", url=url, error=type(exc).__name__)
        return CompetitorFetchError(url=url, reason=f"request failed ({type(exc).__name__})")

    try:
        return parse_competitor_html(url, response.text)
    except Exception as exc:
        log.warning("fetcher.competitor_parse_failed", url=url, error=type(exc).__name__)
        return CompetitorFetchError(url=url, reason="could not parse page")


async def fetch_competitors(
    urls: list[str],
) -> list[CompetitorSummary | CompetitorFetchError]:
    """Fetch all competitor URLs concurrently; failures are per-URL, not fatal."""
    if not urls:
        return []
    async with httpx.AsyncClient(
        timeout=_TIMEOUT, headers={"User-Agent": _USER_AGENT}
    ) as client:
        results = await asyncio.gather(*(fetch_competitor(client, url) for url in urls))
    return list(results)


def filter_sitemap(
    sitemap_urls: list[dict[str, Any]],
    keywords: list[str],
    limit: int = DEFAULT_SITEMAP_LIMIT,
) -> list[SitemapMatch]:
    """Rank stored sitemap URLs by keyword relevance; return the top N.

    Score is the count of keyword occurrences in the URL and any stored title;
    ties break toward shorter URLs. See architecture-design.md §6.9.
    """
    terms = [term.lower() for term in keywords if term.strip()]
    matches: list[SitemapMatch] = []
    for entry in sitemap_urls:
        url = str(entry.get("url", "")).strip()
        if not url:
            continue
        title = entry.get("title")
        haystack = f"{url} {title or ''}".lower()
        score = sum(haystack.count(term) for term in terms)
        matches.append(SitemapMatch(url=url, title=title, score=score))

    matches.sort(key=lambda match: (-match.score, len(match.url)))
    return matches[:limit]
