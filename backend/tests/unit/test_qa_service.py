"""Rule-based QA checks."""

from typing import Any

from app.models import Client
from app.schemas.generation import QASectionInput
from app.services import qa_service


def _client(**overrides: Any) -> Client:
    defaults: dict[str, Any] = {
        "name": "Acme",
        "language_variant": "en-AU",
        "banned_words": ["synergy"],
        "approved_phrases": [],
        "sentence_length_preference": "short",
        "reading_level_target": None,
        "oxford_comma": True,
    }
    defaults.update(overrides)
    return Client(**defaults)


def _section(content: str) -> list[QASectionInput]:
    return [QASectionInput(section_id="s1", content=content)]


def test_banned_word_and_ai_tell_are_detected() -> None:
    notes = qa_service.run_rule_checks(
        _section("We delve into synergy every day."), _client(), "plumbing"
    )
    categories = {note.category for note in notes}
    assert "banned_word" in categories
    assert "ai_tell" in categories
    banned = next(n for n in notes if n.category == "banned_word")
    assert banned.span is not None


def test_language_variant_flags_us_spelling_for_au_client() -> None:
    notes = qa_service.run_rule_checks(
        _section("Our favorite color is blue."), _client(banned_words=[]), "x"
    )
    assert any(note.category == "language_variant" for note in notes)


def test_keyword_density_flagged_when_excessive() -> None:
    content = "plumbing " * 10 + "plus a little more filler text"
    notes = qa_service.run_rule_checks(
        _section(content), _client(banned_words=[]), "plumbing"
    )
    assert any(note.category == "keyword_density" for note in notes)


def test_clean_content_raises_no_word_level_notes() -> None:
    notes = qa_service.run_rule_checks(
        _section("Our team helps you. We respond fast."),
        _client(banned_words=[]),
        "team",
    )
    assert all(
        note.category not in ("banned_word", "ai_tell", "language_variant")
        for note in notes
    )
