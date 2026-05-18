"""Google Docs export — HTML to a batchUpdate request sequence.

The HTML-to-Docs mapping is intentionally simple for v1: headings,
paragraphs, bold/italic/underline, links, and one level of bullet/ordered
lists. See architecture-design.md §10.
"""

import asyncio
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import structlog
from bs4 import BeautifulSoup
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from app.schemas.generation import ExportSectionInput

log = structlog.get_logger()

_CONTENT_TYPE_LABELS = {
    "service_page": "Service Page",
    "plp": "Product Listing Page",
    "pdp": "Product Detail Page",
    "blog": "Blog Post",
}
_DOC_MIME = "application/vnd.google-apps.document"


@dataclass
class TextRun:
    text: str
    bold: bool = False
    italic: bool = False
    underline: bool = False
    link: str | None = None


@dataclass
class Block:
    runs: list[TextRun]
    style: str = "NORMAL_TEXT"  # or HEADING_1..HEADING_4
    bullet: str | None = None  # None, "unordered", "ordered"


def doc_name(client_name: str, content_type: str, primary_keyword: str) -> str:
    label = _CONTENT_TYPE_LABELS.get(content_type, content_type)
    raw = f"{client_name} - {label} - {primary_keyword} - {datetime.now(UTC):%Y-%m-%d}"
    return re.sub(r'[\\/:*?"<>|]', "-", raw).strip()


def _collect_runs(
    node: Any, bold: bool, italic: bool, underline: bool, link: str | None
) -> list[TextRun]:
    runs: list[TextRun] = []
    for child in node.children:
        name = getattr(child, "name", None)
        if name is None:
            text = str(child)
            if text:
                runs.append(
                    TextRun(text, bold=bold, italic=italic, underline=underline, link=link)
                )
            continue
        lower = name.lower()
        child_link = link
        if lower == "a":
            href = child.get("href")
            if isinstance(href, str):
                child_link = href
        runs.extend(
            _collect_runs(
                child,
                bold or lower in ("strong", "b"),
                italic or lower in ("em", "i"),
                underline or lower == "u",
                child_link,
            )
        )
    return runs


def _blocks_from_html(html: str) -> list[Block]:
    soup = BeautifulSoup(html, "html.parser")
    blocks: list[Block] = []
    for element in soup.find_all(recursive=False):
        name = element.name.lower()
        if name in ("h1", "h2", "h3", "h4"):
            blocks.append(Block(_collect_runs(element, False, False, False, None),
                                style=f"HEADING_{name[1]}"))
        elif name in ("ul", "ol"):
            bullet = "unordered" if name == "ul" else "ordered"
            for item in element.find_all("li", recursive=False):
                blocks.append(
                    Block(_collect_runs(item, False, False, False, None), bullet=bullet)
                )
        else:
            blocks.append(Block(_collect_runs(element, False, False, False, None)))
    return blocks


def parse_sections(sections: list[ExportSectionInput]) -> list[Block]:
    blocks: list[Block] = []
    for section in sections:
        if section.heading.strip():
            blocks.append(Block([TextRun(section.heading)], style="HEADING_1"))
        blocks.extend(_blocks_from_html(section.content_html))
    return blocks


def build_requests(blocks: list[Block]) -> list[dict[str, Any]]:
    """Translate parsed blocks into Google Docs batchUpdate requests."""
    inserts: list[dict[str, Any]] = []
    styles: list[dict[str, Any]] = []
    index = 1

    for block in blocks:
        block_start = index
        for run in block.runs:
            if not run.text:
                continue
            run_start = index
            inserts.append(
                {"insertText": {"location": {"index": index}, "text": run.text}}
            )
            index += len(run.text)
            text_style: dict[str, Any] = {}
            if run.bold:
                text_style["bold"] = True
            if run.italic:
                text_style["italic"] = True
            if run.underline:
                text_style["underline"] = True
            if run.link:
                text_style["link"] = {"url": run.link}
            if text_style:
                styles.append(
                    {
                        "updateTextStyle": {
                            "range": {"startIndex": run_start, "endIndex": index},
                            "textStyle": text_style,
                            "fields": ",".join(text_style.keys()),
                        }
                    }
                )

        inserts.append({"insertText": {"location": {"index": index}, "text": "\n"}})
        index += 1
        block_range = {"startIndex": block_start, "endIndex": index}

        if block.style != "NORMAL_TEXT":
            styles.append(
                {
                    "updateParagraphStyle": {
                        "range": block_range,
                        "paragraphStyle": {"namedStyleType": block.style},
                        "fields": "namedStyleType",
                    }
                }
            )
        if block.bullet:
            preset = (
                "BULLET_DISC_CIRCLE_SQUARE"
                if block.bullet == "unordered"
                else "NUMBERED_DECIMAL_ALPHA_ROMAN"
            )
            styles.append(
                {"createParagraphBullets": {"range": block_range, "bulletPreset": preset}}
            )

    return inserts + styles


def _sync_export(access_token: str, name: str, blocks: list[Block]) -> str:
    credentials = Credentials(token=access_token)
    drive = build("drive", "v3", credentials=credentials)
    docs = build("docs", "v1", credentials=credentials)

    created = (
        drive.files()
        .create(body={"name": name, "mimeType": _DOC_MIME}, fields="id")
        .execute()
    )
    document_id: str = created["id"]

    requests = build_requests(blocks)
    if requests:
        docs.documents().batchUpdate(
            documentId=document_id, body={"requests": requests}
        ).execute()
    return document_id


async def export_to_doc(
    access_token: str, name: str, sections: list[ExportSectionInput]
) -> str:
    """Create a Google Doc from the sections and return its URL."""
    blocks = parse_sections(sections)
    document_id = await asyncio.to_thread(_sync_export, access_token, name, blocks)
    return f"https://docs.google.com/document/d/{document_id}/edit"
