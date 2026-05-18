"""Competitor fetching and sitemap relevance filtering."""

import httpx
import pytest

from app.services import fetcher
from app.services.fetcher import CompetitorFetchError, CompetitorSummary

_SAMPLE_HTML = """
<html>
  <head>
    <title>Best Plumbing Services</title>
    <meta name="description" content="We fix pipes fast." />
  </head>
  <body>
    <h1>Plumbing Done Right</h1>
    <h2>Emergency Repairs</h2>
    <h3>24/7 Callouts</h3>
    <p>We provide reliable plumbing across the whole city.</p>
    <script>trackingPixel();</script>
  </body>
</html>
"""


def test_parse_competitor_html_extracts_structure() -> None:
    summary = fetcher.parse_competitor_html("https://x.example", _SAMPLE_HTML)
    assert summary.title == "Best Plumbing Services"
    assert summary.h1 == "Plumbing Done Right"
    assert summary.headings == ["Emergency Repairs", "24/7 Callouts"]
    assert summary.meta_description == "We fix pipes fast."
    assert summary.word_count > 5


async def test_fetch_competitor_success() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, html=_SAMPLE_HTML)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await fetcher.fetch_competitor(client, "https://x.example")
    assert isinstance(result, CompetitorSummary)
    assert result.title == "Best Plumbing Services"


async def test_fetch_competitor_captures_http_error() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(404)

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await fetcher.fetch_competitor(client, "https://x.example")
    assert isinstance(result, CompetitorFetchError)
    assert "404" in result.reason


async def test_fetch_competitor_captures_network_error() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("unreachable")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        result = await fetcher.fetch_competitor(client, "https://x.example")
    assert isinstance(result, CompetitorFetchError)


async def test_fetch_competitors_aggregates_mixed_results(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_fetch(
        _client: httpx.AsyncClient, url: str
    ) -> CompetitorSummary | CompetitorFetchError:
        if "bad" in url:
            return CompetitorFetchError(url=url, reason="nope")
        return CompetitorSummary(url=url, title="ok")

    monkeypatch.setattr(fetcher, "fetch_competitor", fake_fetch)
    results = await fetcher.fetch_competitors(
        ["https://good.example", "https://bad.example"]
    )
    assert len(results) == 2
    assert any(isinstance(r, CompetitorSummary) for r in results)
    assert any(isinstance(r, CompetitorFetchError) for r in results)


async def test_fetch_competitors_empty_list() -> None:
    assert await fetcher.fetch_competitors([]) == []


def test_filter_sitemap_ranks_by_keyword_match() -> None:
    urls = [
        {"url": "https://x.example/about-us"},
        {"url": "https://x.example/plumbing-services"},
        {
            "url": "https://x.example/emergency-plumbing",
            "title": "Emergency Plumbing",
        },
    ]
    matches = fetcher.filter_sitemap(urls, ["plumbing"], limit=2)
    assert len(matches) == 2
    assert matches[0].url == "https://x.example/emergency-plumbing"
    assert matches[0].score == 2  # once in the URL, once in the title


def test_filter_sitemap_respects_limit_and_skips_blank_urls() -> None:
    urls = [{"url": ""}, {"url": "https://x.example/a"}, {"url": "https://x.example/b"}]
    matches = fetcher.filter_sitemap(urls, ["nomatch"], limit=5)
    assert len(matches) == 2
