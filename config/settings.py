"""
Configuration settings for FormFiller application
"""
import os
from typing import Any
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "FormFiller"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = int(os.getenv("PORT", "8000"))
    
    # Audio processing
    UPLOAD_DIR: str = "temp_uploads"
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "medium")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")

    GOOGLE_API_KEY: Any = os.getenv("GOOGLE_API_KEY", None)
    GOOGLE_MODEL: str = os.getenv("GOOGLE_MODEL", "gemma-3-12b-it")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"
    
    def __init__(self, **data):
        super().__init__(**data)
        # Create upload directory if it doesn't exist
        Path(self.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


# Create settings instance
settings = Settings()
