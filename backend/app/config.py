"""
Configuration and environment variables
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # App
    APP_NAME: str = "Faris AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"
    
    # Database (Railway PostgreSQL)
    DATABASE_URL: str = "postgresql://localhost/faris_ai"
    
    # Auth
    JWT_SECRET: str = "jwt-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    
    # AI
    ANTHROPIC_API_KEY: str = ""
    AI_MODEL: str = "claude-sonnet-4-20250514"
    
    # Email
    RESEND_API_KEY: str = ""
    DEFAULT_FROM_EMAIL: str = "faris@farisai.app"
    DEFAULT_FROM_NAME: str = "Faris AI"
    
    # Redis (for background jobs)
    REDIS_URL: str = "redis://localhost:6379"
    
    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Rate limits
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
