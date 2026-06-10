import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.db.models import Character, Event, Faction, Location, Story, Universe, User
from app.schemas.entities import (
    CharacterCreate,
    CharacterResponse,
    CharacterUpdate,
    EventCreate,
    EventResponse,
    FactionCreate,
    FactionResponse,
    LocationCreate,
    LocationResponse,
    PortraitResponse,
    StoryCreate,
    StoryResponse,
)
from app.services.portrait import generate_character_portrait

router = APIRouter(prefix="/universes/{universe_id}", tags=["entities"])


async def _check_universe(universe_id: str, user: User, db: AsyncSession) -> Universe:
    universe = await db.get(Universe, universe_id)
    if not universe or universe.user_id != user.id:
        raise HTTPException(404, "Universe not found")
    return universe


@router.get("/characters", response_model=list[CharacterResponse])
async def list_characters(universe_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    rows = (await db.execute(select(Character).where(Character.universe_id == universe_id))).scalars().all()
    return [CharacterResponse.model_validate(r) for r in rows]


@router.post("/characters", response_model=CharacterResponse)
async def create_character(universe_id: str, body: CharacterCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    char = Character(id=f"char_{uuid.uuid4().hex[:12]}", universe_id=universe_id, **body.model_dump())
    db.add(char)
    await db.commit()
    await db.refresh(char)
    return CharacterResponse.model_validate(char)


@router.patch("/characters/{character_id}", response_model=CharacterResponse)
async def update_character(universe_id: str, character_id: str, body: CharacterUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(char, field, value)
    await db.commit()
    await db.refresh(char)
    return CharacterResponse.model_validate(char)


@router.post("/characters/{character_id}/generate-portrait", response_model=PortraitResponse)
async def generate_portrait(
    universe_id: str,
    character_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _check_universe(universe_id, user, db)
    char = await db.get(Character, character_id)
    if not char or char.universe_id != universe_id:
        raise HTTPException(404, "Character not found")
    universe = await db.get(Universe, universe_id)
    if not universe:
        raise HTTPException(404, "Universe not found")
    result = await generate_character_portrait(db, char, universe)
    return PortraitResponse(
        portrait_prompt=result["portrait_prompt"],
        image_url=result["image_url"],
        portrait_status=result["portrait_status"],
    )


@router.delete("/characters/{character_id}")
async def delete_character(universe_id: str, character_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    char = await db.get(Character, character_id)
    if not char:
        raise HTTPException(404, "Character not found")
    await db.delete(char)
    await db.commit()
    return {"deleted": True}


@router.get("/factions", response_model=list[FactionResponse])
async def list_factions(universe_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    rows = (await db.execute(select(Faction).where(Faction.universe_id == universe_id))).scalars().all()
    return [FactionResponse.model_validate(r) for r in rows]


@router.post("/factions", response_model=FactionResponse)
async def create_faction(universe_id: str, body: FactionCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    fac = Faction(id=f"fac_{uuid.uuid4().hex[:12]}", universe_id=universe_id, **body.model_dump())
    db.add(fac)
    await db.commit()
    await db.refresh(fac)
    return FactionResponse.model_validate(fac)


@router.get("/locations", response_model=list[LocationResponse])
async def list_locations(universe_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    rows = (await db.execute(select(Location).where(Location.universe_id == universe_id))).scalars().all()
    return [LocationResponse.model_validate(r) for r in rows]


@router.post("/locations", response_model=LocationResponse)
async def create_location(universe_id: str, body: LocationCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    loc = Location(id=f"loc_{uuid.uuid4().hex[:12]}", universe_id=universe_id, **body.model_dump())
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return LocationResponse.model_validate(loc)


@router.get("/events", response_model=list[EventResponse])
async def list_events(universe_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    rows = (await db.execute(select(Event).where(Event.universe_id == universe_id).order_by(Event.era_year))).scalars().all()
    return [EventResponse.model_validate(r) for r in rows]


@router.post("/events", response_model=EventResponse)
async def create_event(universe_id: str, body: EventCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    evt = Event(id=f"evt_{uuid.uuid4().hex[:12]}", universe_id=universe_id, **body.model_dump())
    db.add(evt)
    await db.commit()
    await db.refresh(evt)
    return EventResponse.model_validate(evt)


@router.get("/stories", response_model=list[StoryResponse])
async def list_stories(universe_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    rows = (await db.execute(select(Story).where(Story.universe_id == universe_id))).scalars().all()
    return [StoryResponse.model_validate(r) for r in rows]


@router.post("/stories", response_model=StoryResponse)
async def create_story(universe_id: str, body: StoryCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await _check_universe(universe_id, user, db)
    story = Story(id=f"story_{uuid.uuid4().hex[:12]}", universe_id=universe_id, **body.model_dump())
    db.add(story)
    await db.commit()
    await db.refresh(story)
    return StoryResponse.model_validate(story)
