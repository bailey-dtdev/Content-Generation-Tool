"""The one-active-generation-per-user concurrency lock (arch §6.8)."""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Client, Generation, User


async def _seed_user_and_client(session: AsyncSession) -> tuple[User, Client]:
    user = User(email="user@digitaltreasury.com.au")
    session.add(user)
    await session.flush()
    client = Client(name="Acme", created_by=user.id)
    session.add(client)
    await session.flush()
    return user, client


def _generation(user: User, client: Client, status: str) -> Generation:
    return Generation(
        user_id=user.id,
        client_id=client.id,
        content_type="blog",
        status=status,
        input={},
    )


async def test_rejects_second_in_progress_generation(db_session: AsyncSession) -> None:
    user, client = await _seed_user_and_client(db_session)

    db_session.add(_generation(user, client, "in_progress"))
    await db_session.flush()

    db_session.add(_generation(user, client, "in_progress"))
    with pytest.raises(IntegrityError):
        await db_session.flush()


async def test_allows_multiple_non_active_generations(db_session: AsyncSession) -> None:
    user, client = await _seed_user_and_client(db_session)

    db_session.add(_generation(user, client, "draft"))
    db_session.add(_generation(user, client, "draft"))
    db_session.add(_generation(user, client, "exported"))
    await db_session.flush()
