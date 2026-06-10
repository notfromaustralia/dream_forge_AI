"""LLM client for DreamForge.

Single source for OpenAI-compatible chat completions, JSON-mode requests, and
error reporting. Keeps prompts and schemas elsewhere; this module only handles
transport, retries, and parsing.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger("dreamforge.llm")

settings = get_settings()


class LLMError(Exception):
    """Raised when the LLM request itself fails (HTTP, timeout, missing key)."""


class LLMJSONError(Exception):
    """Raised when the LLM returns content that can't be parsed as JSON."""


class LLMService:
    """Thin async client around an OpenAI-compatible chat completions endpoint."""

    async def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        max_tokens: int | None = None,
        temperature: float = 0.7,
        **_legacy: Any,
    ) -> dict[str, Any]:
        """Call the LLM and parse a JSON object response.

        Raises LLMError on transport failure and LLMJSONError on parse failure.
        Callers should catch these explicitly rather than swallowing them.
        """
        api_key = settings.llm_api_key
        if not api_key:
            raise LLMError("No LLM API key configured (set GITHUB_TOKEN or OPENAI_API_KEY)")

        body: dict[str, Any] = {
            "model": settings.ai_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"},
            "max_tokens": max_tokens or settings.llm_max_tokens,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{settings.openai_base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
        except httpx.HTTPError as exc:
            raise LLMError(f"LLM transport error: {exc}") from exc

        if resp.status_code != 200:
            raise LLMError(f"LLM returned {resp.status_code}: {resp.text[:300]}")

        try:
            payload = resp.json()
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, json.JSONDecodeError) as exc:
            raise LLMError(f"LLM response malformed: {exc}") from exc

        try:
            data = json.loads(content)
        except json.JSONDecodeError as exc:
            raise LLMJSONError(f"LLM content not valid JSON: {content[:300]}") from exc

        if not isinstance(data, dict):
            raise LLMJSONError(f"LLM returned non-object JSON: {type(data).__name__}")

        return data
