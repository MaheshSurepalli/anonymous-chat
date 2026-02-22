from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ALLOW_ORIGINS: list[str] = ["*"]
    DATABASE_URL: str = "sqlite:///app.db"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()