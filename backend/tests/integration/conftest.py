"""Integration test fixtures — a real database session.

Each test gets a freshly created schema (built from the ORM metadata) and a
session, torn down afterwards. Requires a reachable Postgres at DATABASE_URL.
"""

from collections.abc import AsyncIterator

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal, engine
from app.models import Base


@pytest_asyncio.fixture
async def db_session() -> AsyncIterator[AsyncSession]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Dispose so pooled connections don't outlive this test's event loop.
    await engine.dispose()
