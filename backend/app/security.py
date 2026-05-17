"""Session JWTs and Fernet encryption for tokens at rest.

See architecture-design.md §6.4 and §14.
"""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from cryptography.fernet import Fernet

from app.config import settings

_ALGORITHM = "HS256"
_fernet = Fernet(settings.fernet_key)


def create_session_token(user_id: UUID) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(days=settings.jwt_expiry_days),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGORITHM)


def verify_session_token(token: str) -> UUID:
    """Return the user id from a valid token. Raises jwt.PyJWTError if invalid."""
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[_ALGORITHM])
    return UUID(payload["sub"])


def encrypt(value: str) -> str:
    return _fernet.encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet.decrypt(token.encode()).decode()
