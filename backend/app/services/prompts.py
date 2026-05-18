"""Prompt template loading and rendering.

Prompts are markdown files with YAML frontmatter in app/prompts/. The body is
a Jinja2 template. See architecture-design.md §6.6.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import frontmatter
import jinja2

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"

_jinja_env = jinja2.Environment(autoescape=False, trim_blocks=True, lstrip_blocks=True)


@dataclass
class PromptTemplate:
    id: str
    meta: dict[str, Any]
    body: str


def load_prompt(prompt_id: str) -> PromptTemplate:
    path = PROMPTS_DIR / f"{prompt_id}.md"
    if not path.is_file():
        raise FileNotFoundError(f"unknown prompt: {prompt_id}")
    post = frontmatter.loads(path.read_text(encoding="utf-8"))
    return PromptTemplate(id=prompt_id, meta=dict(post.metadata), body=post.content)


def render_prompt(prompt_id: str, **variables: Any) -> str:
    template = load_prompt(prompt_id)
    return _jinja_env.from_string(template.body).render(**variables)
