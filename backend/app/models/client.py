"""Client model — identity, brand voice, audience, style rules. See arch §8.2."""

import uuid

from sqlalchemy import ARRAY, Boolean, ForeignKey, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import UUIDAuditBase


class Client(UUIDAuditBase):
    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(Text, nullable=False)
    industry: Mapped[str | None] = mapped_column(Text)
    website_url: Mapped[str | None] = mapped_column(Text)
    brand_voice: Mapped[str | None] = mapped_column(Text)
    audience: Mapped[str | None] = mapped_column(Text)
    eeat_signals: Mapped[str | None] = mapped_column(Text)
    language_variant: Mapped[str] = mapped_column(
        Text, nullable=False, server_default="en-AU"
    )
    reading_level_target: Mapped[str | None] = mapped_column(Text)
    sentence_length_preference: Mapped[str | None] = mapped_column(Text)
    banned_words: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'")
    )
    approved_phrases: Mapped[list[str]] = mapped_column(
        ARRAY(Text), nullable=False, server_default=text("'{}'")
    )
    oxford_comma: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("true")
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
