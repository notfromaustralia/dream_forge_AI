import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Character, Event, Faction, GraphEdge, Location, Story, Universe
from app.schemas.universe import GraphEdgeResponse, GraphNode, GraphResponse


class GraphEngine:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_graph(self, universe_id: str, era_year: int | None = None) -> GraphResponse:
        universe = await self.session.get(Universe, universe_id)
        if not universe:
            return GraphResponse(nodes=[], edges=[])

        nodes: list[GraphNode] = []
        node_ids: set[str] = set()

        def add_node(entity_id: str, entity_type: str, label: str, data: dict) -> None:
            nid = f"{entity_type}:{entity_id}"
            if nid not in node_ids:
                nodes.append(GraphNode(id=nid, type=entity_type, label=label, data=data))
                node_ids.add(nid)

        chars = (
            await self.session.execute(select(Character).where(Character.universe_id == universe_id))
        ).scalars().all()
        for c in chars:
            if era_year is not None and (c.era_start > era_year or (c.era_end and c.era_end < era_year)):
                continue
            add_node(c.id, "character", c.name, {"importance": c.story_importance, "bio": c.bio[:200]})

        factions = (
            await self.session.execute(select(Faction).where(Faction.universe_id == universe_id))
        ).scalars().all()
        for f in factions:
            if era_year is not None and (f.era_start > era_year or (f.era_end and f.era_end < era_year)):
                continue
            add_node(f.id, "faction", f.name, {"power": f.power_level, "ideology": f.ideology[:200]})

        locations = (
            await self.session.execute(select(Location).where(Location.universe_id == universe_id))
        ).scalars().all()
        for loc in locations:
            if era_year is not None and (loc.era_start > era_year or (loc.era_end and loc.era_end < era_year)):
                continue
            add_node(loc.id, "location", loc.name, {"type": loc.location_type})

        events = (
            await self.session.execute(select(Event).where(Event.universe_id == universe_id))
        ).scalars().all()
        for e in events:
            if era_year is not None and e.era_year > era_year:
                continue
            add_node(e.id, "event", e.title, {"year": e.era_year, "type": e.event_type})

        stories = (
            await self.session.execute(select(Story).where(Story.universe_id == universe_id))
        ).scalars().all()
        for s in stories:
            add_node(s.id, "story", s.title, {"arc": s.arc_type})

        edges_result = await self.session.execute(
            select(GraphEdge).where(GraphEdge.universe_id == universe_id)
        )
        edges: list[GraphEdgeResponse] = []
        for edge in edges_result.scalars().all():
            src = f"{edge.source_type}:{edge.source_id}"
            tgt = f"{edge.target_type}:{edge.target_id}"
            if src in node_ids and tgt in node_ids:
                edges.append(
                    GraphEdgeResponse(
                        id=edge.id,
                        source=src,
                        target=tgt,
                        label=edge.rel_type,
                        strength=edge.strength,
                    )
                )

        return GraphResponse(nodes=nodes, edges=edges)

    async def create_edge(
        self,
        universe_id: str,
        source_type: str,
        source_id: str,
        target_type: str,
        target_id: str,
        rel_type: str,
        strength: float = 0.5,
        metadata_json: str = "{}",
    ) -> GraphEdge:
        edge = GraphEdge(
            id=f"edge_{uuid.uuid4().hex[:12]}",
            universe_id=universe_id,
            source_type=source_type,
            source_id=source_id,
            target_type=target_type,
            target_id=target_id,
            rel_type=rel_type,
            strength=strength,
            metadata_json=metadata_json,
        )
        self.session.add(edge)
        await self.session.commit()
        await self.session.refresh(edge)
        return edge

    async def auto_link_character(
        self,
        universe_id: str,
        character_id: str,
        faction_id: str | None,
        location_id: str | None,
    ) -> None:
        if faction_id:
            await self.create_edge(
                universe_id, "character", character_id, "faction", faction_id, "member_of", 0.8
            )
        if location_id:
            await self.create_edge(
                universe_id, "character", character_id, "location", location_id, "born_in", 0.6
            )
