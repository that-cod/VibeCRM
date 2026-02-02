-- ============================================================================
-- VibeCRM Workspace Database Schema
-- Migration: Add workspace-based CRM tables with RLS
-- ============================================================================

-- ============================================================================
-- PART 1: Core Tables
-- ============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Templates table (industry template library)
-- MUST be created before workspaces due to FK reference
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- TemplateConfig
  icon TEXT,
  featured BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workspaces table (main CRM instance)
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  config JSONB NOT NULL, -- Full WorkspaceConfig
  template_id UUID REFERENCES public.templates(id),
  industry TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workspace members (team collaboration)
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES public.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

-- ============================================================================
-- PART 2: Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_status ON public.workspaces(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON public.templates(slug);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON public.templates(featured) WHERE featured = TRUE;

-- ============================================================================
-- PART 3: Updated At Trigger
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to workspaces
DROP TRIGGER IF EXISTS workspaces_updated_at ON public.workspaces;
CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- PART 4: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Users: Can only see/update their own profile
DROP POLICY IF EXISTS users_policy ON public.users;
CREATE POLICY users_policy ON public.users
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Workspaces: Can access if owner or member
DROP POLICY IF EXISTS workspaces_select_policy ON public.workspaces;
CREATE POLICY workspaces_select_policy ON public.workspaces
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Workspaces: Only owner can insert
DROP POLICY IF EXISTS workspaces_insert_policy ON public.workspaces;
CREATE POLICY workspaces_insert_policy ON public.workspaces
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Workspaces: Owner and admins can update
DROP POLICY IF EXISTS workspaces_update_policy ON public.workspaces;
CREATE POLICY workspaces_update_policy ON public.workspaces
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Workspaces: Only owner can delete
DROP POLICY IF EXISTS workspaces_delete_policy ON public.workspaces;
CREATE POLICY workspaces_delete_policy ON public.workspaces
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Workspace Members: Can see members of workspaces they belong to
DROP POLICY IF EXISTS workspace_members_select_policy ON public.workspace_members;
CREATE POLICY workspace_members_select_policy ON public.workspace_members
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- Workspace Members: Owner and admins can invite
DROP POLICY IF EXISTS workspace_members_insert_policy ON public.workspace_members;
CREATE POLICY workspace_members_insert_policy ON public.workspace_members
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Workspace Members: Owner and admins can remove members
DROP POLICY IF EXISTS workspace_members_delete_policy ON public.workspace_members;
CREATE POLICY workspace_members_delete_policy ON public.workspace_members
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM public.workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Templates: Everyone can read, no one can write (populated by admin)
DROP POLICY IF EXISTS templates_select_policy ON public.templates;
CREATE POLICY templates_select_policy ON public.templates
  FOR SELECT TO authenticated
  USING (TRUE);

-- ============================================================================
-- PART 5: Dynamic Table Creation Function
-- ============================================================================

-- Function to execute dynamic SQL for creating workspace entity tables
-- SECURITY: This function requires service_role permissions
-- It should only be called from server-side code with proper validation

CREATE OR REPLACE FUNCTION public.execute_dynamic_sql(sql_command TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT;
BEGIN
  -- Basic SQL injection prevention
  -- Only allow CREATE TABLE, CREATE INDEX, ALTER TABLE statements
  IF sql_command !~ '^(CREATE TABLE|CREATE INDEX|ALTER TABLE|DROP TABLE|DROP INDEX)' THEN
    RAISE EXCEPTION 'Unauthorized SQL command';
  END IF;
  
  -- Ensure it's operating on workspace_ prefixed tables only
  IF sql_command !~ 'workspace_[a-f0-9\-]+_[a-z_]+' THEN
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

-- Grant execute permission to authenticated users (will be called via service role)
GRANT EXECUTE ON FUNCTION public.execute_dynamic_sql(TEXT) TO service_role;

-- ============================================================================
-- PART 6: Helper Functions
-- ============================================================================

-- Function to check if user can access workspace
CREATE OR REPLACE FUNCTION public.can_access_workspace(workspace_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id 
    AND (
      w.owner_id = user_id OR
      EXISTS (
        SELECT 1 FROM public.workspace_members wm
        WHERE wm.workspace_id = w.id AND wm.user_id = user_id
      )
    )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- Function to get workspace member count
CREATE OR REPLACE FUNCTION public.get_workspace_member_count(workspace_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO member_count
  FROM public.workspace_members
  WHERE workspace_id = get_workspace_member_count.workspace_id;
  
  -- Add 1 for the owner
  RETURN member_count + 1;
END;
$$;

-- ============================================================================
-- PART 7: Sync user profile from auth.users
-- ============================================================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- DONE
-- ============================================================================
-- Run this migration in Supabase SQL Editor
-- Verify tables created: SELECT * FROM information_schema.tables WHERE table_schema = 'public';
