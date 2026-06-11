import json
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents import CharacterAgent, ConsistencyAgent, LoreAgent, NarrativeAgent
from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import (
    Character,
    Event,
    Faction,
    GraphEdge,
    Location,
    MagicSystem,
    Religion,
    Story,
    TimelineEntry,
    Universe,
    User,
)
from app.engines.graph import GraphEngine
from app.evaluation.scorer import EvaluationScorer
from app.orchestrator.workflow import Orchestrator
from app.schemas.universe import (
    ContextResponse,
    CouncilDebateRequest,
    EntityCounts,
    EvaluationScoresResponse,
    ExpandLoreRequest,
    ExpandStoryRequest,
    GenerateCharacterRequest,
    GenerateDialogueRequest,
    GenerateLoreRequest,
    GenerateQuestRequest,
    GenreSuggestRequest,
    GenreSuggestResponse,
    TagsSuggestResponse,
    GraphEdgeCreate,
    GraphResponse,
    SearchRequest,
    SearchResponse,
    SearchResult,
    TimelineEntryResponse,
    TimelineStateResponse,
    UniverseGenerateRequest,
    UniverseListResponse,
    UniverseResponse,
    UniverseUpdate,
)
from app.services.embeddings import EmbeddingService
from app.services.suggester import suggest_genre as suggest_genre_service
from app.services.suggester import suggest_universe_tags

# Genres mirror the buttons in frontend/app/universe/new/page.tsx
SUPPORTED_GENRES = ["fantasy", "sci-fi", "cyberpunk", "horror", "solarpunk", "dark fantasy"]

router = APIRouter(prefix="/universes", tags=["universes"])


async def _entity_counts(db: AsyncSession, universe_id: str) -> EntityCounts:
    async def count(model) -> int:
        r = await db.execute(select(func.count()).select_from(model).where(model.universe_id == universe_id))
        return r.scalar() or 0

    return EntityCounts(
        characters=await count(Character),
        locations=await count(Location),
        factions=await count(Faction),
        events=await count(Event),
        stories=await count(Story),
        religions=await count(Religion),
        magic_systems=await count(MagicSystem),
        graph_edges=await count(GraphEdge),
    )


def _universe_response(u: Universe, counts: EntityCounts | None = None) -> UniverseResponse:
    return UniverseResponse(
        id=u.id,
        name=u.name,
        genre=u.genre,
        style=u.style,
        audience=u.audience,
        prompt=u.prompt,
        overview=u.overview,
        status=u.status,
        creativity_score=u.creativity_score,
        consistency_score=u.consistency_score,
        completeness_score=u.completeness_score,
        wow_score=u.wow_score,
        created_at=u.created_at,
        entity_counts=counts,
    )


@router.get("", response_model=UniverseListResponse)
async def list_universes(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Universe).where(Universe.user_id == user.id).order_by(Universe.created_at.desc()))
    universes = result.scalars().all()
    items = []
    for u in universes:
        counts = await _entity_counts(db, u.id)
        items.append(_universe_response(u, counts))
    return UniverseListResponse(universes=items, total=len(items))


@router.post("/suggest-tags", response_model=TagsSuggestResponse)
async def suggest_tags(
    body: GenreSuggestRequest,
    user: User = Depends(get_current_user),
):
    result = await suggest_universe_tags(body.prompt)
    return TagsSuggestResponse(**result)


