"""Content streaming — SSE events, both modes, section retry."""

from collections.abc import AsyncIterator
from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient

from app.services import claude_service
from app.services.claude_service import (
    OutlineResult,
    OutlineSectionDraft,
    StreamChunk,
    StreamDelta,
    StreamDone,
    TokenUsage,
)


def _outline_result() -> OutlineResult:
    return OutlineResult(
        sections=[
            OutlineSectionDraft(heading="Intro", blurb="Scene."),
            OutlineSectionDraft(heading="Body", blurb="Detail."),
        ],
        usage=TokenUsage(input_tokens=100, output_tokens=200),
    )


async def _ok_stream(*_args: object, **_kwargs: object) -> AsyncIterator[StreamChunk]:
    yield StreamDelta(text="Hello ")
    yield StreamDelta(text="world.")
    yield StreamDone(usage=TokenUsage(input_tokens=80, output_tokens=300))


async def _failing_stream(
    *_args: object, **_kwargs: object
) -> AsyncIterator[StreamChunk]:
    raise RuntimeError("model unavailable")
    yield StreamDelta(text="")  # unreachable; makes this an async generator


def _count(body: str, event: str) -> int:
    return body.count(f"event: {event}\n")


async def _prepare(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> tuple[str, list[dict[str, str]]]:
    monkeypatch.setattr(
        claude_service, "generate_outline", AsyncMock(return_value=_outline_result())
    )
    client_id = (await client.post("/api/v1/clients", json={"name": "Acme"})).json()[
        "id"
    ]
    gen_id = (
        await client.post(
            "/api/v1/generations",
            json={
                "client_id": client_id,
                "content_type": "blog",
                "primary_keyword": "plumbing",
                "secondary_keywords": [],
                "search_intent": "commercial",
                "competitor_urls": [],
                "target_word_count": 800,
                "additional_context": "",
            },
        )
    ).json()["id"]
    sections = (
        await client.post(f"/api/v1/generations/{gen_id}/outline")
    ).json()
    return str(gen_id), sections


async def test_sequential_stream_emits_section_events(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    gen_id, _ = await _prepare(auth_client, monkeypatch)
    monkeypatch.setattr(claude_service, "stream_content", _ok_stream)

    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/content/stream", json={"mode": "sequential"}
    )
    assert response.status_code == 200
    body = response.text
    assert _count(body, "section_start") == 2
    assert _count(body, "delta") == 4
    assert _count(body, "section_complete") == 2
    assert _count(body, "generation_complete") == 1


async def test_single_call_stream_emits_one_section(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    gen_id, _ = await _prepare(auth_client, monkeypatch)
    monkeypatch.setattr(claude_service, "stream_content", _ok_stream)

    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/content/stream", json={"mode": "single_call"}
    )
    body = response.text
    assert _count(body, "section_start") == 1
    assert _count(body, "section_complete") == 1
    assert _count(body, "generation_complete") == 1


async def test_failed_section_auto_retries_then_errors(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    gen_id, _ = await _prepare(auth_client, monkeypatch)
    monkeypatch.setattr(claude_service, "stream_content", _failing_stream)

    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/content/stream", json={"mode": "sequential"}
    )
    body = response.text
    assert _count(body, "section_start") == 4  # two attempts per section
    assert _count(body, "error") == 2
    assert _count(body, "section_complete") == 0


async def test_retry_section_streams_one_section(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    gen_id, sections = await _prepare(auth_client, monkeypatch)
    monkeypatch.setattr(claude_service, "stream_content", _ok_stream)

    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/content/retry-section",
        json={"section_id": sections[0]["section_id"]},
    )
    assert response.status_code == 200
    assert _count(response.text, "section_complete") == 1


async def test_stream_requires_an_outline(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    client_id = (await auth_client.post("/api/v1/clients", json={"name": "X"})).json()[
        "id"
    ]
    gen_id = (
        await auth_client.post(
            "/api/v1/generations",
            json={
                "client_id": client_id,
                "content_type": "blog",
                "primary_keyword": "keyword",
                "search_intent": "commercial",
                "target_word_count": 500,
            },
        )
    ).json()["id"]
    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/content/stream", json={"mode": "sequential"}
    )
    assert response.status_code == 400
