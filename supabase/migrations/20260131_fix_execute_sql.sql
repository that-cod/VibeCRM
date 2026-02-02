-- Fix execute_dynamic_sql function to accept underscores in workspace IDs
-- The table name pattern now uses underscores instead of hyphens in UUIDs

CREATE OR REPLACE FUNCTION public.execute_dynamic_sql(sql_command TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Basic SQL injection prevention
  -- Only allow CREATE TABLE, CREATE INDEX, ALTER TABLE, CREATE POLICY,statements
  IF sql_command !~ '^(CREATE TABLE|CREATE INDEX|CREATE POLICY|CREATE TRIGGER|ALTER TABLE|DROP TABLE|DROP INDEX)' THEN
    RAISE EXCEPTION 'Unauthorized SQL command';
  END IF;
 
  -- Ensure it's operating on workspace_ prefixed tables only
  -- Updated regex to accept underscores in UUID (we replace hyphens with underscores)
  IF sql_command !~ 'workspace_[a-f0-9_]+_[a-z_]+' THEN
    RAISE EXCEPTION 'Table name must follow pattern: workspace_{uuid}_{entity_name}';
  END IF;
  
  -- Execute the command
  EXECUTE sql_command;
  
  result := 'SQL executed successfully';
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing SQL: %', SQLERRM;
END;
$$;

-- Ensure permission is granted
GRANT EXECUTE ON FUNCTION public.execute_dynamic_sql(TEXT) TO service_role;