@router.post("/generate")
async def generate_universe(
    body: UniverseGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe_id = f"uni_{uuid.uuid4().hex[:12]}"
    name = body.prompt[:60] + ("..." if len(body.prompt) > 60 else "")
    universe = Universe(
        id=universe_id,
        user_id=user.id,
        name=name,
        genre=body.genre,
        style=body.style,
        audience=body.audience,
        prompt=body.prompt,
        status="generating",
    )
    db.add(universe)
    await db.commit()

    async def event_stream():
        orch = Orchestrator(db)
        context = body.model_dump()
        async for event in orch.run_generate_universe(universe_id, context):
            if event.get("event") == "workflow_complete":
                universe_obj = await db.get(Universe, universe_id)
                if universe_obj:
                    universe_obj.status = "active"
                    await db.commit()
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/{universe_id}", response_model=UniverseResponse)
async def get_universe(
    universe_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")
    counts = await _entity_counts(db, universe_id)
    return _universe_response(universe, counts)


@router.patch("/{universe_id}", response_model=UniverseResponse)
async def update_universe(
    universe_id: str,
    body: UniverseUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(universe, field, value)
    await db.commit()
    await db.refresh(universe)
    counts = await _entity_counts(db, universe_id)
    return _universe_response(universe, counts)


@router.delete("/{universe_id}")
async def delete_universe(
    universe_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")
    await db.delete(universe)
    await db.commit()
    return {"deleted": True}


@router.get("/{universe_id}/graph", response_model=GraphResponse)
async def get_graph(
    universe_id: str,
    era_year: int | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = GraphEngine(db)
    return await engine.get_graph(universe_id, era_year)


@router.post("/{universe_id}/graph/edges")
async def create_graph_edge(
    universe_id: str,
    body: GraphEdgeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    engine = GraphEngine(db)
    edge = await engine.create_edge(
        universe_id, body.source_type, body.source_id,
        body.target_type, body.target_id, body.relationship, body.strength,
    )
    return {"id": edge.id, "relationship": edge.rel_type}


@router.get("/{universe_id}/context", response_model=ContextResponse)
async def get_world_context(
    universe_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe:
        raise HTTPException(404, "Universe not found")

    async def fetch(model) -> list[dict]:
        rows = (await db.execute(select(model).where(model.universe_id == universe_id).limit(20))).scalars().all()
        return [{"id": r.id, "name": getattr(r, "name", getattr(r, "title", ""))} for r in rows]

    chars = (await db.execute(select(Character).where(Character.universe_id == universe_id).limit(20))).scalars().all()
    faction_rows = (
        await db.execute(select(Faction).where(Faction.universe_id == universe_id).limit(20))
    ).scalars().all()
    return ContextResponse(
        universe_id=universe_id,
        name=universe.name,
        overview=universe.overview,
        characters=[{"id": c.id, "name": c.name, "bio": c.bio[:200]} for c in chars],
        factions=[
            {
                "id": f.id,
                "name": f.name,
                "ideology": f.ideology[:200],
                "power_level": f.power_level,
                "territory": f.territory,
            }
            for f in faction_rows
        ],
        locations=await fetch(Location),
        events=[{"id": e.id, "title": e.title, "year": e.era_year} for e in (await db.execute(select(Event).where(Event.universe_id == universe_id).limit(20))).scalars().all()],
        stories=await fetch(Story),
        magic_systems=await fetch(MagicSystem),
        religions=await fetch(Religion),
    )


@router.post("/{universe_id}/search", response_model=SearchResponse)
async def search_lore(
    universe_id: str,
    body: SearchRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = EmbeddingService(db)
    results = await svc.search(universe_id, body.query, body.limit)
    return SearchResponse(
        results=[SearchResult(**r) for r in results],
        query=body.query,
    )


@router.get("/{universe_id}/timeline", response_model=list[TimelineEntryResponse])
async def get_timeline(
    universe_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entries = (await db.execute(
        select(TimelineEntry).where(TimelineEntry.universe_id == universe_id).order_by(TimelineEntry.era_year)
    )).scalars().all()
    return [TimelineEntryResponse.model_validate(e) for e in entries]


@router.get("/{universe_id}/timeline/at/{era_year}", response_model=TimelineStateResponse)
async def get_timeline_state(
    universe_id: str,
    era_year: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    def era_filter(items, start_attr="era_start", end_attr="era_end"):
        filtered = []
        for item in items:
            start = getattr(item, start_attr, 0)
            end = getattr(item, end_attr, None)
            if start <= era_year and (end is None or end >= era_year):
                filtered.append(item)
        return filtered

    chars = era_filter((await db.execute(select(Character).where(Character.universe_id == universe_id))).scalars().all())
    factions = era_filter((await db.execute(select(Faction).where(Faction.universe_id == universe_id))).scalars().all())
    locations = era_filter((await db.execute(select(Location).where(Location.universe_id == universe_id))).scalars().all())
    events = [e for e in (await db.execute(select(Event).where(Event.universe_id == universe_id))).scalars().all() if e.era_year <= era_year]

    return TimelineStateResponse(
        era_year=era_year,
        characters=[{"id": c.id, "name": c.name, "bio": c.bio[:150]} for c in chars],
        factions=[
            {
                "id": f.id,
                "name": f.name,
                "power": f.power_level,
                "ideology": f.ideology[:120],
                "territory": f.territory,
            }
            for f in factions
        ],
        locations=[{"id": loc.id, "name": loc.name} for loc in locations],
        events=[
            {
                "id": e.id,
                "title": e.title,
                "year": e.era_year,
                "description": e.description[:150],
            }
            for e in events
        ],
    )


@router.get("/{universe_id}/scores", response_model=EvaluationScoresResponse)
async def get_scores(
    universe_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe:
        raise HTTPException(404, "Universe not found")
    return EvaluationScoresResponse(
        consistency=universe.consistency_score,
        creativity=universe.creativity_score,
        completeness=universe.completeness_score,
        wow_factor=universe.wow_score,
    )


@router.post("/{universe_id}/scores/recalculate", response_model=EvaluationScoresResponse)
async def recalculate_scores(
    universe_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    scorer = EvaluationScorer(db)
    scores = await scorer.calculate(universe_id)
    return EvaluationScoresResponse(**scores)


@router.post("/{universe_id}/generate/lore")
async def generate_lore(
    universe_id: str,
    body: GenerateLoreRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")

    prompt = body.prompt or universe.prompt
    genre = body.genre or universe.genre

    from app.agents import LoreAgent

    agent = LoreAgent(db)
    result = await agent.run({
        "universe_id": universe_id,
        "prompt": prompt,
        "genre": genre,
        "detail_level": body.detail_level,
    })

    if result.get("overview"):
        universe.overview = result["overview"]
        if body.genre:
            universe.genre = body.genre
        await db.commit()

    counts = await _entity_counts(db, universe_id)
    return {**result, "entity_counts": counts.model_dump()}


@router.post("/{universe_id}/generate/world")
async def generate_world(
    universe_id: str,
    body: GenerateWorldRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")

    async def event_stream():
        orch = Orchestrator(db)
        context = {
            "prompt": body.prompt or universe.prompt,
            "genre": body.genre or universe.genre,
            "character_prompt": body.character_prompt,
            "quest_count": body.quest_count,
        }
        async for event in orch.run_populate_world(universe_id, context):
            universe_obj = await db.get(Universe, universe_id)
            if universe_obj:
                universe_obj.status = "active"
                await db.commit()
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/{universe_id}/generate/character")
async def generate_character(
    universe_id: str,
    body: GenerateCharacterRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent = CharacterAgent(db)
    result = await agent.run({"universe_id": universe_id, "prompt": body.prompt})
    return result


@router.post("/{universe_id}/generate/quest")
async def generate_quest(
    universe_id: str,
    body: GenerateQuestRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    parts: list[str] = []
    if body.faction_name:
        faction = (
            await db.execute(
                select(Faction).where(
                    Faction.universe_id == universe_id,
                    Faction.name == body.faction_name,
                )
            )
        ).scalars().first()
        if faction:
            parts.append(
                f"Focus on faction: {faction.name} ({faction.power_level}) — {faction.ideology}"
            )
        else:
            parts.append(f"Focus on faction: {body.faction_name}")
    if body.prompt:
        parts.append(body.prompt)
    if not parts:
        parts.append("Create a compelling side quest set in this universe.")
    prompt = " ".join(parts)
    agent = NarrativeAgent(db)
    result = await agent.run({"universe_id": universe_id, "intent": "quest", "prompt": prompt})
    return result


@router.post("/{universe_id}/generate/dialogue")
async def generate_dialogue(
    universe_id: str,
    body: GenerateDialogueRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chars = (await db.execute(select(Character).where(Character.id.in_(body.character_ids)))).scalars().all()
    names = [c.name for c in chars]
    agent = NarrativeAgent(db)
    result = await agent.run({
        "universe_id": universe_id,
        "intent": "dialogue",
        "prompt": f"Scene: {body.scene}. Characters: {', '.join(names)}",
    })
    return result


@router.post("/{universe_id}/expand/story")
async def expand_story(
    universe_id: str,
    body: ExpandStoryRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")
    agent = NarrativeAgent(db)
    result = await agent.run({"universe_id": universe_id, "intent": "expand_story", "prompt": body.prompt})
    return result


@router.post("/{universe_id}/expand/lore")
async def expand_lore(
    universe_id: str,
    body: ExpandLoreRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")
    agent = LoreAgent(db)
    result = await agent.run({
        "universe_id": universe_id,
        "prompt": body.prompt,
        "genre": universe.genre,
        "style": universe.style,
        "audience": universe.audience,
        "mode": "expand",
        "focus": body.focus,
    })
    return result


@router.post("/{universe_id}/validate")
async def validate_universe(
    universe_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent = ConsistencyAgent(db)
    return await agent.run({"universe_id": universe_id})


@router.post("/{universe_id}/council/debate")
async def council_debate(
    universe_id: str,
    body: CouncilDebateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    async def event_stream():
        orch = Orchestrator(db)
        async for event in orch.run_council_debate(universe_id, body.topic, body.context):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
