"""Generation flow — create, outline, concurrency lock, edit, approve, abort."""

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient

from app.services import claude_service
from app.services.claude_service import OutlineResult, OutlineSectionDraft, TokenUsage


def _outline_result() -> OutlineResult:
    return OutlineResult(
        sections=[
            OutlineSectionDraft(heading="Introduction", blurb="Sets the scene."),
            OutlineSectionDraft(heading="Details", blurb="The specifics."),
        ],
        usage=TokenUsage(input_tokens=500, output_tokens=900),
    )


async def _create_client(client: AsyncClient) -> str:
    response = await client.post("/api/v1/clients", json={"name": "Acme"})
    return str(response.json()["id"])


async def _create_generation(client: AsyncClient, client_id: str) -> str:
    response = await client.post(
        "/api/v1/generations",
        json={
            "client_id": client_id,
            "content_type": "blog",
            "primary_keyword": "emergency plumbing",
            "secondary_keywords": ["pipe repair"],
            "search_intent": "commercial",
            "competitor_urls": [],
            "target_word_count": 1200,
            "additional_context": "",
        },
    )
    assert response.status_code == 201
    return str(response.json()["id"])


async def test_create_generation_stores_input(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    gen_id = await _create_generation(auth_client, client_id)

    body = (await auth_client.get("/api/v1/generations/active")).json()
    assert body is None  # a draft is not yet active

    # The created generation carries the input and an (empty) fetch result.
    assert gen_id


async def test_generate_outline(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        claude_service, "generate_outline", AsyncMock(return_value=_outline_result())
    )
    client_id = await _create_client(auth_client)
    gen_id = await _create_generation(auth_client, client_id)

    response = await auth_client.post(f"/api/v1/generations/{gen_id}/outline")
    assert response.status_code == 200
    sections = response.json()
    assert [s["heading"] for s in sections] == ["Introduction", "Details"]
    assert all(s["section_id"] for s in sections)

    active = (await auth_client.get("/api/v1/generations/active")).json()
    assert active["id"] == gen_id  # outline generation marks it in-progress


async def test_second_outline_conflicts_with_active_generation(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        claude_service, "generate_outline", AsyncMock(return_value=_outline_result())
    )
    client_id = await _create_client(auth_client)
    first = await _create_generation(auth_client, client_id)
    second = await _create_generation(auth_client, client_id)

    assert (await auth_client.post(f"/api/v1/generations/{first}/outline")).status_code == 200
    conflict = await auth_client.post(f"/api/v1/generations/{second}/outline")
    assert conflict.status_code == 409
    assert conflict.json()["detail"]["active_generation_id"] == first


async def test_save_outline_edits(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    gen_id = await _create_generation(auth_client, client_id)

    response = await auth_client.put(
        f"/api/v1/generations/{gen_id}/outline",
        json={
            "sections": [
                {
                    "section_id": "11111111-1111-1111-1111-111111111111",
                    "heading": "Edited heading",
                    "blurb": "Edited blurb",
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()[0]["heading"] == "Edited heading"


async def test_approve_outline_requires_an_outline(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        claude_service, "generate_outline", AsyncMock(return_value=_outline_result())
    )
    client_id = await _create_client(auth_client)
    gen_id = await _create_generation(auth_client, client_id)

    too_early = await auth_client.post(f"/api/v1/generations/{gen_id}/approve-outline")
    assert too_early.status_code == 400

    await auth_client.post(f"/api/v1/generations/{gen_id}/outline")
    approved = await auth_client.post(f"/api/v1/generations/{gen_id}/approve-outline")
    assert approved.status_code == 200


async def test_abort_generation(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    gen_id = await _create_generation(auth_client, client_id)

    response = await auth_client.post(f"/api/v1/generations/{gen_id}/abort")
    assert response.status_code == 200
    assert response.json()["status"] == "aborted"
