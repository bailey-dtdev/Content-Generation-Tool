"""Shared pytest fixtures and test environment.

Required settings env vars are set here before any `app` module import, so
`app.config.settings` constructs cleanly under test. See architecture-design.md
§3 (Testing).
"""

import os

_TEST_ENV = {
    "DATABASE_URL": "postgresql+asyncpg://postgres:postgres@localhost:5432/content_gen_test",
    "ANTHROPIC_API_KEY": "test-anthropic-key",
    "GOOGLE_CLIENT_ID": "test-client-id",
    "GOOGLE_CLIENT_SECRET": "test-client-secret",
    "GOOGLE_REDIRECT_URI": "http://localhost:8000/api/v1/auth/callback",
    "JWT_SECRET": "test-jwt-secret-at-least-32-bytes-long",
    "FERNET_KEY": "dGVzdC1mZXJuZXQta2V5LTMyLWJ5dGVzLWxvbmchIQ==",
    "FRONTEND_ORIGIN": "http://localhost:5173",
}

for _key, _value in _TEST_ENV.items():
    os.environ.setdefault(_key, _value)
