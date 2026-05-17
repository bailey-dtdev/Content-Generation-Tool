import pytest
from pydantic import ValidationError
from pydantic_settings import SettingsConfigDict

from app.config import Settings, settings


def test_settings_load_from_env() -> None:
    assert settings.database_url
    assert settings.allowed_email_domain == "digitaltreasury.com.au"
    assert settings.jwt_expiry_days == 7


def test_missing_required_field_fails_loudly(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)

    class IsolatedSettings(Settings):
        model_config = SettingsConfigDict(env_file=None, extra="ignore")

    with pytest.raises(ValidationError):
        IsolatedSettings()
