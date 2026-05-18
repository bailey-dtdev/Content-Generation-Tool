"""HTML-to-Google-Docs request conversion."""

from app.schemas.generation import ExportSectionInput
from app.services import export_service


def _section(content_html: str, heading: str = "") -> list[ExportSectionInput]:
    return [
        ExportSectionInput(section_id="s1", heading=heading, content_html=content_html)
    ]


def test_doc_name_format_and_sanitisation() -> None:
    name = export_service.doc_name("Acme/Co", "service_page", "emergency plumbing")
    assert "Acme-Co" in name  # the slash is sanitised
    assert "Service Page" in name
    assert "emergency plumbing" in name
    assert "/" not in name


def test_heading_and_bold_run_produce_style_requests() -> None:
    blocks = export_service.parse_sections(
        _section("<p>Hello <strong>world</strong>.</p>", heading="Intro")
    )
    requests = export_service.build_requests(blocks)

    inserts = [r for r in requests if "insertText" in r]
    assert any(r["insertText"]["text"] == "Intro" for r in inserts)
    assert any("updateParagraphStyle" in r for r in requests)
    assert any(
        "updateTextStyle" in r and r["updateTextStyle"]["textStyle"].get("bold")
        for r in requests
    )


def test_lists_produce_bullet_requests() -> None:
    requests = export_service.build_requests(
        export_service.parse_sections(_section("<ul><li>One</li><li>Two</li></ul>"))
    )
    assert any("createParagraphBullets" in r for r in requests)


def test_links_produce_link_text_style() -> None:
    requests = export_service.build_requests(
        export_service.parse_sections(
            _section('<p><a href="https://x.example">link</a></p>')
        )
    )
    assert any(
        "updateTextStyle" in r and "link" in r["updateTextStyle"]["textStyle"]
        for r in requests
    )


def test_insertion_indices_are_monotonic() -> None:
    requests = export_service.build_requests(
        export_service.parse_sections(_section("<p>One</p><p>Two</p>", heading="H"))
    )
    indices = [
        r["insertText"]["location"]["index"] for r in requests if "insertText" in r
    ]
    assert indices == sorted(indices)
    assert indices[0] == 1
