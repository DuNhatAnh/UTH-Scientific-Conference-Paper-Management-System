"""
Reviewer AI Services
Provides AI assistance for reviewers during paper evaluation
CRITICAL: Never exposes author identity or violates double-blind review
"""

import re
from typing import List, Dict, Tuple
from collections import Counter
import numpy as np

from models import (
    ReviewerSummaryRequest, ReviewerSummaryResponse,
    SimilarityRequest, SimilarityResponse,
    AIFeature, UserRole
)
from config import settings
from audit_logging import audit_logger


class ReviewerAIService:
    """AI service for reviewer support - privacy-preserving"""
    
    def __init__(self):
        pass
    
    def generate_summary(self, request: ReviewerSummaryRequest) -> ReviewerSummaryResponse:
        """
        Generate neutral summary of paper abstract (150-250 words)
        Extracts key points: research problem, methodology, dataset, contributions
        
        CRITICAL: Never include or infer author information
        """
        if not settings.ENABLE_REVIEWER_SUMMARY:
            audit_logger.log_feature_disabled(request.reviewer_id, AIFeature.REVIEWER_SUMMARY)
            raise ValueError("Summary generation feature is currently disabled")
        
        # Ensure double-blind preservation
        if not settings.PRESERVE_DOUBLE_BLIND:
            raise ValueError("Double-blind review mode must be enabled")
        
        abstract = request.paper_abstract
        keywords = request.paper_keywords or []
        
        # Extract key points from abstract
        key_points = self._extract_key_points(abstract, keywords)
        
        # Generate neutral summary
        summary = self._generate_neutral_summary(abstract, key_points)
        
        # Ensure summary is within word limits
        word_count = len(summary.split())
        if word_count < settings.SUMMARY_MIN_LENGTH:
            summary = self._expand_summary(summary, abstract)
        elif word_count > settings.SUMMARY_MAX_LENGTH:
            summary = self._truncate_summary(summary, settings.SUMMARY_MAX_LENGTH)
        
        word_count = len(summary.split())
        
        response = ReviewerSummaryResponse(
            summary=summary,
            key_points=key_points,
            word_count=word_count
        )
        
        # Log the operation (with privacy preservation)
        audit_logger.log_ai_operation(
            user_id=request.reviewer_id,
            user_role=UserRole.REVIEWER,
            feature=AIFeature.REVIEWER_SUMMARY,
            input_text=abstract,
            output_data={"summary_length": word_count},
            applied=False,
            metadata={"paper_id": request.paper_id}
        )
        
        return response
    
    def _extract_key_points(self, abstract: str, keywords: List[str]) -> Dict[str, str]:
        """
        Extract key points from abstract:
        - Research problem
        - Methodology
        - Dataset (if mentioned)
        - Contributions
        """
        key_points = {
            "research_problem": "",
            "methodology": "",
            "dataset": "",
            "contributions": ""
        }
        
        # Split into sentences
        sentences = re.split(r'[.!?]+', abstract)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Identify research problem (usually in first 1-2 sentences)
        problem_keywords = ['problem', 'challenge', 'issue', 'difficulty', 'limitation']
        for sentence in sentences[:3]:
            if any(kw in sentence.lower() for kw in problem_keywords):
                key_points["research_problem"] = sentence
                break
        
        if not key_points["research_problem"] and sentences:
            key_points["research_problem"] = sentences[0]
        
        # Identify methodology
        method_keywords = [
            'method', 'approach', 'technique', 'algorithm', 'framework',
            'model', 'system', 'propose', 'develop', 'introduce', 'present'
        ]
        for sentence in sentences:
            if any(kw in sentence.lower() for kw in method_keywords):
                key_points["methodology"] = sentence
                break
        
        # Identify dataset
        data_keywords = ['dataset', 'data', 'corpus', 'benchmark', 'experiment']
        for sentence in sentences:
            if any(kw in sentence.lower() for kw in data_keywords):
                key_points["dataset"] = sentence
                break
        
        # Identify contributions
        contrib_keywords = [
            'contribution', 'result', 'achieve', 'improve', 'outperform',
            'demonstrate', 'show', 'effective', 'performance'
        ]
        for sentence in sentences[-3:]:  # Usually at the end
            if any(kw in sentence.lower() for kw in contrib_keywords):
                key_points["contributions"] = sentence
                break
        
        return key_points
    
    def _generate_neutral_summary(self, abstract: str, key_points: Dict[str, str]) -> str:
        """
        Generate a neutral, objective summary
        Combines extracted key points into coherent text
        """
        summary_parts = []
        
        # Start with research problem
        if key_points["research_problem"]:
            summary_parts.append(f"This paper addresses {key_points['research_problem'].lower()}")
        else:
            summary_parts.append("This paper presents research in the given domain.")
        
        # Add methodology
        if key_points["methodology"]:
            summary_parts.append(key_points["methodology"])
        
        # Add dataset info if available
        if key_points["dataset"]:
            summary_parts.append(key_points["dataset"])
        
        # Add contributions
        if key_points["contributions"]:
            summary_parts.append(key_points["contributions"])
        
        # Join into coherent summary
        summary = " ".join(summary_parts)
        
        # If too short, add more context from abstract
        if len(summary.split()) < 100:
            sentences = re.split(r'[.!?]+', abstract)
            for sentence in sentences:
                if sentence.strip() not in summary:
                    summary += " " + sentence.strip()
                    if len(summary.split()) >= 150:
                        break
        
        return summary.strip()
    
    def _expand_summary(self, summary: str, abstract: str) -> str:
        """Expand summary if it's too short"""
        sentences = re.split(r'[.!?]+', abstract)
        for sentence in sentences:
            if sentence.strip() not in summary:
                summary += " " + sentence.strip() + "."
                if len(summary.split()) >= settings.SUMMARY_MIN_LENGTH:
                    break
        return summary
    
    def _truncate_summary(self, summary: str, max_words: int) -> str:
        """Truncate summary to max word count"""
        words = summary.split()
        if len(words) <= max_words:
            return summary
        
        # Truncate at sentence boundary
        truncated = " ".join(words[:max_words])
        last_period = truncated.rfind('.')
        if last_period > 0:
            return truncated[:last_period + 1]
        return truncated + "..."
    
    def calculate_similarity(self, request: SimilarityRequest) -> SimilarityResponse:
        """
        Calculate similarity between reviewer expertise and paper topics
        Helps reviewers decide whether to bid on a paper
        
        Based on keyword matching and abstract analysis
        """
        if not settings.ENABLE_REVIEWER_SIMILARITY:
            audit_logger.log_feature_disabled(request.reviewer_id, AIFeature.REVIEWER_SIMILARITY)
            raise ValueError("Similarity calculation feature is currently disabled")
        
        reviewer_keywords = [k.lower() for k in request.reviewer_expertise]
        paper_keywords = [k.lower() for k in request.paper_keywords]
        abstract = request.paper_abstract.lower()
        
        # 1. Direct keyword matching
        matching_topics = []
        keyword_score = 0.0
        
        for rev_kw in reviewer_keywords:
            for paper_kw in paper_keywords:
                if rev_kw == paper_kw or rev_kw in paper_kw or paper_kw in rev_kw:
                    matching_topics.append(paper_kw)
                    keyword_score += 1.0
        
        # Normalize keyword score
        if reviewer_keywords and paper_keywords:
            keyword_score = keyword_score / max(len(reviewer_keywords), len(paper_keywords))
        
        # 2. Abstract content matching
        abstract_score = 0.0
        for rev_kw in reviewer_keywords:
            if rev_kw in abstract:
                abstract_score += 1.0
        
        if reviewer_keywords:
            abstract_score = abstract_score / len(reviewer_keywords)
        
        # 3. Combined similarity score (weighted average)
        similarity_score = (keyword_score * 0.6 + abstract_score * 0.4)
        similarity_score = min(similarity_score, 1.0)
        
        # Generate recommendation
        if similarity_score >= 0.7:
            recommendation = "High match"
            explanation = (
                f"Strong alignment detected. {len(matching_topics)} matching topics found. "
                f"Your expertise closely matches the paper's focus areas."
            )
        elif similarity_score >= 0.4:
            recommendation = "Moderate match"
            explanation = (
                f"Partial alignment detected. {len(matching_topics)} matching topics found. "
                f"You have relevant expertise for reviewing this paper."
            )
        else:
            recommendation = "Low match"
            explanation = (
                f"Limited alignment detected. {len(matching_topics)} matching topics found. "
                f"The paper may be outside your primary expertise areas."
            )
        
        response = SimilarityResponse(
            similarity_score=round(similarity_score, 3),
            matching_topics=list(set(matching_topics)),
            explanation=explanation,
            recommendation=recommendation
        )
        
        # Log the operation
        audit_logger.log_ai_operation(
            user_id=request.reviewer_id,
            user_role=UserRole.REVIEWER,
            feature=AIFeature.REVIEWER_SIMILARITY,
            input_text=abstract,
            output_data={
                "similarity_score": similarity_score,
                "recommendation": recommendation
            },
            applied=False
        )
        
        return response


# Global service instance
reviewer_service = ReviewerAIService()
