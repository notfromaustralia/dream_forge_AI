import json
from typing import Any

import httpx

from app.config import get_settings
from app.demo.responses import get_demo_response

settings = get_settings()


class LLMService:
    async def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format: dict | None = None,
        demo_key: str | None = None,
    ) -> str:
        if settings.is_demo and demo_key:
            return get_demo_response(demo_key, user_prompt)

        api_key = settings.llm_api_key
        if not api_key:
            if demo_key:
                return get_demo_response(demo_key, user_prompt)
            return json.dumps({"error": "No API key configured", "content": user_prompt})

        body: dict[str, Any] = {
            "model": settings.ai_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.8,
        }
        if response_format:
            body["response_format"] = response_format

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.openai_base_url}/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def complete_json(
        self,
        system_prompt: str,
        user_prompt: str,
        demo_key: str | None = None,
    ) -> dict[str, Any]:
        raw = await self.complete(
            system_prompt,
            user_prompt,
            response_format={"type": "json_object"},
            demo_key=demo_key,
        )
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {"raw": raw}
