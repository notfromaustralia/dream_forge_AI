from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    oid: Mapped[str] = mapped_column(String(128), unique=True, nullable=True)
    email: Mapped[str] = mapped_column(String(256), nullable=True)
    display_name: Mapped[str] = mapped_column(String(256), default="Dreamer")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    universes: Mapped[list["Universe"]] = relationship(back_populates="owner")


class Universe(Base):
    __tablename__ = "universes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(256))
    genre: Mapped[str] = mapped_column(String(64), default="fantasy")
    style: Mapped[str] = mapped_column(String(128), default="epic")
    audience: Mapped[str] = mapped_column(String(64), default="general")
    prompt: Mapped[str] = mapped_column(Text, default="")
    overview: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    creativity_score: Mapped[float] = mapped_column(Float, default=0.0)
    consistency_score: Mapped[float] = mapped_column(Float, default=0.0)
    completeness_score: Mapped[float] = mapped_column(Float, default=0.0)
    wow_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped[User] = relationship(back_populates="universes")
    characters: Mapped[list["Character"]] = relationship(back_populates="universe", cascade="all, delete-orphan")
    locations: Mapped[list["Location"]] = relationship(back_populates="universe", cascade="all, delete-orphan")
    factions: Mapped[list["Faction"]] = relationship(back_populates="universe", cascade="all, delete-orphan")
    events: Mapped[list["Event"]] = relationship(back_populates="universe", cascade="all, delete-orphan")
    stories: Mapped[list["Story"]] = relationship(back_populates="universe", cascade="all, delete-orphan")
    religions: Mapped[list["Religion"]] = relationship(back_populates="universe", cascade="all, delete-orphan")
    magic_systems: Mapped[list["MagicSystem"]] = relationship(back_populates="universe", cascade="all, delete-orphan")
    timeline_entries: Mapped[list["TimelineEntry"]] = relationship(
        back_populates="universe", cascade="all, delete-orphan"
    )
    graph_edges: Mapped[list["GraphEdge"]] = relationship(back_populates="universe", cascade="all, delete-orphan")


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))
    bio: Mapped[str] = mapped_column(Text, default="")
    motivations: Mapped[str] = mapped_column(Text, default="")
    personality: Mapped[str] = mapped_column(Text, default="{}")
    story_importance: Mapped[str] = mapped_column(String(32), default="supporting")
    era_start: Mapped[int] = mapped_column(Integer, default=0)
    era_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    faction_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    location_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    portrait_prompt: Mapped[str] = mapped_column(Text, default="")
    portrait_status: Mapped[str] = mapped_column(String(32), default="pending")

    universe: Mapped[Universe] = relationship(back_populates="characters")


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))
    location_type: Mapped[str] = mapped_column(String(64), default="city")
    description: Mapped[str] = mapped_column(Text, default="")
    coordinates_json: Mapped[str] = mapped_column(Text, default="{}")
    parent_location_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    era_start: Mapped[int] = mapped_column(Integer, default=0)
    era_end: Mapped[int | None] = mapped_column(Integer, nullable=True)

    universe: Mapped[Universe] = relationship(back_populates="locations")


class Faction(Base):
    __tablename__ = "factions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))
    ideology: Mapped[str] = mapped_column(Text, default="")
    power_level: Mapped[str] = mapped_column(String(32), default="moderate")
    territory: Mapped[str] = mapped_column(String(256), default="")
    era_start: Mapped[int] = mapped_column(Integer, default=0)
    era_end: Mapped[int | None] = mapped_column(Integer, nullable=True)

    universe: Mapped[Universe] = relationship(back_populates="factions")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(256))
    description: Mapped[str] = mapped_column(Text, default="")
    era_year: Mapped[int] = mapped_column(Integer, default=0)
    event_type: Mapped[str] = mapped_column(String(64), default="historical")
    impact: Mapped[str] = mapped_column(String(32), default="moderate")

    universe: Mapped[Universe] = relationship(back_populates="events")


class Story(Base):
    __tablename__ = "stories"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(256))
    synopsis: Mapped[str] = mapped_column(Text, default="")
    content_json: Mapped[str] = mapped_column(Text, default="{}")
    arc_type: Mapped[str] = mapped_column(String(64), default="main")
    status: Mapped[str] = mapped_column(String(32), default="draft")
    character_ids: Mapped[str] = mapped_column(Text, default="[]")

    universe: Mapped[Universe] = relationship(back_populates="stories")


class Religion(Base):
    __tablename__ = "religions"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))
    beliefs: Mapped[str] = mapped_column(Text, default="")
    deities_json: Mapped[str] = mapped_column(Text, default="[]")

    universe: Mapped[Universe] = relationship(back_populates="religions")


class MagicSystem(Base):
    __tablename__ = "magic_systems"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(256))
    rules_json: Mapped[str] = mapped_column(Text, default="{}")
    limitations: Mapped[str] = mapped_column(Text, default="")

    universe: Mapped[Universe] = relationship(back_populates="magic_systems")


class TimelineEntry(Base):
    __tablename__ = "timeline_entries"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    era_year: Mapped[int] = mapped_column(Integer)
    label: Mapped[str] = mapped_column(String(256))
    snapshot_json: Mapped[str] = mapped_column(Text, default="{}")

    universe: Mapped[Universe] = relationship(back_populates="timeline_entries")


class GraphEdge(Base):
    __tablename__ = "graph_edges"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    source_type: Mapped[str] = mapped_column(String(32))
    source_id: Mapped[str] = mapped_column(String(32))
    target_type: Mapped[str] = mapped_column(String(32))
    target_id: Mapped[str] = mapped_column(String(32))
    rel_type: Mapped[str] = mapped_column(String(64))
    strength: Mapped[float] = mapped_column(Float, default=0.5)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")

    universe: Mapped[Universe] = relationship(back_populates="graph_edges")


class LoreEmbedding(Base):
    __tablename__ = "lore_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    entity_type: Mapped[str] = mapped_column(String(32))
    entity_id: Mapped[str] = mapped_column(String(32))
    content: Mapped[str] = mapped_column(Text)
    embedding_json: Mapped[str] = mapped_column(Text, default="[]")


class AgentTrace(Base):
    __tablename__ = "agent_traces"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(String(32))
    workflow_run_id: Mapped[str] = mapped_column(String(32))
    agent_id: Mapped[str] = mapped_column(String(64))
    thought: Mapped[str] = mapped_column(Text, default="")
    action: Mapped[str] = mapped_column(Text, default="")
    observation: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    universe_id: Mapped[str] = mapped_column(String(32), nullable=True)
    intent: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default="running")
    input_json: Mapped[str] = mapped_column(Text, default="{}")
    output_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class EvaluationScore(Base):
    __tablename__ = "evaluation_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    universe_id: Mapped[str] = mapped_column(ForeignKey("universes.id", ondelete="CASCADE"))
    consistency: Mapped[float] = mapped_column(Float, default=0.0)
    creativity: Mapped[float] = mapped_column(Float, default=0.0)
    completeness: Mapped[float] = mapped_column(Float, default=0.0)
    wow_factor: Mapped[float] = mapped_column(Float, default=0.0)
    details_json: Mapped[str] = mapped_column(Text, default="{}")
    calculated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
