import uuid
from typing import Any

from app.agents.base import BaseAgent
from app.agents.story_normalize import normalize_story
from app.db.models import Story
from app.services.embeddings import EmbeddingService


class NarrativeAgent(BaseAgent):
    agent_id = "narrative"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        intent = context.get("intent", "story")
        prompt = context.get("prompt", "")

        demo_keys = {
            "story": "story",
            "quest": "quest",
            "dialogue": "dialogue",
            "expand_story": "story",
        }
        demo_key = demo_keys.get(intent, "story")

        data = await self.llm.complete_json(
            system_prompt="You are a master storyteller. Generate narrative content as JSON.",
            user_prompt=f"Intent: {intent}. {prompt}",
            demo_key=demo_key,
        )

        embed_svc = EmbeddingService(self.session)
        result: dict[str, Any] = {"data": data}

        if intent in ("story", "quest", "expand_story"):
            title, synopsis, content_json, arc_type = normalize_story(data, intent)
            story_id = f"story_{uuid.uuid4().hex[:12]}"
            story = Story(
                id=story_id,
                universe_id=universe_id,
                title=title,
                synopsis=synopsis,
                content_json=content_json,
                arc_type=arc_type,
                status="draft",
            )
            self.session.add(story)
            await self.session.commit()
            await embed_svc.store_embedding(
                universe_id, "story", story_id,
                f"{title}: {synopsis}",
            )
            result["story_id"] = story_id
            result["title"] = title

        result["reasoning"] = self.reasoning_step(
            f"Generating {intent} for {universe_id}",
            f"Created narrative content",
            f"Title: {result.get('title', data.get('title', 'N/A'))}",
        )
        return result
