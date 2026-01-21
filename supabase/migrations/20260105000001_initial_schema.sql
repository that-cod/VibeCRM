-- VibeCRM Initial Schema Migration
-- Created: 2026-01-05
-- Description: Core tables for VibeCRM system (projects, vibe_configs, decision_traces)

BEGIN;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Projects table: Stores user's CRM projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Vibe Configs table: Stores AI-generated CRM schemas
CREATE TABLE IF NOT EXISTS vibe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schema_version TEXT NOT NULL, -- Semver (1.0.0)
  schema_json JSONB NOT NULL,   -- Full CRM schema definition
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Decision Traces table: AI decision history for transparency
CREATE TABLE IF NOT EXISTS decision_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,          -- User's prompt
  action TEXT NOT NULL,           -- What was generated
  precedent TEXT,                 -- AI reasoning
  version TEXT NOT NULL,          -- Schema version
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  schema_before JSONB,            -- Optional: before state
  schema_after JSONB              -- Optional: after state
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_project_id ON vibe_configs(project_id);
CREATE INDEX IF NOT EXISTS idx_vibe_configs_active ON vibe_configs(project_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vibe_configs_user_id ON vibe_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_traces_project_id ON decision_traces(project_id);
CREATE INDEX IF NOT EXISTS idx_decision_traces_user_id ON decision_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_traces_timestamp ON decision_traces(timestamp DESC);

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Only one active config per project
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_config 
ON vibe_configs(project_id) WHERE is_active = true;

-- One project per user (MVP constraint)
CREATE UNIQUE INDEX IF NOT EXISTS one_project_per_user ON projects(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_traces ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access their own projects
CREATE POLICY user_projects ON projects
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Vibe Configs: Users can only access configs for their projects
CREATE POLICY user_configs ON vibe_configs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Decision Traces: Users can only access traces for their projects
CREATE POLICY user_traces ON decision_traces
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects.updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
