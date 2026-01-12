-- Schema Locks Migration
-- Purpose: Enable concurrent schema modification prevention with TTL-based locks
-- 
-- Reasoning:
-- - Prevents race conditions when multiple users edit same project
-- - 5-minute TTL ensures locks don't block forever
-- - Automatic cleanup of expired locks

BEGIN;

-- Create schema_locks table
CREATE TABLE IF NOT EXISTS schema_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE schema_locks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own locks
CREATE POLICY user_locks ON schema_locks
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for efficient expired lock cleanup
CREATE INDEX idx_schema_locks_expires ON schema_locks(expires_at);
CREATE INDEX idx_schema_locks_project ON schema_locks(project_id);

-- Function to cleanup expired locks (can be called by cron or on-demand)
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM schema_locks WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_locks() TO authenticated;

COMMIT;
