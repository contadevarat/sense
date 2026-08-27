from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = model_config.get("DATABASE_URL")
    cors_origins: list[str] = model_config.get("CORS_ORIGINS")
    s3_bucket_name: str = model_config.get("S3_BUCKET_NAME")
    s3_endpoint_url: str | None = model_config.get("S3_ENDPOINT_URL")


settings = Settings()
