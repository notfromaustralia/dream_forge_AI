import json
from urllib.parse import quote

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import Character, Faction, Location, Universe
from app.services.llm import LLMService

settings = get_settings()


def pollinations_url(prompt: str, seed: str, width: int = 512, height: int = 512) -> str:
    encoded = quote(prompt[:800])
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={width}&height={height}&nologo=true&seed={quote(seed)}"
    )


def dicebear_url(seed: str) -> str:
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={quote(seed)}&backgroundColor=0a0a1a"


def _template_prompt(character: Character, universe: Universe, faction: Faction | None) -> str:
    try:
        personality = json.loads(character.personality or "{}")
        traits = ", ".join(personality.get("traits", [])) if isinstance(personality, dict) else ""
    except json.JSONDecodeError:
        traits = ""
    faction_hint = f", member of {faction.name}" if faction else ""
    return (
        f"{universe.genre} portrait of {character.name}, {traits}, "
        f"{character.story_importance} character{faction_hint}, "
        f"cinematic lighting, detailed face, character bust, fantasy art, no text"
    )


async def build_portrait_prompt(
    character: Character,
    universe: Universe,
    faction: Faction | None = None,
    location: Location | None = None,
) -> str:
    if settings.is_demo or not settings.llm_api_key:
        return _template_prompt(character, universe, faction)

    try:
        personality = json.loads(character.personality or "{}")
        traits = personality.get("traits", []) if isinstance(personality, dict) else []
    except json.JSONDecodeError:
        traits = []

    loc_hint = location.name if location else "unknown"
    fac_hint = faction.name if faction else "none"

    result = await LLMService().complete_json(
        system_prompt=(
            "You create short English image prompts for AI portrait generation. "
            "Return JSON with key visual_prompt (max 2 sentences, no text in image)."
        ),
        user_prompt=(
            f"Genre: {universe.genre}, Style: {universe.style}\n"
            f"Name: {character.name}\nBio: {character.bio[:300]}\n"
            f"Traits: {traits}\nRole: {character.story_importance}\n"
            f"Faction: {fac_hint}\nLocation: {loc_hint}"
        ),
    )
    prompt = result.get("visual_prompt") or result.get("portrait_prompt")
    if prompt and isinstance(prompt, str):
        return prompt
    return _template_prompt(character, universe, faction)


async def generate_character_portrait(
    db: AsyncSession,
    character: Character,
    universe: Universe,
) -> dict[str, str]:
    faction = await db.get(Faction, character.faction_id) if character.faction_id else None
    location = await db.get(Location, character.location_id) if character.location_id else None

    prompt = await build_portrait_prompt(character, universe, faction, location)
    image_url = pollinations_url(prompt, character.id)

    character.portrait_prompt = prompt
    character.portrait_status = "ready"
    await db.commit()
    await db.refresh(character)

    return {
        "portrait_prompt": prompt,
        "image_url": image_url,
        "portrait_status": character.portrait_status,
        "fallback_url": dicebear_url(character.id),
    }
