"""
Data Models for AI Service
All request and response models following the human-in-the-loop principle
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AIFeature(str, Enum):
    """Enum for tracking which AI feature was used"""
    AUTHOR_SPELLCHECK = "author_spellcheck"
    AUTHOR_POLISH = "author_polish"
    AUTHOR_KEYWORDS = "author_keywords"
    REVIEWER_SUMMARY = "reviewer_summary"
    REVIEWER_KEY_POINTS = "reviewer_key_points"
    REVIEWER_SIMILARITY = "reviewer_similarity"
    CHAIR_EMAIL_TEMPLATE = "chair_email_template"


class UserRole(str, Enum):
    """User roles in the system"""
    AUTHOR = "author"
    REVIEWER = "reviewer"
    CHAIR = "chair"
    ADMIN = "admin"


# ============= Author Models =============

class SpellCheckRequest(BaseModel):
    """Request for spell and grammar checking"""
    text: str = Field(..., max_length=10000, description="Text to check (title, abstract, or keywords)")
    user_id: str = Field(..., description="ID of the user requesting the service")
    field_type: str = Field(..., description="Type of field: title, abstract, or keywords")


class TextCorrection(BaseModel):
    """Individual correction suggestion"""
    original: str
    suggested: str
    position: int
    error_type: str  # spelling, grammar, style
    explanation: str


class SpellCheckResponse(BaseModel):
    """Response with corrections - user must approve"""
    original_text: str
    suggested_text: str
    corrections: List[TextCorrection]
    applied: bool = False  # Always False - user must explicitly apply


class PolishRequest(BaseModel):
    """Request for abstract polishing"""
    abstract: str = Field(..., max_length=5000, description="Original abstract text")
    user_id: str = Field(..., description="ID of the user requesting the service")


class PolishResponse(BaseModel):
    """Response with polished abstract - side-by-side comparison"""
    original_abstract: str
    polished_abstract: str
    improvements: List[str]  # List of improvements made
    applied: bool = False  # User must choose to accept


class KeywordSuggestionRequest(BaseModel):
    """Request for keyword suggestions based on abstract"""
    abstract: str = Field(..., max_length=5000)
    user_id: str
    existing_keywords: Optional[List[str]] = []


class KeywordSuggestionResponse(BaseModel):
    """Response with keyword suggestions"""
    suggested_keywords: List[str]
    confidence_scores: Dict[str, float]  # keyword -> confidence
    applied: bool = False


# ============= Reviewer Models =============

class ReviewerSummaryRequest(BaseModel):
    """Request for paper summary - NO author info allowed"""
    paper_abstract: str = Field(..., max_length=5000)
    paper_keywords: Optional[List[str]] = []
    reviewer_id: str
    paper_id: str
    # NEVER include: author_name, author_email, author_institution


class ReviewerSummaryResponse(BaseModel):
    """Neutral summary for reviewer understanding"""
    summary: str = Field(..., description="150-250 word neutral summary")
    key_points: Dict[str, str] = Field(
        ...,
        description="Extracted key points: research_problem, methodology, dataset, contributions"
    )
    word_count: int


class SimilarityRequest(BaseModel):
    """Request for similarity between reviewer expertise and paper"""
    reviewer_id: str
    reviewer_expertise: List[str]  # Reviewer's keywords/topics
    paper_keywords: List[str]
    paper_abstract: str


class SimilarityResponse(BaseModel):
    """Similarity score and explanation"""
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="0-1 similarity score")
    matching_topics: List[str]
    explanation: str  # Why this score was given
    recommendation: str  # "High match", "Moderate match", "Low match"


# ============= Chair Models =============

class EmailType(str, Enum):
    """Types of email templates"""
    INVITATION = "invitation"
    REMINDER = "reminder"
    ACCEPTANCE = "acceptance"
    REJECTION = "rejection"
    GENERAL = "general"


class EmailTemplateRequest(BaseModel):
    """Request for email template generation"""
    chair_id: str
    email_type: EmailType
    context: Dict[str, Any] = Field(
        ...,
        description="Context for email: conference_name, deadline, recipient_role, etc."
    )
    custom_instructions: Optional[str] = None


class EmailTemplateResponse(BaseModel):
    """Generated email template - chair must review before sending"""
    subject: str
    body: str
    placeholders: List[str]  # List of {{placeholder}} fields to fill
    applied: bool = False  # Chair must review and approve
    warnings: List[str] = []  # Any warnings or things to check


# ============= Audit Logging Models =============

class AuditLogEntry(BaseModel):
    """Audit log entry for transparency"""
    log_id: str
    user_id: str
    user_role: UserRole
    feature: AIFeature
    timestamp: datetime
    input_hash: str  # SHA-256 hash of input (not raw content for privacy)
    output_preview: str  # First 100 chars of output
    applied: bool  # Did user apply the suggestion?
    metadata: Optional[Dict[str, Any]] = None


# ============= General Models =============

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    features_enabled: Dict[str, Any]


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: str
    feature: Optional[str] = None
