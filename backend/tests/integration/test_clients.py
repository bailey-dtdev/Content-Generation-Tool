"""Client registry CRUD."""

from httpx import ASGITransport, AsyncClient

from app.main import app

_NEW_CLIENT = {
    "name": "Acme Plumbing",
    "industry": "Trades",
    "language_variant": "en-AU",
    "banned_words": ["synergy"],
    "oxford_comma": False,
}


async def test_create_and_get_client(auth_client: AsyncClient) -> None:
    created = await auth_client.post("/api/v1/clients", json=_NEW_CLIENT)
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Acme Plumbing"
    assert body["banned_words"] == ["synergy"]
    assert body["oxford_comma"] is False

    fetched = await auth_client.get(f"/api/v1/clients/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == body["id"]


async def test_list_clients(auth_client: AsyncClient) -> None:
    await auth_client.post("/api/v1/clients", json={"name": "Beta"})
    await auth_client.post("/api/v1/clients", json={"name": "Alpha"})
    listed = await auth_client.get("/api/v1/clients")
    assert listed.status_code == 200
    names = [c["name"] for c in listed.json()]
    assert names == ["Alpha", "Beta"]  # ordered by name


async def test_update_client(auth_client: AsyncClient) -> None:
    created = (await auth_client.post("/api/v1/clients", json=_NEW_CLIENT)).json()
    updated = await auth_client.put(
        f"/api/v1/clients/{created['id']}",
        json={**_NEW_CLIENT, "name": "Acme Renamed", "oxford_comma": True},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Acme Renamed"
    assert updated.json()["oxford_comma"] is True


async def test_delete_client(auth_client: AsyncClient) -> None:
    created = (await auth_client.post("/api/v1/clients", json=_NEW_CLIENT)).json()
    deleted = await auth_client.delete(f"/api/v1/clients/{created['id']}")
    assert deleted.status_code == 204
    assert (await auth_client.get(f"/api/v1/clients/{created['id']}")).status_code == 404


async def test_unknown_client_returns_404(auth_client: AsyncClient) -> None:
    missing = await auth_client.get(
        "/api/v1/clients/00000000-0000-0000-0000-000000000000"
    )
    assert missing.status_code == 404


async def test_clients_require_authentication(setup_database: None) -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="https://test") as client:
        resp = await client.get("/api/v1/clients")
    assert resp.status_code == 401
