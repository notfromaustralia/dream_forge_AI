"""LLM-powered suggestions for universe-creation inputs.

Currently surfaces a single helper: pick the genre that best matches a
free-form world description. Designed so the LLM must pick from a known
list — keeps the rest of the UI's genre-dependent logic predictable.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.llm import LLMError, LLMJSONError, LLMService

logger = logging.getLogger("dreamforge.suggester")


def _normalize_genre(picked: Any, allowed: list[str], fallback: str) -> str:
    if not isinstance(picked, str):
        return fallback
    picked_norm = picked.strip().lower()
    for g in allowed:
        if g.lower() == picked_norm:
            return g
    # Allow partial match so "dark fantasy" inside "dark-fantasy thriller" still resolves.
    for g in allowed:
        if g.lower() in picked_norm or picked_norm in g.lower():
            return g
    return fallback


async def suggest_genre(prompt: str, allowed_genres: list[str]) -> dict[str, Any]:
    """Pick the best-matching genre from `allowed_genres` for a world description.

    Falls back to a neutral default if the LLM is unavailable so the universe
    creation flow never blocks on this.
    """
    if not prompt.strip():
        return {
            "genre": allowed_genres[0],
            "reasoning": "No description provided yet.",
            "alternatives": [],
        }

    fallback = allowed_genres[0]
    genres_csv = ", ".join(allowed_genres)
    system_prompt = (
        "You are a genre classifier for a worldbuilding tool. "
        "Pick the SINGLE best-matching genre from the provided list for the user's world description. "
        "Return ONLY a JSON object with this shape:\n"
        '{"genre": "<one of the allowed genres>", '
        '"reasoning": "<one sentence why this genre fits>", '
        '"alternatives": ["<up to 2 other plausible genres from the list>"]}'
    )
    user_prompt = (
        f"Allowed genres: {genres_csv}\n"
        f"World description:\n{prompt.strip()[:1200]}"
    )

    try:
        raw = await LLMService().complete_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=200,
            temperature=0.2,
        )
    except (LLMError, LLMJSONError) as exc:
        logger.warning("suggest_genre LLM call failed: %s", exc)
        return {
            "genre": fallback,
            "reasoning": f"Suggestion unavailable ({exc.__class__.__name__}); defaulted to {fallback}.",
            "alternatives": [],
        }

    picked = _normalize_genre(raw.get("genre"), allowed_genres, fallback)
    reasoning = raw.get("reasoning") if isinstance(raw.get("reasoning"), str) else ""

    alt_raw = raw.get("alternatives") if isinstance(raw.get("alternatives"), list) else []
    alternatives: list[str] = []
    for alt in alt_raw:
        normalized = _normalize_genre(alt, allowed_genres, "")
        if normalized and normalized != picked and normalized not in alternatives:
            alternatives.append(normalized)

    return {
        "genre": picked,
        "reasoning": reasoning,
        "alternatives": alternatives[:2],
    }
