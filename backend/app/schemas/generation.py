"""Generation flow API schemas. See architecture-design.md §8.4, §9."""

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

ContentType = Literal["service_page", "plp", "pdp", "blog"]
SearchIntent = Literal["informational", "commercial", "transactional", "navigational"]
GenerationMode = Literal["single_call", "sequential"]


class GenerationInput(BaseModel):
    client_id: uuid.UUID
    content_type: ContentType
    primary_keyword: str
    secondary_keywords: list[str] = Field(default_factory=list)
    search_intent: SearchIntent
    competitor_urls: list[str] = Field(default_factory=list)
    target_url: str | None = None
    target_word_count: int
    additional_context: str = ""


class OutlineSection(BaseModel):
    section_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    heading: str
    blurb: str


class OutlineUpdate(BaseModel):
    sections: list[OutlineSection]


class ContentStreamRequest(BaseModel):
    mode: GenerationMode


class RetrySectionRequest(BaseModel):
    section_id: uuid.UUID


class GenerationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    client_id: uuid.UUID
    content_type: str
    status: str
    mode: str | None
    input: dict[str, Any]
    competitor_summaries: list[dict[str, Any]] | None
    relevant_sitemap_urls: list[Any] | None
    outline: list[dict[str, Any]] | None
    created_at: datetime
    updated_at: datetime
