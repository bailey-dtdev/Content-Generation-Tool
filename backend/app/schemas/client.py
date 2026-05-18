"""Client and sitemap API schemas. See architecture-design.md §8.2, §8.3."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClientBase(BaseModel):
    name: str
    industry: str | None = None
    website_url: str | None = None
    brand_voice: str | None = None
    audience: str | None = None
    eeat_signals: str | None = None
    language_variant: str = "en-AU"
    reading_level_target: str | None = None
    sentence_length_preference: str | None = None
    banned_words: list[str] = Field(default_factory=list)
    approved_phrases: list[str] = Field(default_factory=list)
    oxford_comma: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientResponse(ClientBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class SitemapURL(BaseModel):
    url: str
    title: str | None = None


class SitemapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    source_type: str
    urls: list[SitemapURL]
    uploaded_at: datetime
