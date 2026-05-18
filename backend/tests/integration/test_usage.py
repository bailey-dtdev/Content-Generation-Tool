"""Usage and cost roll-up endpoints."""

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient

from app.services import claude_service
from app.services.claude_service import OutlineResult, OutlineSectionDraft, TokenUsage


def _outline_result() -> OutlineResult:
    return OutlineResult(
        sections=[OutlineSectionDraft(heading="Intro", blurb="Scene.")],
        usage=TokenUsage(input_tokens=1000, output_tokens=2000),
    )


async def test_usage_rollups_after_a_claude_call(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        claude_service, "generate_outline", AsyncMock(return_value=_outline_result())
    )
    client_id = (await auth_client.post("/api/v1/clients", json={"name": "Acme"})).json()[
        "id"
    ]
    gen_id = (
        await auth_client.post(
            "/api/v1/generations",
            json={
                "client_id": client_id,
                "content_type": "blog",
                "primary_keyword": "plumbing",
                "search_intent": "commercial",
                "target_word_count": 800,
            },
        )
    ).json()["id"]
    await auth_client.post(f"/api/v1/generations/{gen_id}/outline")

    per_generation = (
        await auth_client.get(f"/api/v1/generations/{gen_id}/usage")
    ).json()
    assert float(per_generation["total_cost_usd"]) > 0
    assert float(per_generation["by_stage"]["outline"]) > 0

    per_client = (await auth_client.get(f"/api/v1/clients/{client_id}/usage")).json()
    assert float(per_client["total_cost_usd"]) > 0

    mine = (await auth_client.get("/api/v1/usage/me")).json()
    assert float(mine["total_cost_usd"]) > 0

    org = (await auth_client.get("/api/v1/usage/org")).json()
    assert float(org["total"]["total_cost_usd"]) > 0
    assert len(org["by_client"]) == 1
    assert len(org["by_user"]) == 1


async def test_usage_is_zero_without_activity(auth_client: AsyncClient) -> None:
    response = await auth_client.get("/api/v1/usage/me")
    assert response.status_code == 200
    assert float(response.json()["total_cost_usd"]) == 0
