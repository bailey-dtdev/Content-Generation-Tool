"""Anthropic SDK wrapper.

A single AsyncAnthropic client serves the process: a non-streaming outline
call and a streaming content call. See architecture-design.md §6.5.
"""

import json
import re
from collections.abc import AsyncIterator
from typing import Any, Literal

from anthropic import AsyncAnthropic
from anthropic.types import TextBlock
from pydantic import BaseModel

from app.config import settings

client = AsyncAnthropic(api_key=settings.anthropic_api_key)

_OUTLINE_MAX_TOKENS = 4096
_CONTENT_MAX_TOKENS = 8192


class TokenUsage(BaseModel):
    input_tokens: int
    output_tokens: int


class OutlineSectionDraft(BaseModel):
    heading: str
    blurb: str


class OutlineResult(BaseModel):
    sections: list[OutlineSectionDraft]
    usage: TokenUsage


class StreamDelta(BaseModel):
    kind: Literal["delta"] = "delta"
    text: str


class StreamDone(BaseModel):
    kind: Literal["done"] = "done"
    usage: TokenUsage


StreamChunk = StreamDelta | StreamDone


def extract_json_array(text: str) -> list[Any]:
    """Pull the first JSON array out of a model response, tolerating stray prose."""
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match is None:
        raise ValueError("no JSON array found in the model response")
    parsed = json.loads(match.group(0))
    if not isinstance(parsed, list):
        raise ValueError("expected a JSON array in the model response")
    return parsed


async def generate_outline(prompt: str, model: str) -> OutlineResult:
    """Run the non-streaming outline call and parse it into sections."""
    message = await client.messages.create(
        model=model,
        max_tokens=_OUTLINE_MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    text = "".join(
        block.text for block in message.content if isinstance(block, TextBlock)
    )
    sections = [OutlineSectionDraft(**item) for item in extract_json_array(text)]
    return OutlineResult(
        sections=sections,
        usage=TokenUsage(
            input_tokens=message.usage.input_tokens,
            output_tokens=message.usage.output_tokens,
        ),
    )


async def stream_content(
    prompt: str, model: str, max_tokens: int = _CONTENT_MAX_TOKENS
) -> AsyncIterator[StreamChunk]:
    """Stream a Claude completion as text deltas, ending with token usage.

    On client disconnect the async generator is cancelled; the `async with`
    closes the HTTP connection to Anthropic, halting token consumption
    (architecture-design.md §6.5.4).
    """
    async with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for delta in stream.text_stream:
            yield StreamDelta(text=delta)
        final = await stream.get_final_message()
        yield StreamDone(
            usage=TokenUsage(
                input_tokens=final.usage.input_tokens,
                output_tokens=final.usage.output_tokens,
            )
        )

