"""QA pass — rule-based checks plus an LLM review. See architecture-design.md §6.10."""

import re
from pathlib import Path
from typing import Any

import structlog
import yaml
from pydantic import ValidationError

from app.config import settings
from app.models import Client
from app.schemas.generation import QANote, QASectionInput, QASpan
from app.services import claude_service
from app.services.claude_service import TokenUsage
from app.services.prompts import render_prompt

log = structlog.get_logger()

_AI_TELLS_PATH = (
    Path(__file__).resolve().parent.parent / "config_files" / "ai_tells.yaml"
)
_AI_TELLS: list[str] = yaml.safe_load(_AI_TELLS_PATH.read_text(encoding="utf-8"))[
    "phrases"
]

# US spelling -> AU/UK spelling. Flagged one way or the other per client variant.
_US_TO_UK = {
    "organize": "organise",
    "organized": "organised",
    "organization": "organisation",
    "color": "colour",
    "colors": "colours",
    "favorite": "favourite",
    "center": "centre",
    "behavior": "behaviour",
    "analyze": "analyse",
    "catalog": "catalogue",
    "defense": "defence",
    "traveler": "traveller",
    "fulfill": "fulfil",
    "labor": "labour",
    "honor": "honour",
    "specialize": "specialise",
    "recognize": "recognise",
    "optimize": "optimise",
}

_SENTENCE_LENGTH_TARGETS = {"short": 14, "mixed": 20, "longer": 28}


def _find_substrings(
    section_id: str,
    text: str,
    terms: list[str],
    severity: Any,
    category: str,
    message: str,
) -> list[QANote]:
    notes: list[QANote] = []
    lowered = text.lower()
    for term in terms:
        needle = term.lower().strip()
        if not needle:
            continue
        start = lowered.find(needle)
        while start != -1:
            notes.append(
                QANote(
                    severity=severity,
                    category=category,
                    message=message.format(term=term),
                    section_id=section_id,
                    span=QASpan(start=start, end=start + len(needle)),
                )
            )
            start = lowered.find(needle, start + len(needle))
    return notes


def _check_language_variant(section_id: str, text: str, variant: str) -> list[QANote]:
    if variant == "en-US":
        pairs = [(uk, us) for us, uk in _US_TO_UK.items()]
    else:
        pairs = list(_US_TO_UK.items())
    notes: list[QANote] = []
    for wrong, right in pairs:
        for match in re.finditer(rf"\b{re.escape(wrong)}\b", text, re.IGNORECASE):
            notes.append(
                QANote(
                    severity="warning",
                    category="language_variant",
                    message=f"'{match.group()}' — {variant} prefers '{right}'.",
                    section_id=section_id,
                    span=QASpan(start=match.start(), end=match.end()),
                )
            )
    return notes


def _check_keyword_density(
    section_id: str, text: str, primary_keyword: str
) -> list[QANote]:
    words = text.split()
    if not words or not primary_keyword.strip():
        return []
    occurrences = len(re.findall(re.escape(primary_keyword), text, re.IGNORECASE))
    density = occurrences * len(primary_keyword.split()) / len(words)
    if density > 0.03:
        return [
            QANote(
                severity="warning",
                category="keyword_density",
                message=f"Primary keyword density is {density:.1%} (over 3%).",
                section_id=section_id,
            )
        ]
    if density < 0.003:
        return [
            QANote(
                severity="info",
                category="keyword_density",
                message=f"Primary keyword density is {density:.1%} (under 0.3%).",
                section_id=section_id,
            )
        ]
    return []


def _split_sentences(text: str) -> list[str]:
    return [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]


def _check_sentence_length(
    section_id: str, text: str, preference: str | None
) -> list[QANote]:
    sentences = _split_sentences(text)
    if not sentences:
        return []
    mean = sum(len(s.split()) for s in sentences) / len(sentences)
    target = _SENTENCE_LENGTH_TARGETS.get(preference or "mixed", 20)
    if mean > target:
        return [
            QANote(
                severity="info",
                category="sentence_length",
                message=f"Mean sentence length is {mean:.0f} words (target ≤ {target}).",
                section_id=section_id,
            )
        ]
    return []


def _syllables(word: str) -> int:
    return max(1, len(re.findall(r"[aeiouy]+", word.lower())))


def _parse_grade(target: str) -> float | None:
    numbers = [int(n) for n in re.findall(r"\d+", target)]
    return sum(numbers) / len(numbers) if numbers else None


def _check_reading_level(
    section_id: str, text: str, target: str | None
) -> list[QANote]:
    if not target:
        return []
    target_grade = _parse_grade(target)
    if target_grade is None:
        return []
    words = re.findall(r"[A-Za-z]+", text)
    sentences = _split_sentences(text)
    if len(words) < 10 or not sentences:
        return []
    syllables = sum(_syllables(word) for word in words)
    grade = (
        0.39 * (len(words) / len(sentences))
        + 11.8 * (syllables / len(words))
        - 15.59
    )
    if abs(grade - target_grade) > 2:
        return [
            QANote(
                severity="info",
                category="reading_level",
                message=(
                    f"Estimated reading level is grade {grade:.0f} "
                    f"(target ≈ {target_grade:.0f})."
                ),
                section_id=section_id,
            )
        ]
    return []


def run_rule_checks(
    sections: list[QASectionInput], client: Client, primary_keyword: str
) -> list[QANote]:
    notes: list[QANote] = []
    for section in sections:
        text = section.content
        sid = section.section_id
        notes += _find_substrings(
            sid, text, client.banned_words, "warning", "banned_word",
            "Banned term: '{term}'.",
        )
        notes += _find_substrings(
            sid, text, _AI_TELLS, "info", "ai_tell", "Possible AI tell: '{term}'.",
        )
        notes += _check_language_variant(sid, text, client.language_variant)
        notes += _check_keyword_density(sid, text, primary_keyword)
        notes += _check_sentence_length(sid, text, client.sentence_length_preference)
        notes += _check_reading_level(sid, text, client.reading_level_target)
    return notes


def _client_brief(client: Client) -> dict[str, Any]:
    return {
        "name": client.name,
        "industry": client.industry,
        "brand_voice": client.brand_voice,
        "audience": client.audience,
        "eeat_signals": client.eeat_signals,
        "language_variant": client.language_variant,
    }


async def run_llm_qa(
    sections: list[QASectionInput], client: Client, rule_notes: list[QANote]
) -> tuple[list[QANote], TokenUsage | None]:
    """Run the LLM QA review. Failure is non-fatal — returns no notes."""
    try:
        prompt = render_prompt(
            "qa_review",
            client=_client_brief(client),
            content_sections=[
                {"section_id": s.section_id, "content": s.content} for s in sections
            ],
            rule_based_findings=[note.model_dump() for note in rule_notes],
        )
        result = await claude_service.review_content(prompt, settings.model_qa)
    except Exception:
        log.warning("qa.llm_review_failed")
        return [], None

    notes: list[QANote] = []
    for raw in result.notes:
        try:
            notes.append(QANote.model_validate(raw))
        except ValidationError:
            continue
    return notes, result.usage
