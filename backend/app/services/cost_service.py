"""Token-to-cost calculation from model_rates.yaml. See architecture-design.md §6.11."""

from decimal import Decimal
from pathlib import Path
from typing import Any

import yaml

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
