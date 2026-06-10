from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.database import get_db
from app.db.models import User

settings = get_settings()


async def _get_or_create_demo_user(db: AsyncSession) -> User:
    result = await db.execute(select(User).where(User.id == settings.demo_user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            id=settings.demo_user_id,
            display_name="Demo Dreamer",
            email="demo@dreamforge.app",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if settings.is_demo_auth:
        return await _get_or_create_demo_user(db)

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = authorization.replace("Bearer ", "")
    try:
        payload = jwt.get_unverified_claims(token)
        oid = payload.get("oid") or payload.get("sub")
        if not oid:
            raise HTTPException(status_code=401, detail="Invalid token claims")
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc

    result = await db.execute(select(User).where(User.oid == oid))
    user = result.scalar_one_or_none()
    if not user:
        user = User(
            id=f"user_{oid[:12]}",
            oid=oid,
            email=payload.get("preferred_username") or payload.get("email"),
            display_name=payload.get("name", "Dreamer"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user
