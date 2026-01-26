"""
UTH-ConfMS AI Service
Main FastAPI application for AI Support Module
Implements human-in-the-loop AI assistance for academic conference management
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

# Import models
from models import (
    # Author models
    SpellCheckRequest, SpellCheckResponse,
    PolishRequest, PolishResponse,
    KeywordSuggestionRequest, KeywordSuggestionResponse,
    # Reviewer models
    ReviewerSummaryRequest, ReviewerSummaryResponse,
    SimilarityRequest, SimilarityResponse,
    # General models
    HealthCheckResponse, ErrorResponse
)

# Import services
from author_service import author_service
from reviewer_service import reviewer_service
from config import settings, get_feature_status
from audit_logging import audit_logger

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")
    logger.info("AI features initialized")
    yield
    # Shutdown
    logger.info("Shutting down AI Service")


# Initialize FastAPI application
app = FastAPI(
    title=settings.SERVICE_NAME,
    version=settings.SERVICE_VERSION,
    description="AI Support Module for UTH Conference Management System - Human-in-the-loop AI assistance",
    lifespan=lifespan
)

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============= Health Check & Status Endpoints =============

@app.get("/", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy",
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
        features_enabled=get_feature_status()
    )


@app.get("/api/ai/features")
async def get_features():
    """Get status of all AI features (which are enabled/disabled)"""
    return get_feature_status()


# ============= Author AI Endpoints =============

@app.post("/api/ai/author/spellcheck", response_model=SpellCheckResponse)
async def spell_and_grammar_check(request: SpellCheckRequest):
    """
    Spell and grammar checking for paper title, abstract, or keywords
    Returns suggestions - user must explicitly approve
    
    Preview-before-apply: Response always has applied=False
    """
    try:
        response = author_service.spell_and_grammar_check(request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in spellcheck: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during spell checking"
        )


@app.post("/api/ai/author/polish", response_model=PolishResponse)
async def polish_abstract(request: PolishRequest):
    """
    Polish abstract for clearer academic English
    Shows side-by-side comparison - user must choose to accept
    
    Preview-before-apply: Response includes both original and polished versions
    """
    try:
        response = author_service.polish_abstract(request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in abstract polishing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during abstract polishing"
        )


@app.post("/api/ai/author/keywords", response_model=KeywordSuggestionResponse)
async def suggest_keywords(request: KeywordSuggestionRequest):
    """
    Suggest keywords based on abstract content
    Returns suggestions - user must choose which to accept
    
    Preview-before-apply: User selects from suggested keywords
    """
    try:
        response = author_service.suggest_keywords(request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in keyword suggestion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during keyword suggestion"
        )


# ============= Reviewer AI Endpoints =============

@app.post("/api/ai/reviewer/summary", response_model=ReviewerSummaryResponse)
async def generate_paper_summary(request: ReviewerSummaryRequest):
    """
    Generate neutral summary of paper abstract (150-250 words)
    Extracts key points: research problem, methodology, dataset, contributions
    
    CRITICAL: Never exposes author identity (double-blind preserved)
    """
    try:
        response = reviewer_service.generate_summary(request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in summary generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during summary generation"
        )


@app.post("/api/ai/reviewer/similarity", response_model=SimilarityResponse)
async def calculate_similarity(request: SimilarityRequest):
    """
    Calculate similarity between reviewer expertise and paper topics
    Helps reviewers decide whether to bid on a paper
    
    Returns similarity score (0-1) and matching topics
    """
    try:
        response = reviewer_service.calculate_similarity(request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in similarity calculation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during similarity calculation"
        )


# ============= Error Handlers =============

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            detail=str(exc),
            feature=None
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal server error",
            detail="An unexpected error occurred",
            feature=None
        ).dict()
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
