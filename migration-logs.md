# VibeCRM Migration & Logic Logs

## Architecture Decisions (Finalized 2026-01-05)

### ✅ Multi-Tenancy: RLS-Based Isolation
- **Strategy:** Shared database schema with Row-Level Security policies
- **Rationale:** 
  - Better performance (no schema switching overhead)
  - Simpler infrastructure (fits Supabase free tier)
  - Battle-tested RLS implementation in Supabase
- **Constraint:** One project per user (MVP)
- **Implementation:** Every table includes `user_id UUID REFERENCES auth.users(id)` with RLS policy filtering by `auth.uid()`

### ✅ Schema Evolution: Supabase Migrations
- **Strategy:** Built-in Supabase migration system
- **AI Role:** Claude generates `ALTER TABLE` statements
- **Safety:** Double confirmation for destructive operations
- **Conflict Resolution:** Last-write-wins (new schema prioritized)
- **Rollback:** Not supported in MVP (future enhancement)

### ✅ State Management: Optimistic Updates
- **Pattern:** Refine's `useForm` with built-in optimistic locking
- **Concurrent Edits:** Last write wins (no merge conflict UI)
- **Schema Locks:** Only one user can modify a project's schema at a time (5-min TTL)

---

## [2026-01-05] Initial Infrastructure

### Core Application
- **Base App:** Next.js App Router initialized
- **Refine:** Core provider setup with Supabase data provider
- **Auth:** Supabase Auth (email/password + OAuth)
- **UI:** Tailwind CSS + shadcn/ui theme configured
- **Theme Tokens:** Defined in `THEME_TOKENS.md` (CRM-specific colors)

### Database Schema (Public Schema)

#### Core Tables Created
```sql
-- Auth handled by Supabase (auth.users)

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE vibe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  schema_version TEXT NOT NULL, -- Semver (1.0.0)
  schema_json JSONB NOT NULL,   -- Full CRM schema definition
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE decision_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  intent TEXT NOT NULL,         -- User's prompt
  action TEXT NOT NULL,          -- What was generated
  precedent TEXT,                -- AI reasoning
  version TEXT,                  -- Schema version
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_vibe_configs_project_id ON vibe_configs(project_id);
CREATE INDEX idx_vibe_configs_active ON vibe_configs(project_id, is_active) WHERE is_active = true;
CREATE INDEX idx_decision_traces_project_id ON decision_traces(project_id);
CREATE INDEX idx_decision_traces_timestamp ON decision_traces(timestamp DESC);
```

#### RLS Policies Applied
```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibe_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_traces ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access their own projects
CREATE POLICY user_projects ON projects
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Vibe Configs: Users can only access configs for their projects
CREATE POLICY user_configs ON vibe_configs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Decision Traces: Users can only access traces for their projects
CREATE POLICY user_traces ON decision_traces
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

#### Constraints Added
```sql
-- Only one active config per project
CREATE UNIQUE INDEX unique_active_config ON vibe_configs(project_id) WHERE is_active = true;

-- Enforce one project per user (MVP constraint)
CREATE UNIQUE INDEX one_project_per_user ON projects(user_id);
```

### Updated At Triggers
```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## [2026-01-05] Architectural Documentation Completed

### Specifications Created
- ✅ `SCHEMA_VALIDATION_SPEC.md` - AI schema validation pipeline
- ✅ `MULTI_TENANCY_DESIGN.md` - RLS implementation guide
- ✅ `THEME_TOKENS.md` - SaaS 2.0 design system tokens
- ✅ `MOBILE_RESPONSIVE_SPEC.md` - Responsive breakpoints & patterns
- ✅ `VIBE_REPLAY_SPEC.md` - AI transparency UI specification

### Documentation Updated
- ✅ `instructions.md` - Production-ready dev rules with security, performance, a11y
- ✅ `api-contracts.json` - Complete entity definitions with validation pipeline
- ✅ `subagents.md` - Enhanced with security, performance, a11y agents
- ✅ `components.md` - Added responsive patterns and theme integration
- ✅ `claude.md` - Updated with validation gates and security patterns

---

## Pending Actions

### Phase 1: Core Backend (PRIORITY)
- [ ] **API Route: `/api/v1/generate`**
  - Connect to Claude 3.5 Sonnet API
  - Implement pre-generation validation (quota, intent, entity count)
  - Implement post-generation validation (Zod schema, reserved words, foreign keys, circular deps)
  - Create decision_trace record for each generation
  - Return validated schema_json + warnings

- [ ] **API Route: `/api/v1/provision`**
  - Implement schema lock acquisition (prevent concurrent modifications)
  - Generate SQL from validated schema_json (NO raw SQL accepted)
  - Create RLS policies for all user-generated tables
  - Wrap in transaction with rollback on error
  - Update vibe_configs with new schema

- [ ] **API Route: `/api/v1/vibe-replay/:project_id`**
  - Fetch decision_traces for project
  - Return schema version history
  - Format for timeline UI display

- [ ] **API Route: `/api/v1/schema-lock/:project_id`**
  - Implement distributed lock (Redis or Supabase function)
  - 5-minute TTL with auto-release
  - Return lock status and holder

### Phase 2: Frontend Foundation (PRIORITY)
- [ ] **Dynamic Table Renderer**
  - Parse `ui_hints` metadata from schema
  - Map PostgreSQL types to shadcn components (text → Input, enum → Select, etc.)
  - Handle nested relationships with `useSelect` hook
  - Implement responsive layouts (mobile card view, desktop table)

