"""Usage and cost roll-up routes. See architecture-design.md §9, §11."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import Client, UsageRecord, User
from app.schemas.usage import ClientUsage, CumulativeUsage, OrgUsage, UserUsage
from app.services.cost_service import cumulative_usage

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/me", response_model=CumulativeUsage)
async def my_usage(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> CumulativeUsage:
    cost, input_tokens, output_tokens = await cumulative_usage(
        db, UsageRecord.user_id == user.id
    )
    return CumulativeUsage(
        total_cost_usd=cost, input_tokens=input_tokens, output_tokens=output_tokens
    )


@router.get("/org", response_model=OrgUsage)
async def org_usage(
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
) -> OrgUsage:
    cost, input_tokens, output_tokens = await cumulative_usage(db)
    total = CumulativeUsage(
        total_cost_usd=cost, input_tokens=input_tokens, output_tokens=output_tokens
    )

    client_rows = (
        await db.execute(
            select(
                Client.id,
                Client.name,
                func.coalesce(func.sum(UsageRecord.cost_usd), 0),
            )
            .join(UsageRecord, UsageRecord.client_id == Client.id)
            .group_by(Client.id, Client.name)
            .order_by(func.sum(UsageRecord.cost_usd).desc())
        )
    ).all()
    by_client = [
        ClientUsage(client_id=row[0], client_name=row[1], total_cost_usd=row[2])
        for row in client_rows
    ]

    user_rows = (
        await db.execute(
            select(
                User.id,
                User.email,
                func.coalesce(func.sum(UsageRecord.cost_usd), 0),
            )
            .join(UsageRecord, UsageRecord.user_id == User.id)
            .group_by(User.id, User.email)
            .order_by(func.sum(UsageRecord.cost_usd).desc())
        )
    ).all()
    by_user = [
        UserUsage(user_id=row[0], email=row[1], total_cost_usd=row[2])
        for row in user_rows
    ]

    return OrgUsage(total=total, by_client=by_client, by_user=by_user)
