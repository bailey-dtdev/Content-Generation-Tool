"""FastAPI application — construction, middleware, lifespan, healthcheck.

Routers are mounted under /api/v1 as later phases implement them.
See architecture-design.md §6.1.
"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRoute

from app import logging as app_logging
from app import sentry
from app.config import settings
from app.db import engine
from app.routers import auth

sentry.init()
app_logging.configure()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    yield
    await engine.dispose()


def _operation_id(route: APIRoute) -> str:
    """Tag-prefixed operation IDs keep the generated frontend client tidy."""
    tag = route.tags[0] if route.tags else "default"
    return f"{tag}_{route.name}"


app = FastAPI(
    title="Content Generation Platform",
    lifespan=lifespan,
    generate_unique_id_function=_operation_id,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok", "git_sha": os.getenv("GIT_SHA", "unknown")}


app.include_router(auth.router, prefix="/api/v1")
