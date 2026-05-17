"""Integration test fixtures — a real database.

Requires a reachable Postgres at DATABASE_URL. `setup_database` builds a fresh
schema per test from the ORM metadata; `db_session` adds a session on top.
"""

from collections.abc import AsyncIterator

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal, engine
from app.models import Base


@pytest_asyncio.fixture
async def setup_database() -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Dispose so pooled connections don't outlive this test's event loop.
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(setup_database: None) -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        yield session
