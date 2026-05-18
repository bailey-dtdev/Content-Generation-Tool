"""Auth routes — Google SSO login, callback, current user, logout.

See architecture-design.md §6.4 and §9.
"""

import secrets
from typing import Annotated

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import SESSION_COOKIE, get_current_user
from app.models import User
from app.schemas.auth import UserResponse
from app.security import create_session_token
from app.services import auth_service

log = structlog.get_logger()
router = APIRouter(prefix="/auth", tags=["auth"])

_STATE_COOKIE = "oauth_state"
_STATE_COOKIE_MAX_AGE = 600


@router.get("/login")
async def login() -> RedirectResponse:
    state = secrets.token_urlsafe(32)
    response = RedirectResponse(auth_service.build_authorization_url(state))
    response.set_cookie(
        _STATE_COOKIE,
        state,
        max_age=_STATE_COOKIE_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="lax",
    )
    return response


@router.get("/callback")
async def callback(
    code: str,
    state: str,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RedirectResponse:
    expected_state = request.cookies.get(_STATE_COOKIE)
    if not expected_state or not secrets.compare_digest(expected_state, state):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid OAuth state")

    result = await auth_service.exchange_code(code)
    if not auth_service.email_in_allowed_domain(result.email):
        log.warning("auth.domain_rejected", domain=result.email.rsplit("@", 1)[-1])
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"only {settings.allowed_email_domain} accounts may sign in",
        )

    user = await auth_service.upsert_user(db, result)
    token = create_session_token(user.id)

    response = RedirectResponse(settings.frontend_origin)
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=settings.jwt_expiry_days * 24 * 3600,
        httponly=True,
        secure=True,
        samesite="lax",
    )
    response.delete_cookie(_STATE_COOKIE, httponly=True, secure=True, samesite="lax")
    return response


@router.get("/me", response_model=UserResponse)
async def me(user: Annotated[User, Depends(get_current_user)]) -> User:
    return user


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(SESSION_COOKIE, httponly=True, secure=True, samesite="lax")
    return {"status": "logged out"}
