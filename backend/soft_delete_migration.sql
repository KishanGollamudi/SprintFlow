-- ═══════════════════════════════════════════════════════════════
-- SprintFlow — Soft Delete Migration
-- Add deleted_at column to sprints table for soft delete functionality
-- ═══════════════════════════════════════════════════════════════

USE sprintflow_db;

-- Add deleted_at column to sprints table
ALTER TABLE sprints 
ADD COLUMN deleted_at DATETIME NULL 
AFTER updated_at;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_sprints_deleted_at ON sprints(deleted_at);

-- Verify the change
DESCRIBE sprints;