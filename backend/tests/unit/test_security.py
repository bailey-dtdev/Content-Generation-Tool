import uuid

import jwt
import pytest

from app import security
from app.config import settings


def test_session_token_roundtrip() -> None:
    user_id = uuid.uuid4()
    token = security.create_session_token(user_id)
    assert security.verify_session_token(token) == user_id


def test_verify_rejects_tampered_token() -> None:
    token = security.create_session_token(uuid.uuid4())
    with pytest.raises(jwt.PyJWTError):
        security.verify_session_token(token + "x")


def test_verify_rejects_foreign_secret() -> None:
    forged = jwt.encode(
        {"sub": str(uuid.uuid4())},
        "a-completely-different-secret-key-of-sufficient-length",
        algorithm="HS256",
    )
    with pytest.raises(jwt.PyJWTError):
        security.verify_session_token(forged)


def test_verify_rejects_expired_token() -> None:
    expired = jwt.encode(
        {"sub": str(uuid.uuid4()), "exp": 1},
        settings.jwt_secret,
        algorithm="HS256",
    )
    with pytest.raises(jwt.ExpiredSignatureError):
        security.verify_session_token(expired)


def test_fernet_roundtrip_and_obfuscation() -> None:
    plaintext = "1//google-refresh-token"
    encrypted = security.encrypt(plaintext)
    assert encrypted != plaintext
    assert security.decrypt(encrypted) == plaintext
