"""
AI Service Configuration
Manages feature flags and settings for the AI Support Module
"""

from pydantic_settings import BaseSettings
from typing import Dict, Any


class Settings(BaseSettings):
    """Application settings with feature flags"""
    
    # Service Configuration
    SERVICE_NAME: str = "UTH-ConfMS AI Service"
    SERVICE_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Feature Flags - Can be toggled per deployment
    ENABLE_AUTHOR_SPELLCHECK: bool = True
    ENABLE_AUTHOR_ABSTRACT_POLISHING: bool = True
    ENABLE_AUTHOR_KEYWORD_SUGGESTION: bool = True
    
    ENABLE_REVIEWER_SUMMARY: bool = True
    ENABLE_REVIEWER_KEY_POINTS: bool = True
    ENABLE_REVIEWER_SIMILARITY: bool = True
    
    # Audit Logging
    ENABLE_AUDIT_LOGGING: bool = True
    AUDIT_LOG_PATH: str = "logs/audit.log"
    
    # AI Model Settings
    MAX_TEXT_LENGTH: int = 10000
    SUMMARY_MIN_LENGTH: int = 150
    SUMMARY_MAX_LENGTH: int = 250
    MAX_KEYWORDS: int = 10
    
    # External AI Service (Groq)
    GROQ_API_KEY: str = ""  # Set in .env file
    GROQ_MODEL: str = "llama-3.3-70b-versatile"  # Free tier model (updated)
    GROQ_MAX_TOKENS: int = 2000
    GROQ_TEMPERATURE: float = 0.7
    
    # Privacy Settings
    HASH_INPUT_IN_LOGS: bool = True  # Hash sensitive content in logs
    PRESERVE_DOUBLE_BLIND: bool = True  # Never expose author identity
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()


def get_feature_status() -> Dict[str, Any]:
    """Returns the current status of all features"""
    return {
        "author_features": {
            "spellcheck": settings.ENABLE_AUTHOR_SPELLCHECK,
            "abstract_polishing": settings.ENABLE_AUTHOR_ABSTRACT_POLISHING,
            "keyword_suggestion": settings.ENABLE_AUTHOR_KEYWORD_SUGGESTION,
        },
        "reviewer_features": {
            "summary": settings.ENABLE_REVIEWER_SUMMARY,
            "key_points": settings.ENABLE_REVIEWER_KEY_POINTS,
            "similarity": settings.ENABLE_REVIEWER_SIMILARITY,
        },
        "chair_features": {
            "email_templates": settings.ENABLE_CHAIR_EMAIL_TEMPLATES,
        },
        "audit_logging": settings.ENABLE_AUDIT_LOGGING,
    }
