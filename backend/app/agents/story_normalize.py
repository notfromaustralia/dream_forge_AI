import json
from typing import Any


def _plain_summary(text: str, max_len: int = 280) -> str:
    if not text:
        return ""
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."


def normalize_story(data: dict[str, Any], intent: str) -> tuple[str, str, str, str]:
    """Returns title, plain synopsis, content_json string, arc_type."""
    arc_type = "side" if intent == "quest" else data.get("arc_type", "main")

    if "quest" in data and isinstance(data["quest"], dict):
        quest = data["quest"]
        title = quest.get("title") or data.get("title") or "Untitled Quest"
        description = quest.get("description", "")
        synopsis = _plain_summary(description or title)
        content_json = json.dumps(quest)
        return title, synopsis, content_json, "side"

    if "plot" in data or "setting" in data or "dialogue" in data:
        title = data.get("title") or "Untitled"
        plot = data.get("plot", {})
        if isinstance(plot, dict):
            intro = plot.get("introduction", "")
            conflict = plot.get("conflict", "")
            synopsis = _plain_summary(
                data.get("synopsis") or f"{intro} {conflict}".strip() or title
            )
        else:
            synopsis = _plain_summary(data.get("synopsis", title))
        content_json = json.dumps(data)
        return title, synopsis, content_json, arc_type

    title = data.get("title") or "Untitled"
    synopsis_raw = data.get("synopsis")
    if isinstance(synopsis_raw, str) and synopsis_raw:
        synopsis = _plain_summary(synopsis_raw)
    else:
        synopsis = _plain_summary(title)
    content_json = json.dumps(data)
    return title, synopsis, content_json, arc_type
