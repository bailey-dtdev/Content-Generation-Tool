"""FastAPI dependencies — the authenticated user from the session cookie.

See architecture-design.md §6.4.2.
"""

from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.security import verify_session_token

SESSION_COOKIE = "dt_session"


async def get_current_user(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "not authenticated")
    try:
        user_id = verify_session_token(token)
    except (jwt.PyJWTError, ValueError, KeyError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid session") from exc
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found")
    return user
