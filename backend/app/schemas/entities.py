from pydantic import BaseModel


class CharacterCreate(BaseModel):
    name: str
    bio: str = ""
    motivations: str = ""
    personality: str = "{}"
    story_importance: str = "supporting"
    era_start: int = 0
    era_end: int | None = None
    faction_id: str | None = None
    location_id: str | None = None


class CharacterUpdate(BaseModel):
    name: str | None = None
    bio: str | None = None
    motivations: str | None = None
    personality: str | None = None
    story_importance: str | None = None
    era_start: int | None = None
    era_end: int | None = None
    faction_id: str | None = None
    location_id: str | None = None


class CharacterResponse(BaseModel):
    id: str
    universe_id: str
    name: str
    bio: str
    motivations: str
    personality: str
    story_importance: str
    era_start: int
    era_end: int | None
    faction_id: str | None
    location_id: str | None
    portrait_prompt: str = ""
    portrait_status: str = "pending"

    model_config = {"from_attributes": True}


class PortraitResponse(BaseModel):
    portrait_prompt: str
    image_url: str
    portrait_status: str


class LocationCreate(BaseModel):
    name: str
    location_type: str = "city"
    description: str = ""
    coordinates_json: str = "{}"
    parent_location_id: str | None = None
    era_start: int = 0
    era_end: int | None = None


class LocationResponse(BaseModel):
    id: str
    universe_id: str
    name: str
    location_type: str
    description: str
    coordinates_json: str
    parent_location_id: str | None
    era_start: int
    era_end: int | None

    model_config = {"from_attributes": True}


class FactionCreate(BaseModel):
    name: str
    ideology: str = ""
    power_level: str = "moderate"
    territory: str = ""
    era_start: int = 0
    era_end: int | None = None


class FactionResponse(BaseModel):
    id: str
    universe_id: str
    name: str
    ideology: str
    power_level: str
    territory: str
    era_start: int
    era_end: int | None

    model_config = {"from_attributes": True}


class EventCreate(BaseModel):
    title: str
    description: str = ""
    era_year: int = 0
    event_type: str = "historical"
    impact: str = "moderate"


class EventResponse(BaseModel):
    id: str
    universe_id: str
    title: str
    description: str
    era_year: int
    event_type: str
    impact: str

    model_config = {"from_attributes": True}


class StoryCreate(BaseModel):
    title: str
    synopsis: str = ""
    arc_type: str = "main"
    status: str = "draft"
    character_ids: str = "[]"


class StoryResponse(BaseModel):
    id: str
    universe_id: str
    title: str
    synopsis: str
    content_json: str = "{}"
    arc_type: str
    status: str
    character_ids: str

    model_config = {"from_attributes": True}
