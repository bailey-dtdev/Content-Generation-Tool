"""Integration test fixtures — a real database and an authenticated client.

Requires a reachable Postgres at DATABASE_URL. `setup_database` builds a fresh
schema per test; `db_session` adds a session; `auth_client` adds an HTTP client
carrying a valid session cookie.
"""

from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import AsyncSessionLocal, engine
from app.deps import SESSION_COOKIE
from app.main import app
from app.models import Base, User
from app.security import create_session_token


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


@pytest_asyncio.fixture
async def auth_client(setup_database: None) -> AsyncIterator[AsyncClient]:
    async with AsyncSessionLocal() as session:
        user = User(email="tester@digitaltreasury.com.au", name="Tester")
        session.add(user)
        await session.commit()
        user_id = user.id

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://test") as client:
        client.cookies.set(SESSION_COOKIE, create_session_token(user_id))
        yield client
