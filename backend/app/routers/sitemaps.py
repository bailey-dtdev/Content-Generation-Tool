"""Sitemap upload and read routes. See architecture-design.md §8.3, scope §7.4.

A client's sitemap is 1:1; uploading again replaces it. The upload accepts
either an XML sitemap file or a pasted newline-separated URL list.
"""

import uuid
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models import Client, Sitemap, User
from app.schemas.client import SitemapResponse

router = APIRouter(prefix="/clients/{client_id}/sitemap", tags=["sitemaps"])


def _parse_xml_sitemap(content: str) -> list[dict[str, str]]:
    # stdlib ET is acceptable here: uploads come from authenticated internal users.
    root = ET.fromstring(content)
    urls: list[dict[str, str]] = []
    for element in root.iter():
        tag = element.tag.rsplit("}", 1)[-1]
        if tag == "loc" and element.text and element.text.strip():
            urls.append({"url": element.text.strip()})
    return urls


def _parse_pasted_urls(content: str) -> list[dict[str, str]]:
    return [{"url": line.strip()} for line in content.splitlines() if line.strip()]


@router.post("", response_model=SitemapResponse)
async def upload_sitemap(
    client_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    file: Annotated[UploadFile | None, File()] = None,
    pasted_urls: Annotated[str | None, Form()] = None,
) -> Sitemap:
    if await db.get(Client, client_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "client not found")

    if file is not None:
        raw = (await file.read()).decode("utf-8", errors="replace")
        try:
            urls = _parse_xml_sitemap(raw)
        except ET.ParseError as exc:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "could not parse the XML sitemap"
            ) from exc
        source_type = "xml"
    elif pasted_urls and pasted_urls.strip():
        raw = pasted_urls
        urls = _parse_pasted_urls(raw)
        source_type = "pasted"
    else:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "provide an XML file or pasted URLs"
        )

    if not urls:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "no URLs found")

    sitemap = (
        await db.execute(select(Sitemap).where(Sitemap.client_id == client_id))
    ).scalar_one_or_none()
    if sitemap is None:
        sitemap = Sitemap(client_id=client_id)
        db.add(sitemap)
    sitemap.source_type = source_type
    sitemap.raw_content = raw
    sitemap.urls = urls
    sitemap.uploaded_at = datetime.now(UTC)
    sitemap.uploaded_by = user.id
    await db.flush()
    return sitemap


@router.get("", response_model=SitemapResponse)
async def get_sitemap(
    client_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    _user: Annotated[User, Depends(get_current_user)],
) -> Sitemap:
    sitemap = (
        await db.execute(select(Sitemap).where(Sitemap.client_id == client_id))
    ).scalar_one_or_none()
    if sitemap is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no sitemap for this client")
    return sitemap
