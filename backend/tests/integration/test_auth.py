"""Auth flow — login redirect, callback, domain restriction, session."""

from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlparse

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.db import AsyncSessionLocal
from app.main import app
from app.models import User
from app.services import auth_service
from app.services.auth_service import GoogleAuthResult


@pytest_asyncio.fixture
async def client(setup_database: None) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://test") as ac:
        yield ac


def _google_result(email: str) -> GoogleAuthResult:
    return GoogleAuthResult(
        email=email,
        name="Test User",
        picture="https://example.com/p.png",
        access_token="ya29.access-token",
        refresh_token="1//refresh-token",
        access_token_expires_at=datetime.now(UTC) + timedelta(hours=1),
    )


async def _login_and_get_state(client: AsyncClient) -> str:
    resp = await client.get("/api/v1/auth/login", follow_redirects=False)
    assert resp.status_code == 307
    return parse_qs(urlparse(resp.headers["location"]).query)["state"][0]


async def test_login_redirects_to_google(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/auth/login", follow_redirects=False)
    assert resp.status_code == 307
    assert resp.headers["location"].startswith(auth_service.GOOGLE_AUTH_URL)
    assert "oauth_state" in resp.cookies


async def test_callback_in_domain_creates_user_and_session(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    state = await _login_and_get_state(client)
    monkeypatch.setattr(
        auth_service,
        "exchange_code",
        AsyncMock(return_value=_google_result("person@digitaltreasury.com.au")),
    )

    resp = await client.get(
        f"/api/v1/auth/callback?code=abc&state={state}", follow_redirects=False
    )
    assert resp.status_code == 307
    assert "dt_session" in resp.cookies

    async with AsyncSessionLocal() as session:
        user = (
            await session.execute(
                select(User).where(User.email == "person@digitaltreasury.com.au")
            )
        ).scalar_one()
    assert user.google_refresh_token is not None
    assert user.google_refresh_token != "1//refresh-token"  # stored encrypted

    me = await client.get("/api/v1/auth/me")
    assert me.status_code == 200
    assert me.json()["email"] == "person@digitaltreasury.com.au"


async def test_callback_out_of_domain_is_forbidden_and_creates_no_user(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    state = await _login_and_get_state(client)
    monkeypatch.setattr(
        auth_service,
        "exchange_code",
        AsyncMock(return_value=_google_result("intruder@gmail.com")),
    )

    resp = await client.get(
        f"/api/v1/auth/callback?code=abc&state={state}", follow_redirects=False
    )
    assert resp.status_code == 403

    async with AsyncSessionLocal() as session:
        users = (await session.execute(select(User))).scalars().all()
    assert users == []


async def test_callback_rejects_mismatched_state(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    await _login_and_get_state(client)
    monkeypatch.setattr(auth_service, "exchange_code", AsyncMock())

    resp = await client.get(
        "/api/v1/auth/callback?code=abc&state=forged", follow_redirects=False
    )
    assert resp.status_code == 400
    auth_service.exchange_code.assert_not_awaited()  # type: ignore[attr-defined]


async def test_me_requires_authentication(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


async def test_logout_clears_session(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    state = await _login_and_get_state(client)
    monkeypatch.setattr(
        auth_service,
        "exchange_code",
        AsyncMock(return_value=_google_result("person@digitaltreasury.com.au")),
    )
    await client.get(f"/api/v1/auth/callback?code=abc&state={state}", follow_redirects=False)

    assert (await client.get("/api/v1/auth/me")).status_code == 200

    logout = await client.post("/api/v1/auth/logout")
    assert logout.status_code == 200
    assert (await client.get("/api/v1/auth/me")).status_code == 401
