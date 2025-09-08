"""Application settings and configuration."""

from pydantic import Field, ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database Configuration
    database_url: str = Field(..., description="PostgreSQL database connection URL")
    database_min_connections: int = Field(default=1, description="Minimum database connections in pool")
    database_max_connections: int = Field(default=20, description="Maximum database connections in pool")
    
    # Application Configuration
    log_level: str = Field(default="INFO", description="Logging level")
    host: str = Field(default="0.0.0.0", description="Host to bind the server to")
    port: int = Field(default=8000, description="Port to bind the server to")
    debug: bool = Field(default=False, description="Enable debug mode")
    
    # API Configuration
    api_prefix: str = Field(default="/api/v1", description="API prefix for all endpoints")
    
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# Global settings instance
settings = Settings()
