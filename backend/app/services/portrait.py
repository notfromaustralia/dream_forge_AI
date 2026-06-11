import json
from urllib.parse import quote

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.models import Character, Faction, Location, Universe
from app.services.llm import LLMService

settings = get_settings()

CARTOON_KEYWORDS = ("illustration", "cartoon", "anime", "storybook", "stylized", "comic", "whimsical")
CINEMATIC_KEYWORDS = ("cinematic", "gritty", "realistic", "photorealistic", "dark", "epic")


def pollinations_url(prompt: str, seed: str, width: int = 512, height: int = 512) -> str:
    encoded = quote(prompt[:800])
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width={width}&height={height}&nologo=true&enhance=true"
        f"&negative_prompt={quote('blurry,text,watermark,logo')}"
        f"&seed={quote(seed)}"
    )


def dicebear_url(seed: str) -> str:
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={quote(seed)}&backgroundColor=0a0a1a"


def _universe_theme(universe: Universe, max_len: int = 180) -> str:
    return (universe.overview or universe.prompt or "").strip()[:max_len]


def _is_cartoon_style(universe: Universe) -> bool:
    style = f"{universe.style} {universe.audience}".lower()
    if any(k in style for k in CARTOON_KEYWORDS):
        return True
    if any(k in style for k in CINEMATIC_KEYWORDS):
        return False
    return "young" in style or "family" in style


def _portrait_style_preset(universe: Universe) -> str:
    if _is_cartoon_style(universe):
        return "cartoon illustration, stylized character portrait, vibrant colors, animated look, clean lines"
    return "cinematic portrait, dramatic lighting, painterly fantasy art, detailed face"


def _parse_traits(character: Character) -> tuple[str, str]:
    try:
        personality = json.loads(character.personality or "{}")
        if not isinstance(personality, dict):
            return "", ""
        traits = ", ".join(personality.get("traits", []))
        flaw = personality.get("flaw", "")
        return traits, flaw if isinstance(flaw, str) else ""
    except json.JSONDecodeError:
        return "", ""


def _template_prompt(
    character: Character,
    universe: Universe,
    faction: Faction | None,
    location: Location | None = None,
) -> str:
    traits, flaw = _parse_traits(character)
    faction_hint = f", member of {faction.name}" if faction else ""
    location_hint = f", from {location.name}" if location else ""
    parts = [
        _portrait_style_preset(universe),
        universe.genre,
        _universe_theme(universe, 120),
        f"portrait of {character.name}",
        traits,
        f"role: {character.story_importance}",
        character.bio[:120],
        character.motivations[:80] if character.motivations else "",
        flaw and f"flaw: {flaw}",
        faction_hint,
        location_hint,
        "character bust, centered, no text, no watermark",
    ]
    return ", ".join(p for p in parts if p)


async def build_portrait_prompt(
    character: Character,
    universe: Universe,
    faction: Faction | None = None,
    location: Location | None = None,
) -> str:
    style_preset = _portrait_style_preset(universe)
    theme = _universe_theme(universe)

    if settings.is_demo or not settings.llm_api_key:
        return _template_prompt(character, universe, faction, location)

    traits_list: list = []
    try:
        personality = json.loads(character.personality or "{}")
        traits_list = personality.get("traits", []) if isinstance(personality, dict) else []
    except json.JSONDecodeError:
        pass

    loc_hint = location.name if location else "unknown"
    fac_hint = faction.name if faction else "none"

    from app.services.llm import LLMError, LLMJSONError
    try:
        result = await LLMService().complete_json(
            system_prompt=(
                "You create short English image prompts for AI portrait generation. "
                f"Use this visual style: {style_preset}. "
                "Return JSON with key visual_prompt (max 2 sentences, no text in image)."
            ),
            user_prompt=(
                f"Universe theme: {theme}\n"
                f"Genre: {universe.genre}, Style: {universe.style}, Audience: {universe.audience}\n"
                f"Name: {character.name}\nBio: {character.bio[:300]}\n"
                f"Motivations: {character.motivations[:200]}\n"
                f"Traits: {traits_list}\nRole: {character.story_importance}\n"
                f"Faction: {fac_hint}\nLocation: {loc_hint}"
            ),
        )
    except (LLMError, LLMJSONError):
        return _template_prompt(character, universe, faction, location)

    prompt = result.get("visual_prompt") or result.get("portrait_prompt")
    if prompt and isinstance(prompt, str):
        return f"{style_preset}, {prompt}, no text, no watermark"
    return _template_prompt(character, universe, faction, location)


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
