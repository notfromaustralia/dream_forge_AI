from datetime import datetime

from pydantic import BaseModel, Field


class UniverseGenerateRequest(BaseModel):
    prompt: str
    genre: str = "fantasy"
    style: str = "epic"
    audience: str = "general"


class UniverseUpdate(BaseModel):
    name: str | None = None
    overview: str | None = None
    status: str | None = None
    genre: str | None = None
    style: str | None = None
    audience: str | None = None


class EntityCounts(BaseModel):
    characters: int = 0
    locations: int = 0
    factions: int = 0
    events: int = 0
    stories: int = 0
    religions: int = 0
    magic_systems: int = 0
    graph_edges: int = 0


class UniverseResponse(BaseModel):
    id: str
    name: str
    genre: str
    style: str
    audience: str
    prompt: str
    overview: str
    status: str
    creativity_score: float
    consistency_score: float
    completeness_score: float
    wow_score: float
    created_at: datetime | None = None
    entity_counts: EntityCounts | None = None

    model_config = {"from_attributes": True}


class UniverseListResponse(BaseModel):
    universes: list[UniverseResponse]
    total: int


class GraphNode(BaseModel):
    id: str
    type: str
    label: str
    data: dict = Field(default_factory=dict)


class GraphEdgeResponse(BaseModel):
    id: str
    source: str
    target: str
    label: str
    strength: float = 0.5


class GraphResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdgeResponse]


class SearchRequest(BaseModel):
    query: str
    limit: int = 10


class SearchResult(BaseModel):
    entity_type: str
    entity_id: str
    content: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]
    query: str


class ContextResponse(BaseModel):
    universe_id: str
    name: str
    overview: str
    characters: list[dict]
    factions: list[dict]
    locations: list[dict]
    events: list[dict]
    stories: list[dict]
    magic_systems: list[dict]
    religions: list[dict]


class TimelineEntryResponse(BaseModel):
    id: str
    era_year: int
    label: str
    snapshot_json: str

    model_config = {"from_attributes": True}


class TimelineStateResponse(BaseModel):
    era_year: int
    characters: list[dict]
    factions: list[dict]
    locations: list[dict]
    events: list[dict]


class EvaluationScoresResponse(BaseModel):
    consistency: float
    creativity: float
    completeness: float
    wow_factor: float
    details: dict = Field(default_factory=dict)


class GenerateCharacterRequest(BaseModel):
    prompt: str = ""


class GenerateQuestRequest(BaseModel):
    prompt: str = ""
    faction_name: str | None = None


class GenerateDialogueRequest(BaseModel):
    character_ids: list[str]
    scene: str


class ExpandStoryRequest(BaseModel):
    prompt: str = ""


class CouncilDebateRequest(BaseModel):
    topic: str
    context: str = ""


class GraphEdgeCreate(BaseModel):
    source_type: str
    source_id: str
    target_type: str
    target_id: str
    relationship: str
    strength: float = 0.5


class GenreSuggestRequest(BaseModel):
    prompt: str


class GenreSuggestResponse(BaseModel):
    genre: str
    reasoning: str
    alternatives: list[str] = Field(default_factory=list)
