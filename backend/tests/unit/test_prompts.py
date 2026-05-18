"""Prompt template loading and rendering."""

import pytest

from app.services import prompts

_ALL_PROMPT_IDS = [
    "outline_service_page",
    "outline_plp",
    "outline_pdp",
    "outline_blog",
    "content_service_page",
    "content_plp",
    "content_pdp",
    "content_blog",
    "qa_review",
]


@pytest.mark.parametrize("prompt_id", _ALL_PROMPT_IDS)
def test_prompt_loads_with_frontmatter(prompt_id: str) -> None:
    template = prompts.load_prompt(prompt_id)
    assert template.meta["id"] == prompt_id
    assert isinstance(template.meta["variables"], list)
    assert template.body.strip()


def test_all_prompt_files_are_present() -> None:
    on_disk = {path.stem for path in prompts.PROMPTS_DIR.glob("*.md")}
    assert set(_ALL_PROMPT_IDS) <= on_disk


def test_render_substitutes_variables() -> None:
    rendered = prompts.render_prompt(
        "outline_service_page",
        client={"name": "Acme", "industry": "Trades"},
        primary_keyword="emergency plumbing",
        secondary_keywords=["pipe repair"],
        search_intent="commercial",
        target_word_count=1200,
        additional_context="24/7 service",
        competitor_summary="competitor data here",
        relevant_sitemap_urls=["/services"],
    )
    assert "Acme" in rendered
    assert "emergency plumbing" in rendered
    assert "{{" not in rendered


def test_unknown_prompt_raises() -> None:
    with pytest.raises(FileNotFoundError):
        prompts.load_prompt("does_not_exist")
