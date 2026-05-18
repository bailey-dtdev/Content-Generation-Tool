"""QA endpoint — rule notes plus a non-fatal LLM review."""

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient

from app.services import claude_service
from app.services.claude_service import QAReviewResult, TokenUsage


async def _setup(client: AsyncClient) -> str:
    client_id = (
        await client.post(
            "/api/v1/clients", json={"name": "Acme", "banned_words": ["synergy"]}
        )
    ).json()["id"]
    gen_id = (
        await client.post(
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
    return str(gen_id)


async def test_qa_returns_rule_and_llm_notes(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    gen_id = await _setup(auth_client)
    monkeypatch.setattr(
        claude_service,
        "review_content",
        AsyncMock(
            return_value=QAReviewResult(
                notes=[
                    {
                        "severity": "warning",
                        "category": "brand_voice",
                        "message": "Tone drifts formal.",
                        "section_id": "s1",
                    }
                ],
                usage=TokenUsage(input_tokens=60, output_tokens=90),
            )
        ),
    )

    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/qa",
        json={"sections": [{"section_id": "s1", "content": "We delve into synergy."}]},
    )
    assert response.status_code == 200
    categories = {note["category"] for note in response.json()["notes"]}
    assert "banned_word" in categories  # rule-based
    assert "ai_tell" in categories  # rule-based
    assert "brand_voice" in categories  # from the LLM


async def test_qa_llm_failure_is_non_fatal(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    gen_id = await _setup(auth_client)
    monkeypatch.setattr(
        claude_service,
        "review_content",
        AsyncMock(side_effect=RuntimeError("model unavailable")),
    )

    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/qa",
        json={"sections": [{"section_id": "s1", "content": "We delve into synergy."}]},
    )
    assert response.status_code == 200
    notes = response.json()["notes"]
    assert notes  # rule-based notes still returned
    assert all(note["category"] != "brand_voice" for note in notes)
