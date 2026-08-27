from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = model_config.get("DATABASE_URL")
    cors_origins: list[str] = model_config.get("CORS_ORIGINS")


settings = Settings()
