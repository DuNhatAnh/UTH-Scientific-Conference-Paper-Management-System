"""
Audit Logging System
Provides comprehensive audit trail for all AI operations
Ensures transparency and accountability
"""

import hashlib
import json
import os
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path
import logging

from models import AuditLogEntry, AIFeature, UserRole
from config import settings


class AuditLogger:
    """Centralized audit logging for AI operations"""
    
    def __init__(self):
        # Create logs directory if it doesn't exist
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        # Setup file logger
        self.logger = logging.getLogger("ai_audit")
        self.logger.setLevel(logging.INFO)
        
        # File handler
        handler = logging.FileHandler(settings.AUDIT_LOG_PATH)
        handler.setLevel(logging.INFO)
        
        # Format: timestamp | user_id | feature | input_hash | output_preview | applied
        formatter = logging.Formatter(
            '%(asctime)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
    
    def _hash_input(self, text: str) -> str:
        """
        Create SHA-256 hash of input text for privacy
        Allows tracking without storing sensitive content
        """
        if not settings.HASH_INPUT_IN_LOGS:
            # If hashing disabled, return truncated text
            return text[:50] + "..." if len(text) > 50 else text
        
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def _preview_output(self, output: Any) -> str:
        """Create a preview of output (first 100 chars)"""
        if isinstance(output, str):
            preview = output[:100]
        elif isinstance(output, dict):
            preview = str(output)[:100]
        else:
            preview = str(output)[:100]
        
        return preview + "..." if len(str(output)) > 100 else preview
    
    def log_ai_operation(
        self,
        user_id: str,
        user_role: UserRole,
        feature: AIFeature,
        input_text: str,
        output_data: Any,
        applied: bool = False,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Log an AI operation to audit trail
        
        Args:
            user_id: ID of the user performing the operation
            user_role: Role of the user (Author, Reviewer, Chair)
            feature: Which AI feature was used
            input_text: Input text (will be hashed if configured)
            output_data: Output from AI (will be previewed)
            applied: Whether the user applied the suggestion
            metadata: Additional metadata (paper_id, etc.)
        
        Returns:
            log_id: Unique identifier for this log entry
        """
        if not settings.ENABLE_AUDIT_LOGGING:
            return "logging_disabled"
        
        # Generate unique log ID
        log_id = hashlib.sha256(
            f"{user_id}{feature}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]
        
        # Create hash of input
        input_hash = self._hash_input(input_text)
        
        # Create preview of output
        output_preview = self._preview_output(output_data)
        
        # Create log entry
        log_entry = AuditLogEntry(
            log_id=log_id,
            user_id=user_id,
            user_role=user_role,
            feature=feature,
            timestamp=datetime.utcnow(),
            input_hash=input_hash,
            output_preview=output_preview,
            applied=applied,
            metadata=metadata or {}
        )
        
        # Format log message
        log_message = (
            f"{user_id} | {user_role.value} | {feature.value} | "
            f"{input_hash} | {output_preview} | applied={applied}"
        )
        
        if metadata:
            log_message += f" | metadata={json.dumps(metadata)}"
        
        # Write to log
        self.logger.info(log_message)
        
        return log_id
    
    def log_error(
        self,
        user_id: str,
        feature: AIFeature,
        error_message: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an error that occurred during AI operation"""
        if not settings.ENABLE_AUDIT_LOGGING:
            return
        
        log_message = f"ERROR | {user_id} | {feature.value} | {error_message}"
        if metadata:
            log_message += f" | {json.dumps(metadata)}"
        
        self.logger.error(log_message)
    
    def log_feature_disabled(
        self,
        user_id: str,
        feature: AIFeature
    ):
        """Log when a user tries to access a disabled feature"""
        if not settings.ENABLE_AUDIT_LOGGING:
            return
        
        log_message = f"FEATURE_DISABLED | {user_id} | {feature.value}"
        self.logger.warning(log_message)


# Global audit logger instance
audit_logger = AuditLogger()
