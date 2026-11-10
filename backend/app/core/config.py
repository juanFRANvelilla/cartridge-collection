from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine.url import make_url

_ROOT = Path(__file__).resolve().parents[2]
_DOTENV_PATH = _ROOT / ".env"
_ENV_EXAMPLE_PATH = _ROOT / "env.example"

if _DOTENV_PATH.is_file():
    _ENV_FILE: tuple[str, ...] | None = (str(_DOTENV_PATH),)
elif _ENV_EXAMPLE_PATH.is_file():
    _ENV_FILE = (str(_ENV_EXAMPLE_PATH),)
else:
    _ENV_FILE = None


class Settings(BaseSettings):
    database_url: str
    database_host: str | None = None
    cors_origins: str = "http://localhost:4200"

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def resolved_database_url(self) -> str:
        url = make_url(self.database_url)
        if self.database_host:
            url = url.set(host=self.database_host)
        return url.render_as_string(hide_password=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()
