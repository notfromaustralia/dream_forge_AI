import json
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents import (
    CharacterAgent,
    ConsistencyAgent,
    LoreAgent,
    NarrativeAgent,
    PlannerAgent,
)
from app.db.models import AgentTrace, Universe, WorkflowRun
from app.evaluation.scorer import EvaluationScorer

AGENT_MAP = {
    "lore": LoreAgent,
    "characters": CharacterAgent,
    "character": CharacterAgent,
    "consistency": ConsistencyAgent,
    "narrative": NarrativeAgent,
}


class Orchestrator:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _trace(self, universe_id: str, run_id: str, agent_id: str, step: dict) -> None:
        trace = AgentTrace(
            id=f"trace_{uuid.uuid4().hex[:12]}",
            universe_id=universe_id,
            workflow_run_id=run_id,
            agent_id=agent_id,
            thought=step.get("thought", ""),
            action=step.get("action", ""),
            observation=step.get("observation", ""),
        )
        self.session.add(trace)
        await self.session.commit()

    async def run_generate_universe(
        self, universe_id: str, context: dict[str, Any]
    ) -> AsyncGenerator[dict, None]:
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        wf = WorkflowRun(
            id=run_id,
            universe_id=universe_id,
            intent="generate_universe",
            status="running",
            input_json=json.dumps(context),
        )
        self.session.add(wf)
        await self.session.commit()

        yield {"event": "workflow_started", "run_id": run_id, "universe_id": universe_id, "intent": "generate_universe"}

        planner = PlannerAgent(self.session)
        plan = await planner.run({**context, "intent": "generate_universe"})
        yield {"event": "plan_created", "steps": plan["steps"]}
        await self._trace(universe_id, run_id, "planner", plan["reasoning"])

        for step in plan["steps"]:
            agent_cls = AGENT_MAP.get(step)
            if not agent_cls:
                continue
            agent = agent_cls(self.session)
            yield {"event": "agent_started", "agent_id": agent.agent_id}
            result = await agent.run({**context, "universe_id": universe_id})
            if "reasoning" in result:
                await self._trace(universe_id, run_id, agent.agent_id, result["reasoning"])
            yield {"event": "agent_complete", "agent_id": agent.agent_id, "result": result}

            if step == "lore" and result.get("overview"):
                universe = await self.session.get(Universe, universe_id)
                if universe:
                    universe.overview = result["overview"]
                    await self.session.commit()

        scorer = EvaluationScorer(self.session)
        scores = await scorer.calculate(universe_id)
        yield {"event": "scores_calculated", "scores": scores}

        wf.status = "completed"
        wf.output_json = json.dumps({"scores": scores})
        await self.session.commit()
        yield {"event": "workflow_complete", "run_id": run_id, "universe_id": universe_id, "scores": scores}

    async def run_populate_world(
        self, universe_id: str, context: dict[str, Any]
    ) -> AsyncGenerator[dict, None]:
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        wf = WorkflowRun(
            id=run_id,
            universe_id=universe_id,
            intent="populate_world",
            status="running",
            input_json=json.dumps(context),
        )
        self.session.add(wf)
        await self.session.commit()

        yield {"event": "workflow_started", "run_id": run_id, "universe_id": universe_id, "intent": "populate_world"}

        planner = PlannerAgent(self.session)
        plan = await planner.run({**context, "intent": "populate_world"})
        yield {"event": "plan_created", "steps": plan["steps"]}
        await self._trace(universe_id, run_id, "planner", plan["reasoning"])

        quest_count = context.get("quest_count", 2)
        narrative_calls = 0

        for step in plan["steps"]:
            agent_cls = AGENT_MAP.get(step)
            if not agent_cls:
                continue
            agent = agent_cls(self.session)
            yield {"event": "agent_started", "agent_id": agent.agent_id}

            run_context = {**context, "universe_id": universe_id}
            if step == "characters":
                run_context["prompt"] = context.get(
                    "character_prompt",
                    context.get("prompt", "Create compelling characters for this world"),
                )
            elif step == "narrative":
                narrative_calls += 1
                run_context["intent"] = "quest"
                run_context["prompt"] = context.get(
                    "prompt",
                    f"Generate epic quest {narrative_calls} for this world",
                )

            result = await agent.run(run_context)
            if "reasoning" in result:
                await self._trace(universe_id, run_id, agent.agent_id, result["reasoning"])
            yield {"event": "agent_complete", "agent_id": agent.agent_id, "result": result}

            if step == "lore" and result.get("overview"):
                universe = await self.session.get(Universe, universe_id)
                if universe:
                    universe.overview = result["overview"]
                    if context.get("genre"):
                        universe.genre = context["genre"]
                    await self.session.commit()

        scorer = EvaluationScorer(self.session)
        scores = await scorer.calculate(universe_id)
        yield {"event": "scores_calculated", "scores": scores}

        wf.status = "completed"
        wf.output_json = json.dumps({"scores": scores})
        await self.session.commit()
        yield {"event": "workflow_complete", "run_id": run_id, "universe_id": universe_id, "scores": scores}

    async def run_council_debate(
        self, universe_id: str, topic: str, context_str: str = ""
    ) -> AsyncGenerator[dict, None]:
        run_id = f"run_{uuid.uuid4().hex[:12]}"
        yield {"event": "council_started", "run_id": run_id, "topic": topic}

        agents = [CharacterAgent, NarrativeAgent, ConsistencyAgent]
        debate_results = []

        for agent_cls in agents:
            agent = agent_cls(self.session)
            yield {"event": "agent_speaking", "agent_id": agent.agent_id}

            if agent.agent_id == "consistency":
                result = await agent.run({"universe_id": universe_id})
            elif agent.agent_id == "character":
                result = await agent.run({
                    "universe_id": universe_id,
                    "prompt": f"Council debate topic: {topic}. {context_str}",
                })
            else:
                result = await agent.run({
                    "universe_id": universe_id,
                    "intent": "story",
                    "prompt": f"Council debate topic: {topic}. {context_str}",
                })

            stance = result.get("reasoning", {})
            debate_entry = {
                "agent": agent.agent_id,
                "stance": stance.get("action", "Analysis complete"),
                "reasoning": stance.get("thought", ""),
            }
            debate_results.append(debate_entry)
            await self._trace(universe_id, run_id, agent.agent_id, stance)
            yield {"event": "agent_argument", **debate_entry}

        from app.demo.responses import DEMO_RESPONSES
        consensus = DEMO_RESPONSES["council"]["consensus"]
        yield {"event": "council_consensus", "consensus": consensus, "debate": debate_results}
        yield {"event": "council_complete", "run_id": run_id}
