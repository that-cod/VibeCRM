-- VibeCRM: Add exec_sql Function for Dynamic Schema Provisioning
-- Created: 2026-01-05
-- Description: Secure function for executing dynamic SQL during schema provisioning

BEGIN;

-- ============================================================================
-- DYNAMIC SQL EXECUTION FUNCTION
-- ============================================================================
-- This function allows the backend to execute dynamically generated SQL
-- WARNING: Only accessible via service role key, never exposed to frontend

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with function owner's privileges
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;

-- Restrict access to service role only
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION exec_sql(TEXT) FROM anon;

COMMIT;
