"""Export endpoint — creates a Doc and records its URL."""

from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.db import AsyncSessionLocal
from app.models import Generation
from app.services import auth_service, export_service

_DOC_URL = "https://docs.google.com/document/d/abc123/edit"


async def _setup(client: AsyncClient) -> str:
    client_id = (
        await client.post("/api/v1/clients", json={"name": "Acme"})
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


async def test_export_creates_doc_and_records_url(
    auth_client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    gen_id = await _setup(auth_client)
    monkeypatch.setattr(
        auth_service, "get_google_access_token", AsyncMock(return_value="token")
    )
    monkeypatch.setattr(
        export_service, "export_to_doc", AsyncMock(return_value=_DOC_URL)
    )

    response = await auth_client.post(
        f"/api/v1/generations/{gen_id}/export",
        json={
            "sections": [
                {
                    "section_id": "s1",
                    "heading": "Intro",
                    "content_html": "<p>Hello</p>",
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["doc_url"] == _DOC_URL

    async with AsyncSessionLocal() as session:
        generation = (
            await session.execute(select(Generation).where(Generation.id == gen_id))
        ).scalar_one()
    assert generation.status == "exported"
    assert generation.exported_doc_url == _DOC_URL
