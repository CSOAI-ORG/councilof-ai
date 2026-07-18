from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "MEOK Sovereign API"
    debug: bool = False
    database_url: str = "sqlite:///./meok_sovereign.db"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_sovereign: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    mistral_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
