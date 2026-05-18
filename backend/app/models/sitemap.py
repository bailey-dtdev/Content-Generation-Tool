"""Sitemap model — one per client, parsed URLs as JSONB. See arch §8.3."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import UUIDBase


class Sitemap(UUIDBase):
    __tablename__ = "sitemaps"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    source_type: Mapped[str] = mapped_column(Text, nullable=False)
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)
    urls: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
