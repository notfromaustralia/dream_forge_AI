from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.llm import LLMService


class BaseAgent(ABC):
    agent_id: str = "base"

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.llm = LLMService()

    @abstractmethod
    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        ...

    def reasoning_step(self, thought: str, action: str, observation: str) -> dict[str, str]:
        return {"thought": thought, "action": action, "observation": observation}
