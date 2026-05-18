"""Token cost calculation and usage roll-ups. See architecture-design.md §6.11."""

from decimal import Decimal
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UsageRecord

_RATES_PATH = (
    Path(__file__).resolve().parent.parent / "config_files" / "model_rates.yaml"
)


def _load_rates() -> dict[str, Any]:
    data = yaml.safe_load(_RATES_PATH.read_text(encoding="utf-8"))
    models: dict[str, Any] = data["models"]
    return models


MODEL_RATES = _load_rates()

_PER_MILLION = Decimal(1_000_000)


def cost_for(model: str, input_tokens: int, output_tokens: int) -> Decimal:
    """Return the USD cost of one Claude call. See architecture-design.md §6.11."""
    rates = MODEL_RATES[model]
    return (
        Decimal(input_tokens) / _PER_MILLION * Decimal(str(rates["input_per_mtok"]))
        + Decimal(output_tokens) / _PER_MILLION * Decimal(str(rates["output_per_mtok"]))
    )


async def cumulative_usage(
    db: AsyncSession, *conditions: Any
) -> tuple[Decimal, int, int]:
    """Sum cost and tokens across usage_records matching the given conditions."""
    row = (
        await db.execute(
            select(
                func.coalesce(func.sum(UsageRecord.cost_usd), 0),
                func.coalesce(func.sum(UsageRecord.input_tokens), 0),
                func.coalesce(func.sum(UsageRecord.output_tokens), 0),
            ).where(*conditions)
        )
    ).one()
    return Decimal(str(row[0])), int(row[1]), int(row[2])
