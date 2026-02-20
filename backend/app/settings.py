from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ALLOW_ORIGINS: list[str] = ["*"]
    DATABASE_URL: str = "sqlite:///app.db"

settings = Settings()