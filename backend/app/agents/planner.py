from typing import Any

from app.agents.base import BaseAgent


class PlannerAgent(BaseAgent):
    agent_id = "planner"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        intent = context.get("intent", "generate_universe")
        steps = {
            "generate_universe": ["lore", "characters", "consistency", "narrative"],
            "populate_world": ["lore", "characters", "narrative", "narrative", "consistency"],
            "expand_story": ["narrative", "consistency"],
            "generate_character": ["characters", "consistency"],
            "generate_quest": ["narrative", "consistency"],
            "council_debate": ["character", "narrative", "consistency"],
        }
        return {
            "intent": intent,
            "steps": steps.get(intent, ["lore"]),
            "reasoning": self.reasoning_step(
                f"Planning workflow for intent: {intent}",
                "Decompose into agent steps",
                f"Selected steps: {steps.get(intent, ['lore'])}",
            ),
        }
