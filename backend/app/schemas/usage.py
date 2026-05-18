"""Usage and cost roll-up schemas. See architecture-design.md §6.11, §11."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class StageBreakdown(BaseModel):
    outline: Decimal = Decimal(0)
    content: Decimal = Decimal(0)
    qa: Decimal = Decimal(0)


class GenerationUsage(BaseModel):
    generation_id: UUID
    total_cost_usd: Decimal
    input_tokens: int
    output_tokens: int
    by_stage: StageBreakdown


class CumulativeUsage(BaseModel):
    total_cost_usd: Decimal
    input_tokens: int
    output_tokens: int


class ClientUsage(BaseModel):
    client_id: UUID
    client_name: str
    total_cost_usd: Decimal


class UserUsage(BaseModel):
    user_id: UUID
    email: str
    total_cost_usd: Decimal


class OrgUsage(BaseModel):
    total: CumulativeUsage
    by_client: list[ClientUsage]
    by_user: list[UserUsage]
