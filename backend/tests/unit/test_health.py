from fastapi.testclient import TestClient

from app.main import app


def test_healthz_returns_ok() -> None:
    with TestClient(app) as client:
        response = client.get("/healthz")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "git_sha" in body
