"""LLM-powered suggestions for universe-creation inputs."""

from __future__ import annotations

import logging
from typing import Any

from app.services.llm import LLMError, LLMJSONError, LLMService

logger = logging.getLogger("dreamforge.suggester")


def _trim_tag(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()[:80]
    return fallback


def _alt_list(raw: Any, exclude: str) -> list[str]:
    if not isinstance(raw, list):
        return []
    out: list[str] = []
    for item in raw:
        tag = _trim_tag(item, "")
        if tag and tag.lower() != exclude.lower() and tag not in out:
            out.append(tag)
    return out[:3]


async def suggest_universe_tags(prompt: str) -> dict[str, Any]:
    """Generate free-form genre, style, and audience tags from a world description."""
    fallback = {
        "genre": "dark fantasy",
        "style": "epic",
        "audience": "general",
        "genre_alternatives": ["fantasy", "mythic horror"],
        "style_alternatives": ["gritty", "whimsical"],
        "reasoning": "Default tags applied.",
    }

    if not prompt.strip():
        return {**fallback, "reasoning": "No description provided yet."}

    system_prompt = (
        "You are a creative director for a worldbuilding tool. "
        "Given a world description, suggest genre, style, and audience tags. "
        "Tags should be 2-4 words each, creative and specific — NOT limited to common lists. "
        "Return ONLY JSON:\n"
        '{"genre": "<2-4 word genre>", "style": "<2-4 word tone/style>", '
        '"audience": "<general|young adult|mature|all ages>", '
        '"genre_alternatives": ["<alt1>", "<alt2>"], '
        '"style_alternatives": ["<alt1>", "<alt2>"], '
        '"reasoning": "<one sentence why these fit>"}'
    )
    user_prompt = f"World description:\n{prompt.strip()[:1200]}"

    try:
        raw = await LLMService().complete_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=300,
            temperature=0.4,
        )
    except (LLMError, LLMJSONError) as exc:
        logger.warning("suggest_universe_tags LLM call failed: %s", exc)
        return {
            **fallback,
            "reasoning": f"Suggestion unavailable ({exc.__class__.__name__}); using defaults.",
        }

    genre = _trim_tag(raw.get("genre"), fallback["genre"])
    style = _trim_tag(raw.get("style"), fallback["style"])
    audience = _trim_tag(raw.get("audience"), fallback["audience"])
    reasoning = raw.get("reasoning") if isinstance(raw.get("reasoning"), str) else ""

    return {
        "genre": genre,
        "style": style,
        "audience": audience,
        "genre_alternatives": _alt_list(raw.get("genre_alternatives"), genre),
        "style_alternatives": _alt_list(raw.get("style_alternatives"), style),
        "reasoning": reasoning,
    }


async def suggest_genre(prompt: str, allowed_genres: list[str]) -> dict[str, Any]:
    """Legacy genre classifier — kept for backward compatibility."""
    tags = await suggest_universe_tags(prompt)
    genre = tags["genre"]
    for g in allowed_genres:
        if g.lower() in genre.lower() or genre.lower() in g.lower():
            genre = g
            break
    return {
        "genre": genre,
        "reasoning": tags["reasoning"],
        "alternatives": tags["genre_alternatives"],
    }
