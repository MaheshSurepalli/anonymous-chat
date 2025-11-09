from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ALLOW_ORIGINS: list[str] = ["*"]

settings = Settings()