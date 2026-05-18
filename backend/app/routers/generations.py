"""Generation flow routes — create, outline, approve, abort.

Covers scope §10 steps 1-4. Content streaming and QA arrive in later phases.
See architecture-design.md §6.5, §6.8, §9.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import Client, Generation, Sitemap, UsageRecord, User
from app.schemas.generation import (
    GenerationInput,
    GenerationResponse,
    OutlineSection,
    OutlineUpdate,
)
from app.services import claude_service
from app.services.cost_service import cost_for
from app.services.fetcher import fetch_competitors, filter_sitemap
from app.services.prompts import render_prompt

router = APIRouter(prefix="/generations", tags=["generations"])


async def _get_owned_generation(
    db: AsyncSession, generation_id: uuid.UUID, user: User
) -> Generation:
    generation = await db.get(Generation, generation_id)
    if generation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "generation not found")
    if generation.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "not your generation")
    return generation


async def _ensure_no_other_active(
    db: AsyncSession, user: User, generation: Generation
) -> None:
    other = (
        await db.execute(
            select(Generation).where(
                Generation.user_id == user.id,
                Generation.status == "in_progress",
                Generation.id != generation.id,
            )
        )
    ).scalar_one_or_none()
    if other is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail={
                "message": "you already have an active generation",
                "active_generation_id": str(other.id),
            },
        )


def _client_context(client: Client) -> dict[str, object]:
    return {
        "name": client.name,
        "industry": client.industry,
        "brand_voice": client.brand_voice,
        "audience": client.audience,
        "eeat_signals": client.eeat_signals,
        "language_variant": client.language_variant,
        "reading_level_target": client.reading_level_target,
        "sentence_length_preference": client.sentence_length_preference,
        "banned_words": client.banned_words,
        "approved_phrases": client.approved_phrases,
        "oxford_comma": client.oxford_comma,
    }


async def _generate_and_store_outline(
    db: AsyncSession, generation: Generation
) -> list[OutlineSection]:
    client = await db.get(Client, generation.client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")

    data = generation.input
    prompt = render_prompt(
        f"outline_{generation.content_type}",
        client=_client_context(client),
        primary_keyword=data["primary_keyword"],
        secondary_keywords=data["secondary_keywords"],
        search_intent=data["search_intent"],
        target_word_count=data["target_word_count"],
        additional_context=data["additional_context"],
        competitor_summary=generation.competitor_summaries,
        relevant_sitemap_urls=generation.relevant_sitemap_urls,
    )
    result = await claude_service.generate_outline(prompt, settings.model_generation)
    sections = [
        OutlineSection(heading=draft.heading, blurb=draft.blurb)
        for draft in result.sections
    ]
    generation.outline = [section.model_dump(mode="json") for section in sections]
    db.add(
        UsageRecord(
            generation_id=generation.id,
            user_id=generation.user_id,
            client_id=generation.client_id,
            stage="outline",
            model=settings.model_generation,
            input_tokens=result.usage.input_tokens,
            output_tokens=result.usage.output_tokens,
            cost_usd=cost_for(
                settings.model_generation,
                result.usage.input_tokens,
                result.usage.output_tokens,
            ),
        )
    )
    await db.flush()
    return sections


@router.post("", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
async def create_generation(
    payload: GenerationInput,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Generation:
    client = await db.get(Client, payload.client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")

    generation = Generation(
        user_id=user.id,
        client_id=payload.client_id,
        content_type=payload.content_type,
        status="draft",
        input=payload.model_dump(mode="json"),
    )
    db.add(generation)
    await db.flush()

    competitors = await fetch_competitors(payload.competitor_urls)
    generation.competitor_summaries = [item.model_dump() for item in competitors]

    sitemap = (
        await db.execute(select(Sitemap).where(Sitemap.client_id == client.id))
    ).scalar_one_or_none()
    if sitemap is not None:
        keywords = [payload.primary_keyword, *payload.secondary_keywords]
        matches = filter_sitemap(sitemap.urls, keywords)
        generation.relevant_sitemap_urls = [match.model_dump() for match in matches]
    else:
        generation.relevant_sitemap_urls = []

    await db.flush()
    await db.refresh(generation)
    return generation


@router.get("/active", response_model=GenerationResponse | None)
async def get_active_generation(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Generation | None:
    return (
        await db.execute(
            select(Generation).where(
                Generation.user_id == user.id,
                Generation.status == "in_progress",
            )
        )
    ).scalar_one_or_none()


@router.post("/{generation_id}/outline", response_model=list[OutlineSection])
async def generate_outline(
    generation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[OutlineSection]:
    generation = await _get_owned_generation(db, generation_id, user)
    await _ensure_no_other_active(db, user, generation)
    generation.status = "in_progress"
    await db.flush()
    return await _generate_and_store_outline(db, generation)


@router.post("/{generation_id}/outline/regenerate", response_model=list[OutlineSection])
async def regenerate_outline(
    generation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[OutlineSection]:
    generation = await _get_owned_generation(db, generation_id, user)
    await _ensure_no_other_active(db, user, generation)
    generation.status = "in_progress"
    await db.flush()
    return await _generate_and_store_outline(db, generation)


@router.put("/{generation_id}/outline", response_model=list[OutlineSection])
async def save_outline(
    generation_id: uuid.UUID,
    payload: OutlineUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[OutlineSection]:
    generation = await _get_owned_generation(db, generation_id, user)
    generation.outline = [section.model_dump(mode="json") for section in payload.sections]
    await db.flush()
    return payload.sections


@router.post("/{generation_id}/approve-outline", response_model=GenerationResponse)
async def approve_outline(
    generation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Generation:
    generation = await _get_owned_generation(db, generation_id, user)
    if not generation.outline:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "no outline to approve")
    return generation


@router.post("/{generation_id}/abort", response_model=GenerationResponse)
async def abort_generation(
    generation_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> Generation:
    generation = await _get_owned_generation(db, generation_id, user)
    generation.status = "aborted"
    await db.flush()
    await db.refresh(generation)
    return generation
