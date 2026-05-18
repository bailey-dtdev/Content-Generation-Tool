"""Generation and UsageRecord models.

`Generation` carries per-piece metadata and the status state machine; a
partial unique index enforces one active generation per user (arch §6.8).
`UsageRecord` logs per-Claude-call token counts and cost. Generated content
itself is never stored. See arch §8.4, §8.5.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import UUIDAuditBase, UUIDBase


class Generation(UUIDAuditBase):
    __tablename__ = "generations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="RESTRICT"),
        nullable=False,
    )
    content_type: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    mode: Mapped[str | None] = mapped_column(Text)
    input: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    competitor_summaries: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)
    relevant_sitemap_urls: Mapped[list[Any] | None] = mapped_column(JSONB)
    outline: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB)
    exported_doc_url: Mapped[str | None] = mapped_column(Text)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index(
            "one_active_generation_per_user",
            "user_id",
            unique=True,
            postgresql_where=text("status = 'in_progress'"),
        ),
    )


class UsageRecord(UUIDBase):
    __tablename__ = "usage_records"

    generation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("generations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clients.id", ondelete="RESTRICT"),
        nullable=False,
    )
    stage: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str] = mapped_column(Text, nullable=False)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_usd: Mapped[Decimal] = mapped_column(Numeric(10, 6), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_usage_records_user_id", "user_id"),
        Index("ix_usage_records_client_id", "client_id"),
        Index("ix_usage_records_generation_id", "generation_id"),
        Index("ix_usage_records_created_at", "created_at"),
    )
