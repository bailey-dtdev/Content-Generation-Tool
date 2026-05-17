"""Application settings — single source of configuration.

All config flows through the `Settings` model, populated from environment
variables. Importing this module instantiates `settings`, so a missing
required variable fails loudly at startup. See architecture-design.md §6.2.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    anthropic_api_key: str
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    jwt_secret: str
    jwt_expiry_days: int = 7
    fernet_key: str
    sentry_dsn: str | None = None
    allowed_email_domain: str = "digitaltreasury.com.au"
    frontend_origin: str
    model_generation: str = "claude-sonnet-4-6"
    model_qa: str = "claude-haiku-4-5-20251001"


settings = Settings()
