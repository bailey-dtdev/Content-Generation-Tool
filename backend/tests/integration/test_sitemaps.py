"""Sitemap upload (XML file and pasted URLs) and retrieval."""

from httpx import AsyncClient

_SITEMAP_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://acme.example/services</loc></url>
  <url><loc>https://acme.example/about</loc></url>
</urlset>
"""


async def _create_client(client: AsyncClient) -> str:
    created = await client.post("/api/v1/clients", json={"name": "Acme"})
    return str(created.json()["id"])


async def test_upload_xml_sitemap(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    resp = await auth_client.post(
        f"/api/v1/clients/{client_id}/sitemap",
        files={"file": ("sitemap.xml", _SITEMAP_XML, "application/xml")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["source_type"] == "xml"
    assert [u["url"] for u in body["urls"]] == [
        "https://acme.example/services",
        "https://acme.example/about",
    ]


async def test_upload_pasted_urls(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    resp = await auth_client.post(
        f"/api/v1/clients/{client_id}/sitemap",
        data={"pasted_urls": "https://acme.example/a\n\nhttps://acme.example/b\n"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["source_type"] == "pasted"
    assert len(body["urls"]) == 2


async def test_get_and_replace_sitemap(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    await auth_client.post(
        f"/api/v1/clients/{client_id}/sitemap",
        data={"pasted_urls": "https://acme.example/a"},
    )
    await auth_client.post(
        f"/api/v1/clients/{client_id}/sitemap",
        files={"file": ("sitemap.xml", _SITEMAP_XML, "application/xml")},
    )
    fetched = await auth_client.get(f"/api/v1/clients/{client_id}/sitemap")
    assert fetched.status_code == 200
    assert fetched.json()["source_type"] == "xml"  # replaced the pasted upload


async def test_get_missing_sitemap_returns_404(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    resp = await auth_client.get(f"/api/v1/clients/{client_id}/sitemap")
    assert resp.status_code == 404


async def test_upload_without_input_is_rejected(auth_client: AsyncClient) -> None:
    client_id = await _create_client(auth_client)
    resp = await auth_client.post(f"/api/v1/clients/{client_id}/sitemap", data={})
    assert resp.status_code == 400
