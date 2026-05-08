from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    github_token: str | None = None
    github_write_owner: str | None = None
    openai_api_key: str | None = None
    cors_origins: list[str] = ["http://localhost:3000"]

    # Vercel KV (Upstash REST). When unset, persistence falls through.
    kv_rest_api_url: str | None = None
    kv_rest_api_token: str | None = None

    # Clerk (for validating owner writes). When unset, write-side
    # endpoints accept session-only customizations like before.
    clerk_secret_key: str | None = None
    clerk_jwks_url: str | None = None


settings = Settings()
