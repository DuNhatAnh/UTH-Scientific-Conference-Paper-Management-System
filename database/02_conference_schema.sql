-- ============================================
-- Conference Service Database Schema (Simplified)
-- UTH-ConfMS - Conference Management
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CONFERENCES TABLE
-- ============================================
CREATE TABLE conferences (
    conference_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    acronym VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    
    -- Important dates
    submission_deadline TIMESTAMP,
    notification_date TIMESTAMP,
    camera_ready_deadline TIMESTAMP,
    
    -- Settings
    review_mode VARCHAR(50) DEFAULT 'DOUBLE_BLIND', -- SINGLE_BLIND, DOUBLE_BLIND
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, ACTIVE, COMPLETED
    visibility VARCHAR(50) DEFAULT 'PRIVATE', -- PRIVATE, PUBLIC
    
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conferences_acronym ON conferences(acronym);
CREATE INDEX idx_conferences_status ON conferences(status);

-- ============================================
-- CONFERENCE_TRACKS TABLE
-- ============================================
CREATE TABLE conference_tracks (
    track_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conference_tracks_conference_id ON conference_tracks(conference_id);

-- ============================================
-- CONFERENCE_TOPICS TABLE
-- ============================================
CREATE TABLE conference_topics (
    topic_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    name VARCHAR(300) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conference_topics_conference_id ON conference_topics(conference_id);

-- ============================================
-- COMMITTEE_MEMBERS TABLE
-- ============================================
CREATE TABLE committee_members (
    member_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL, -- CHAIR, PC_MEMBER, REVIEWER
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (conference_id, user_id, role)
);

CREATE INDEX idx_committee_members_conference_id ON committee_members(conference_id);
CREATE INDEX idx_committee_members_user_id ON committee_members(user_id);

-- ============================================
-- CALL_FOR_PAPERS TABLE
-- ============================================
CREATE TABLE call_for_papers (
    cfp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    submission_guidelines TEXT,
    formatting_requirements TEXT,
    accepted_file_formats VARCHAR(100) DEFAULT 'PDF',
    max_file_size_mb INTEGER DEFAULT 10,
    min_pages INTEGER,
    max_pages INTEGER,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cfp_conference_id ON call_for_papers(conference_id);

-- ============================================
-- CONFERENCE_DEADLINES TABLE
-- ============================================
CREATE TABLE conference_deadlines (
    deadline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conference_id UUID NOT NULL REFERENCES conferences(conference_id) ON DELETE CASCADE,
    deadline_type VARCHAR(50) NOT NULL, -- SUBMISSION, NOTIFICATION, CAMERA_READY, REGISTRATION
    name VARCHAR(200) NOT NULL,
    description TEXT,
    deadline_date TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_hard_deadline BOOLEAN DEFAULT FALSE,
    grace_period_hours INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conference_deadlines_conference_id ON conference_deadlines(conference_id);

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

CREATE TRIGGER update_conferences_updated_at BEFORE UPDATE ON conferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- 1. Create a default Conference
INSERT INTO conferences (name, acronym, description, start_date, end_date, submission_deadline, notification_date, created_by)
SELECT 
    'International Conference on Computer Science 2026', 
    'ICCS 2026', 
    'Annual conference on computer science advancements.', 
    '2026-12-01', 
    '2026-12-05', 
    '2026-10-01', 
    '2026-11-01', 
    u.user_id
FROM users u 
WHERE u.email = 'admin@uth.edu.vn'
AND NOT EXISTS (SELECT 1 FROM conferences WHERE acronym = 'ICCS 2026');

-- 2. Create Tracks for the Conference
INSERT INTO conference_tracks (conference_id, name)
SELECT c.conference_id, 'Artificial Intelligence'
FROM conferences c WHERE c.acronym = 'ICCS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_tracks t WHERE t.conference_id = c.conference_id AND t.name = 'Artificial Intelligence');

INSERT INTO conference_tracks (conference_id, name)
SELECT c.conference_id, 'Software Engineering'
FROM conferences c WHERE c.acronym = 'ICCS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_tracks t WHERE t.conference_id = c.conference_id AND t.name = 'Software Engineering');

-- 3. Assign Committee Members
-- Assign Chair
INSERT INTO committee_members (conference_id, user_id, role)
SELECT c.conference_id, u.user_id, 'CHAIR'
FROM conferences c, users u
WHERE c.acronym = 'ICCS 2026' AND u.email = 'chair@uth.edu.vn'
ON CONFLICT (conference_id, user_id, role) DO NOTHING;

-- Assign Reviewer
INSERT INTO committee_members (conference_id, user_id, role)
SELECT c.conference_id, u.user_id, 'REVIEWER'
FROM conferences c, users u
WHERE c.acronym = 'ICCS 2026' AND u.email = 'reviewer@uth.edu.vn'
ON CONFLICT (conference_id, user_id, role) DO NOTHING;

-- 4. Create Call for Papers for the Conference
INSERT INTO call_for_papers (cfp_id, conference_id, title, content, submission_guidelines, formatting_requirements, accepted_file_formats, max_file_size_mb, min_pages, max_pages, is_published, published_at)
SELECT 
    uuid_generate_v4(), 
    c.conference_id, 
    'Call for Papers - ICCS 2026', 
    'We invite original research papers addressing recent advances in Computer Science. Topics include but are not limited to: Artificial Intelligence, Machine Learning, Software Engineering, Data Science, Cybersecurity, and Computer Networks.',
    'All submissions must be original work not previously published or under review elsewhere. Authors should submit full papers (not abstracts). Papers will undergo double-blind peer review.',
    'Papers must be formatted according to IEEE conference format. Use the IEEE Conference Template available at ieee.org. References should follow IEEE citation style.',
    'PDF,DOCX', 
    10, 
    6, 
    8, 
    TRUE,
    CURRENT_TIMESTAMP
FROM conferences c WHERE c.acronym = 'ICCS 2026'
AND NOT EXISTS (SELECT 1 FROM call_for_papers cfp WHERE cfp.conference_id = c.conference_id);

-- 5. Create Additional Conference with Tracks and CFP
INSERT INTO conferences (name, acronym, description, location, start_date, end_date, submission_deadline, notification_date, camera_ready_deadline, review_mode, status, visibility, created_by)
SELECT 
    'International Symposium on Data Science 2026', 
    'ISDS 2026', 
    'A premier symposium focusing on data science, big data analytics, and machine learning applications.', 
    'Ho Chi Minh City, Vietnam',
    '2026-11-15', 
    '2026-11-18', 
    '2026-09-15 23:59:00', 
    '2026-10-20 23:59:00',
    '2026-11-01 23:59:00',
    'DOUBLE_BLIND',
    'ACTIVE',
    'PUBLIC',
    u.user_id
FROM users u 
WHERE u.email = 'admin@uth.edu.vn'
AND NOT EXISTS (SELECT 1 FROM conferences WHERE acronym = 'ISDS 2026');

-- 6. Create Tracks for ISDS 2026
INSERT INTO conference_tracks (conference_id, name)
SELECT c.conference_id, 'Data Mining'
FROM conferences c WHERE c.acronym = 'ISDS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_tracks t WHERE t.conference_id = c.conference_id AND t.name = 'Data Mining');

INSERT INTO conference_tracks (conference_id, name)
SELECT c.conference_id, 'Machine Learning'
FROM conferences c WHERE c.acronym = 'ISDS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_tracks t WHERE t.conference_id = c.conference_id AND t.name = 'Machine Learning');

INSERT INTO conference_tracks (conference_id, name)
SELECT c.conference_id, 'Big Data Analytics'
FROM conferences c WHERE c.acronym = 'ISDS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_tracks t WHERE t.conference_id = c.conference_id AND t.name = 'Big Data Analytics');

-- 7. Create Topics for ICCS 2026
INSERT INTO conference_topics (conference_id, name)
SELECT c.conference_id, 'Deep Learning and Neural Networks'
FROM conferences c WHERE c.acronym = 'ICCS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_topics t WHERE t.conference_id = c.conference_id AND t.name = 'Deep Learning and Neural Networks');

INSERT INTO conference_topics (conference_id, name)
SELECT c.conference_id, 'Cloud Computing'
FROM conferences c WHERE c.acronym = 'ICCS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_topics t WHERE t.conference_id = c.conference_id AND t.name = 'Cloud Computing');

INSERT INTO conference_topics (conference_id, name)
SELECT c.conference_id, 'Internet of Things'
FROM conferences c WHERE c.acronym = 'ICCS 2026'
AND NOT EXISTS (SELECT 1 FROM conference_topics t WHERE t.conference_id = c.conference_id AND t.name = 'Internet of Things');
