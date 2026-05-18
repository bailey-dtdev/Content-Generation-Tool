"""Sentry initialisation — inert when SENTRY_DSN is unset.

See architecture-design.md §13.2.
"""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from app.config import settings


def init() -> None:
    if not settings.sentry_dsn:
        return
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.0,
        environment="production",
    )
