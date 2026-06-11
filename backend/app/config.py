from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./dreamforge.db"
    dreamforge_mode: str = "demo"
    dreamforge_auth_mode: str = "demo"
    azure_tenant_id: str = ""
    azure_client_id: str = ""
    openai_api_key: str = ""
    openai_base_url: str = "https://models.inference.ai.azure.com"
    ai_model: str = "gpt-4o-mini"
    github_token: str = ""
    llm_max_tokens: int = 2000
    demo_user_id: str = "demo_user_001"
    cors_origins: str = "http://localhost:3000"

    @property
    def is_demo(self) -> bool:
        return self.dreamforge_mode.lower() == "demo"

    @property
    def is_demo_auth(self) -> bool:
        return self.dreamforge_auth_mode.lower() == "demo"

    @property
    def llm_api_key(self) -> str:
        return self.openai_api_key or self.github_token


def _normalize_database_url(url: str) -> str:
    """Render/Railway provide postgresql://; SQLAlchemy async needs postgresql+asyncpg://."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    normalized = _normalize_database_url(settings.database_url)
    if normalized != settings.database_url:
        return settings.model_copy(update={"database_url": normalized})
    return settings
