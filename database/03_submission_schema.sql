-- ============================================
-- Submission Service Database Schema (Simplified)
-- UTH-ConfMS - Paper Submissions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SUBMISSIONS TABLE
-- ============================================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL,
    track_id UUID,
    paper_number INT,
    
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED
    
    submitted_by UUID NOT NULL,
    submitted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_conference_id ON submissions(conference_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_by ON submissions(submitted_by);

-- ============================================
-- SUBMISSION_AUTHORS TABLE
-- ============================================
CREATE TABLE submission_authors (
    author_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    user_id UUID,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    affiliation VARCHAR(255),
    is_corresponding BOOLEAN DEFAULT FALSE,
    author_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submission_authors_submission_id ON submission_authors(submission_id);

-- ============================================
-- SUBMISSION_FILES TABLE
-- ============================================
CREATE TABLE submission_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- PDF, DOCX
    is_main_paper BOOLEAN DEFAULT TRUE,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submission_files_submission_id ON submission_files(submission_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- 1. Create Dummy Submission
INSERT INTO submissions (conference_id, track_id, paper_number, title, abstract, status, submitted_by, submitted_at)
SELECT 
    c.conference_id, 
    t.track_id, 
    101, 
    'Deep Learning for Autonomous Vehicles', 
    'This paper explores advanced DL techniques for self-driving cars.', 
    'SUBMITTED', 
    u.user_id, 
    CURRENT_TIMESTAMP
FROM conferences c
JOIN conference_tracks t ON c.conference_id = t.conference_id
JOIN users u ON u.email = 'author@uth.edu.vn'
WHERE c.acronym = 'ICCS 2026' AND t.name = 'Artificial Intelligence'
AND NOT EXISTS (SELECT 1 FROM submissions WHERE title = 'Deep Learning for Autonomous Vehicles');

-- 2. Add Author to Submission
INSERT INTO submission_authors (submission_id, user_id, full_name, email, affiliation, is_corresponding, author_order)
SELECT 
    s.id, 
    u.user_id, 
    u.full_name, 
    u.email, 
    u.affiliation, 
    TRUE, 
    1
FROM submissions s
JOIN users u ON u.email = 'author@uth.edu.vn'
WHERE s.title = 'Deep Learning for Autonomous Vehicles'
AND NOT EXISTS (SELECT 1 FROM submission_authors sa WHERE sa.submission_id = s.id AND sa.email = 'author@uth.edu.vn');

-- 3. Create More Submissions for ICCS 2026
INSERT INTO submissions (conference_id, track_id, paper_number, title, abstract, status, submitted_by, submitted_at)
SELECT 
    c.conference_id, 
    t.track_id, 
    102, 
    'Blockchain Technology for Secure Data Management', 
    'This paper presents a novel blockchain-based approach for securing sensitive data in distributed systems. We propose a decentralized architecture that ensures data integrity and privacy.', 
    'SUBMITTED', 
    u.user_id, 
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM conferences c
JOIN conference_tracks t ON c.conference_id = t.conference_id
JOIN users u ON u.email = 'pandaxm2911@gmail.com'
WHERE c.acronym = 'ICCS 2026' AND t.name = 'Software Engineering'
AND NOT EXISTS (SELECT 1 FROM submissions WHERE title = 'Blockchain Technology for Secure Data Management');

INSERT INTO submission_authors (submission_id, user_id, full_name, email, affiliation, is_corresponding, author_order)
SELECT 
    s.id, 
    u.user_id, 
    u.full_name, 
    u.email, 
    u.affiliation, 
    TRUE, 
    1
FROM submissions s
JOIN users u ON u.email = 'pandaxm2911@gmail.com'
WHERE s.title = 'Blockchain Technology for Secure Data Management'
AND NOT EXISTS (SELECT 1 FROM submission_authors sa WHERE sa.submission_id = s.id AND sa.email = 'pandaxm2911@gmail.com');

-- 4. Create Submission for ICCS 2026 - AI Track
INSERT INTO submissions (conference_id, track_id, paper_number, title, abstract, status, submitted_by, submitted_at)
SELECT 
    c.conference_id, 
    t.track_id, 
    103, 
    'Natural Language Processing with Transformer Models', 
    'We explore state-of-the-art transformer architectures for various NLP tasks including machine translation, sentiment analysis, and question answering. Experimental results demonstrate significant improvements over baseline models.', 
    'UNDER_REVIEW', 
    u.user_id, 
    CURRENT_TIMESTAMP - INTERVAL '5 days'
FROM conferences c
JOIN conference_tracks t ON c.conference_id = t.conference_id
JOIN users u ON u.email = 'author@uth.edu.vn'
WHERE c.acronym = 'ICCS 2026' AND t.name = 'Artificial Intelligence'
AND NOT EXISTS (SELECT 1 FROM submissions WHERE title = 'Natural Language Processing with Transformer Models');

INSERT INTO submission_authors (submission_id, user_id, full_name, email, affiliation, is_corresponding, author_order)
SELECT 
    s.id, 
    u.user_id, 
    u.full_name, 
    u.email, 
    u.affiliation, 
    TRUE, 
    1
FROM submissions s
JOIN users u ON u.email = 'author@uth.edu.vn'
WHERE s.title = 'Natural Language Processing with Transformer Models'
AND NOT EXISTS (SELECT 1 FROM submission_authors sa WHERE sa.submission_id = s.id AND sa.email = 'author@uth.edu.vn');

-- 5. Create Draft Submission (not yet submitted)
INSERT INTO submissions (conference_id, track_id, paper_number, title, abstract, status, submitted_by, submitted_at)
SELECT 
    c.conference_id, 
    t.track_id, 
    104, 
    'Edge Computing for IoT Applications', 
    'A comprehensive study on edge computing architectures optimized for Internet of Things deployments. We analyze latency, bandwidth, and computational efficiency trade-offs.', 
    'DRAFT', 
    u.user_id,
    NULL
FROM conferences c
JOIN conference_tracks t ON c.conference_id = t.conference_id
JOIN users u ON u.email = 'pandaxm2911@gmail.com'
WHERE c.acronym = 'ICCS 2026' AND t.name = 'Artificial Intelligence'
AND NOT EXISTS (SELECT 1 FROM submissions WHERE title = 'Edge Computing for IoT Applications');

INSERT INTO submission_authors (submission_id, user_id, full_name, email, affiliation, is_corresponding, author_order)
SELECT 
    s.id, 
    u.user_id, 
    u.full_name, 
    u.email, 
    u.affiliation, 
    TRUE, 
    1
FROM submissions s
JOIN users u ON u.email = 'pandaxm2911@gmail.com'
WHERE s.title = 'Edge Computing for IoT Applications'
AND NOT EXISTS (SELECT 1 FROM submission_authors sa WHERE sa.submission_id = s.id AND sa.email = 'pandaxm2911@gmail.com');
