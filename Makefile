.PHONY: up down logs migrate migration test lint gen-api

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f backend

migrate:
	docker compose exec backend alembic upgrade head

migration:
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

test:
	docker compose exec backend pytest

lint:
	docker compose exec backend ruff check app
	docker compose exec backend mypy app

# Regenerates the frontend OpenAPI client; wired up in Phase 4.
gen-api:
	curl -sf http://localhost:8000/openapi.json -o frontend/openapi.json
	cd frontend && pnpm gen:api
