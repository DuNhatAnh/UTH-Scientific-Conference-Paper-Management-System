-- ============================================
-- Notification Service Database Schema (Simplified)
-- UTH-ConfMS - Notifications
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- SUBMISSION, REVIEW, DECISION, SYSTEM
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    related_entity_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- EMAIL_QUEUE TABLE
-- ============================================
CREATE TABLE email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, FAILED
    sent_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_queue_status ON email_queue(status);

-- ============================================
-- EMAIL_TEMPLATES TABLE
-- ============================================
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    body_template TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- SUBMISSION, REVIEW, DECISION
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT INTO email_templates (name, subject, body_template, template_type) VALUES
('submission_confirmation', 'Submission Confirmation', 'Your paper "{{title}}" has been submitted successfully.', 'SUBMISSION'),
('review_invitation', 'Review Invitation', 'You have been invited to review paper {{paper_number}}.', 'REVIEW'),
('decision_notification', 'Decision Notification', 'The decision for your paper "{{title}}" is: {{decision}}.', 'DECISION');

