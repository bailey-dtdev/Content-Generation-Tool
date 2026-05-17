# Multi-stage build: uv resolves the venv, a slim runtime carries it.
FROM python:3.12-slim AS builder

RUN pip install --no-cache-dir uv

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim AS runtime

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
