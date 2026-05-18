"""Generation flow routes — create, outline, content streaming, abort.

Covers scope §10 steps 1-5. See architecture-design.md §6.5, §6.7, §6.8, §9.
"""

import json
import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Annotated, Any

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import Client, Generation, Sitemap, UsageRecord, User
from app.schemas.generation import (
    ContentStreamRequest,
    GenerationInput,
    GenerationResponse,
    OutlineSection,
    OutlineUpdate,
    RetrySectionRequest,
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


log = structlog.get_logger()


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _content_prompt(
    generation: Generation, client: Client, section: dict[str, Any] | None
) -> str:
    data = generation.input
    return render_prompt(
        f"content_{generation.content_type}",
        client=_client_context(client),
        primary_keyword=data["primary_keyword"],
        secondary_keywords=data["secondary_keywords"],
        search_intent=data["search_intent"],
        target_word_count=data["target_word_count"],
        additional_context=data["additional_context"],
        competitor_summary=generation.competitor_summaries,
        relevant_sitemap_urls=generation.relevant_sitemap_urls,
        outline=generation.outline,
        section=section,
    )


def _record_content_usage(
    db: AsyncSession, generation: Generation, usage: claude_service.TokenUsage
) -> None:
    db.add(
        UsageRecord(
            generation_id=generation.id,
            user_id=generation.user_id,
            client_id=generation.client_id,
            stage="content",
            model=settings.model_generation,
            input_tokens=usage.input_tokens,
            output_tokens=usage.output_tokens,
            cost_usd=cost_for(
                settings.model_generation, usage.input_tokens, usage.output_tokens
            ),
        )
    )


async def _stream_unit(
    db: AsyncSession,
    generation: Generation,
    section_id: str,
    heading: str,
    prompt: str,
) -> AsyncIterator[str]:
    """Stream one content unit, auto-retrying once before emitting an error."""
    for attempt in (1, 2):
        yield _sse("section_start", {"section_id": section_id, "heading": heading})
        usage: claude_service.TokenUsage | None = None
        try:
            async for chunk in claude_service.stream_content(
                prompt, settings.model_generation
            ):
                if isinstance(chunk, claude_service.StreamDelta):
                    yield _sse("delta", {"section_id": section_id, "text": chunk.text})
                else:
                    usage = chunk.usage
        except Exception:
            log.warning(
                "content.section_failed", section_id=section_id, attempt=attempt
            )
            if attempt == 2:
                yield _sse(
                    "error",
                    {
                        "section_id": section_id,
                        "message": "section generation failed",
                        "retryable": True,
                    },
                )
            continue
        if usage is not None:
            _record_content_usage(db, generation, usage)
            await db.commit()
            yield _sse(
                "section_complete",
                {
                    "section_id": section_id,
                    "usage": {
                        "input_tokens": usage.input_tokens,
                        "output_tokens": usage.output_tokens,
                    },
                },
            )
        return


async def _content_event_stream(
    db: AsyncSession, generation: Generation, client: Client
) -> AsyncIterator[str]:
    outline: list[dict[str, Any]] = generation.outline or []

    if generation.mode == "sequential":
        for section in outline:
            prompt = _content_prompt(generation, client, section)
            async for event in _stream_unit(
                db, generation, str(section["section_id"]), section["heading"], prompt
            ):
                yield event
    else:
        prompt = _content_prompt(generation, client, None)
        async for event in _stream_unit(
            db, generation, str(uuid.uuid4()), "Full draft", prompt
        ):
            yield event

    generation.status = "awaiting_review"
    generation.completed_at = datetime.now(UTC)
    await db.commit()

    totals = (
        await db.execute(
            select(
                func.coalesce(func.sum(UsageRecord.input_tokens), 0),
                func.coalesce(func.sum(UsageRecord.output_tokens), 0),
                func.coalesce(func.sum(UsageRecord.cost_usd), 0),
            ).where(UsageRecord.generation_id == generation.id)
        )
    ).one()
    yield _sse(
        "generation_complete",
        {
            "total_usage": {
                "input_tokens": int(totals[0]),
                "output_tokens": int(totals[1]),
            },
            "total_cost_usd": str(totals[2]),
        },
    )


@router.post("/{generation_id}/content/stream")
async def stream_content(
    generation_id: uuid.UUID,
    payload: ContentStreamRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> StreamingResponse:
    generation = await _get_owned_generation(db, generation_id, user)
    if not generation.outline:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "no approved outline")
    client = await db.get(Client, generation.client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")
    generation.mode = payload.mode
    await db.commit()
    return StreamingResponse(
        _content_event_stream(db, generation, client),
        media_type="text/event-stream",
    )


@router.post("/{generation_id}/content/retry-section")
async def retry_section(
    generation_id: uuid.UUID,
    payload: RetrySectionRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> StreamingResponse:
    generation = await _get_owned_generation(db, generation_id, user)
    client = await db.get(Client, generation.client_id)
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")
    section = next(
        (
            item
            for item in (generation.outline or [])
            if str(item["section_id"]) == str(payload.section_id)
        ),
        None,
    )
    if section is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "section not in outline")
    prompt = _content_prompt(generation, client, section)
    target = section

    async def _one_section() -> AsyncIterator[str]:
        async for event in _stream_unit(
            db, generation, str(target["section_id"]), target["heading"], prompt
        ):
            yield event

    return StreamingResponse(_one_section(), media_type="text/event-stream")
