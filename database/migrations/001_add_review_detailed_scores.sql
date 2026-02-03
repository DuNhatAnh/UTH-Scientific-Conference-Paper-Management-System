-- ============================================
-- Migration: Add detailed scores and confidential comments to reviews table
-- UTH-ConfMS - Review Service
-- Date: 2026-02-03
-- ============================================

-- Add new columns for detailed scores
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS novelty_score INT NOT NULL DEFAULT 5;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS methodology_score INT NOT NULL DEFAULT 5;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS presentation_score INT NOT NULL DEFAULT 5;

-- Rename comments to comments_for_author
ALTER TABLE reviews RENAME COLUMN comments TO comments_for_author;

-- Add confidential_comments column
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS confidential_comments TEXT;

-- Migrate existing data: copy overall_score to the three detailed scores
UPDATE reviews
SET
    novelty_score = overall_score,
    methodology_score = overall_score,
    presentation_score = overall_score
WHERE
    novelty_score = 5
    AND methodology_score = 5
    AND presentation_score = 5;

-- Done!
SELECT 'Migration completed: Added novelty_score, methodology_score, presentation_score, confidential_comments to reviews table' AS status;