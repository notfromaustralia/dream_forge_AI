import hashlib
import json
import math

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import LoreEmbedding

settings = get_settings()


class EmbeddingService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def _demo_embedding(self, content: str) -> list[float]:
        h = hashlib.sha256(content.encode()).digest()
        vec = []
        for i in range(1536):
            byte_val = h[i % len(h)]
            vec.append((byte_val / 255.0) * 2 - 1)
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]

    def _cosine_similarity(self, a: list[float], b: list[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a)) or 1.0
        norm_b = math.sqrt(sum(x * x for x in b)) or 1.0
        return dot / (norm_a * norm_b)

    async def embed_text(self, content: str) -> list[float]:
        if settings.is_demo or not settings.llm_api_key:
            return self._demo_embedding(content)

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.openai_base_url}/embeddings",
                headers={"Authorization": f"Bearer {settings.llm_api_key}"},
                json={"model": "text-embedding-3-small", "input": content},
            )
            if resp.status_code == 200:
                return resp.json()["data"][0]["embedding"]
        return self._demo_embedding(content)

    async def store_embedding(
        self, universe_id: str, entity_type: str, entity_id: str, content: str
    ) -> None:
        embedding = await self.embed_text(content)
        row = LoreEmbedding(
            universe_id=universe_id,
            entity_type=entity_type,
            entity_id=entity_id,
            content=content,
            embedding_json=json.dumps(embedding),
        )
        self.session.add(row)
        await self.session.commit()

    async def search(
        self, universe_id: str, query: str, limit: int = 10
    ) -> list[dict]:
        query_vec = await self.embed_text(query)

        result = await self.session.execute(
            select(LoreEmbedding).where(LoreEmbedding.universe_id == universe_id)
        )
        rows = result.scalars().all()

        scored: list[dict] = []
        for row in rows:
            if query.lower() in row.content.lower():
                score = 0.9
            else:
                try:
                    stored = json.loads(row.embedding_json or "[]")
                    score = self._cosine_similarity(query_vec, stored)
                except json.JSONDecodeError:
                    score = 0.0
            scored.append({
                "entity_type": row.entity_type,
                "entity_id": row.entity_id,
                "content": row.content,
                "score": score,
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]
