from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.entities import router as entities_router
from app.api.universes import router as universes_router
from app.config import get_settings
from app.db.database import init_db

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    if settings.is_demo:
        try:
            from app.demo.seed import seed_demo_data
            await seed_demo_data()
        except Exception:
            pass
    yield


app = FastAPI(
    title="DreamForge API",
    description="AI Universe Creation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(universes_router, prefix="/api/v1")
app.include_router(entities_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "mode": settings.dreamforge_mode,
        "auth_mode": settings.dreamforge_auth_mode,
    }