- [ ] **Project Creation Flow**
  - Landing page with prompt input
  - Auth modal (Supabase Auth with email/OAuth)
  - Schema generation loading state (with skeleton)
  - ER diagram preview before provisioning
  - Confirmation checkboxes UI

- [ ] **Vibe Replay Timeline UI**
  - Chronological list of decision_traces
  - Syntax-highlighted schema diffs
  - "What changed" summaries
  - (Future) Undo capability

- [ ] **Command Palette (Cmd+K)**
  - Global search across all entities
  - Quick actions: Create, Search, Navigate
  - Recent items
  - Keyboard shortcuts help

### Phase 3: Quality & Optimization
- [ ] **Subagent Implementation**
  - Agent 1: Type check + Lint (npm scripts)
  - Agent 2: Schema verifier (compare api-contracts.json to Supabase types)
  - Agent 3: Context graph sentry (verify decision_traces in forms)
  - Agent 4: Security auditor (secrets, SQL injection, CSRF)
  - Agent 5: Performance validator (N+1 queries, bundle size)
  - Agent 6: Accessibility checker (ARIA, keyboard nav, contrast)

- [ ] **Testing Suite**
  - Unit tests: Validators, SQL generator, UI components
  - Integration tests: Full prompt → provision pipeline
  - E2E tests: Playwright for user flows
  - Security tests: SQL injection attempts, RLS policy bypass attempts

- [ ] **Performance Optimization**
  - Implement React.memo for expensive components
  - Code splitting for dynamic renderer
  - Image optimization (Next.js Image component)
  - Bundle analysis and tree-shaking

### Phase 4: Advanced Features (Post-MVP)
- [ ] **Schema Versioning & Rollback**
  - Store full schema snapshots in vibe_configs
  - Implement rollback UI (revert to previous version)
  - Data migration scripts for version changes

- [ ] **Multi-Project Support**
  - Remove `one_project_per_user` constraint
  - Add project switcher UI
  - Quota enforcement per tier (free: 1, pro: 10, enterprise: unlimited)

- [ ] **Collaboration Features**
  - Optimistic locking with conflict resolution UI
  - Real-time updates via Supabase Realtime
  - Activity feed (who changed what)

- [ ] **Import/Export**
  - CSV import for bulk data
  - JSON export for backup
  - Schema export as SQL file

---

## Migration History

### M001: Initial Schema (2026-01-05)
**Status:** ✅ Completed  
**Tables:** `projects`, `vibe_configs`, `decision_traces`  
**Policies:** RLS enabled with `auth.uid()` filtering  
**Indexes:** Foreign keys, timestamps, active configs  

### M002: Schema Lock System (Pending)
**Status:** ⏸️ Blocked (needs Redis or Supabase edge function)  
**Purpose:** Prevent concurrent schema modifications  
**Implementation:** `schema_locks` table with TTL or in-memory lock  

---

## Design Decisions Log

### DD-001: Naming Convention ✅ RESOLVED
- **Decision:** TypeScript: PascalCase entities, Database: snake_case plural
- **Example:** `Deal` entity → `deals` table, `CompanyContact` → `company_contacts`
- **Rationale:** Matches PostgreSQL conventions, Supabase type generation compatibility

### DD-002: Foreign Key Cascade Policy ✅ RESOLVED
- **Decision:**
  - `projects` → `vibe_configs`: CASCADE DELETE
  - `projects` → `decision_traces`: CASCADE DELETE
  - User-generated entities: Let AI suggest based on relationships (default: RESTRICT)
- **Rationale:** Project deletion should clean up all associated data

### DD-003: Connection Pooling ✅ RESOLVED
- **Decision:** Use Supabase's built-in PgBouncer pooler
- **Configuration:** Transaction mode for short-lived connections
- **Rationale:** Free tier limits ~60 connections, pooler increases effective capacity

### DD-004: Destructive Operation Confirmation ✅ RESOLVED
- **Decision:** Double confirmation with impact preview
  1. Show warning + typed confirmation ("DELETE PHONE COLUMN")
  2. Second explicit confirmation
- **Rationale:** Prevents accidental data loss from ambiguous prompts

### DD-005: Schema Lock TTL ✅ RESOLVED
- **Decision:** 5-minute lock with auto-release
- **Rationale:** Prevents abandoned locks while allowing time for ER diagram review

---

## Performance Monitoring

### Metrics to Track (Future)
- Schema generation latency (p50, p95, p99)
- Provisioning success rate
- Average tables per project
- RLS policy evaluation time
- API route response times

### Optimization Targets
- `/api/v1/generate`: < 3 seconds (p95)
- `/api/v1/provision`: < 5 seconds (p95)
- Dynamic renderer first paint: < 200ms
- Bundle size: < 500KB (gzipped)

---

## Context Updates Summary

### Files Modified (2026-01-05)
- ✅ `migration-logs.md` (this file) - Expanded with decisions and action items
- ✅ `instructions.md` - Added security, performance, a11y, mobile-first rules
- ✅ `api-contracts.json` - Complete entity and endpoint definitions
- ✅ `subagents.md` - Added security/performance/a11y agents
- ✅ `components.md` - Theme integration and responsive patterns
- ✅ `claude.md` - Validation gates and security patterns

### New Files Created
- ✅ `SCHEMA_VALIDATION_SPEC.md` - AI schema validation pipeline
- ✅ `MULTI_TENANCY_DESIGN.md` - RLS implementation details
- ✅ `THEME_TOKENS.md` - SaaS 2.0 design system
- ✅ `MOBILE_RESPONSIVE_SPEC.md` - Breakpoints and patterns
- ✅ `VIBE_REPLAY_SPEC.md` - AI transparency UI