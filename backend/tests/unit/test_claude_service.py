"""JSON extraction from model responses."""

import pytest

from app.services.claude_service import extract_json_array


def test_extract_plain_json_array() -> None:
    assert extract_json_array('[{"heading": "H", "blurb": "B"}]') == [
        {"heading": "H", "blurb": "B"}
    ]


def test_extract_json_array_ignoring_surrounding_prose() -> None:
    text = 'Here is the outline:\n[{"heading": "H"}]\nLet me know!'
    assert extract_json_array(text) == [{"heading": "H"}]


def test_extract_raises_when_no_array_present() -> None:
    with pytest.raises(ValueError, match="no JSON array"):
        extract_json_array("there is no json here")
