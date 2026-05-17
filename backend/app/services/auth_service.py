"""Google OAuth — authorization URL, token exchange, user upsert, refresh.

See architecture-design.md §6.4.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlencode

import httpx
import jwt
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import security
from app.config import settings
from app.models import User

log = structlog.get_logger()

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
SCOPES = "openid email profile https://www.googleapis.com/auth/drive.file"

_ACCESS_TOKEN_REFRESH_MARGIN = timedelta(seconds=60)


@dataclass
class GoogleAuthResult:
    email: str
    name: str | None
    picture: str | None
    access_token: str
    refresh_token: str | None
    access_token_expires_at: datetime


def build_authorization_url(state: str) -> str:
    """Construct the Google OAuth consent URL (offline access, forced consent)."""
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def email_in_allowed_domain(email: str) -> bool:
    return email.lower().endswith("@" + settings.allowed_email_domain.lower())


async def _verify_id_token(id_token: str) -> dict[str, Any]:
    """Verify a Google ID token against Google's published signing keys."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(GOOGLE_CERTS_URL)
        resp.raise_for_status()
        jwks = resp.json()

    kid = jwt.get_unverified_header(id_token)["kid"]
    signing_key = next(
        key for key in jwt.PyJWKSet.from_dict(jwks).keys if key.key_id == kid
    )
    claims: dict[str, Any] = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=["RS256"],
        audience=settings.google_client_id,
    )
    if claims.get("iss") not in ("https://accounts.google.com", "accounts.google.com"):
        raise jwt.InvalidIssuerError("unexpected ID token issuer")
    return claims


async def exchange_code(code: str) -> GoogleAuthResult:
    """Exchange an OAuth authorization code for tokens and verified identity."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        resp.raise_for_status()
        token = resp.json()

    claims = await _verify_id_token(token["id_token"])
    expires_at = datetime.now(UTC) + timedelta(seconds=int(token.get("expires_in", 3600)))
    return GoogleAuthResult(
        email=claims["email"],
        name=claims.get("name"),
        picture=claims.get("picture"),
        access_token=token["access_token"],
        refresh_token=token.get("refresh_token"),
        access_token_expires_at=expires_at,
    )


async def upsert_user(db: AsyncSession, result: GoogleAuthResult) -> User:
    """Create or update the user row, storing Google tokens encrypted."""
    user = (
        await db.execute(select(User).where(User.email == result.email))
    ).scalar_one_or_none()
    if user is None:
        user = User(email=result.email)
        db.add(user)

    user.name = result.name
    user.picture_url = result.picture
    user.google_access_token = security.encrypt(result.access_token)
    user.google_access_token_expires_at = result.access_token_expires_at
    if result.refresh_token:
        user.google_refresh_token = security.encrypt(result.refresh_token)
    user.last_login_at = datetime.now(UTC)

    await db.flush()
    return user


async def get_google_access_token(db: AsyncSession, user: User) -> str:
    """Return a valid Google access token, refreshing it if near expiry."""
    expires_at = user.google_access_token_expires_at
    if (
        user.google_access_token is not None
        and expires_at is not None
        and expires_at > datetime.now(UTC) + _ACCESS_TOKEN_REFRESH_MARGIN
    ):
        return security.decrypt(user.google_access_token)

    if not user.google_refresh_token:
        raise RuntimeError("no Google refresh token on file for user")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "refresh_token": security.decrypt(user.google_refresh_token),
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        token = resp.json()

    access_token: str = token["access_token"]
    user.google_access_token = security.encrypt(access_token)
    user.google_access_token_expires_at = datetime.now(UTC) + timedelta(
        seconds=int(token.get("expires_in", 3600))
    )
    await db.flush()
    return access_token
