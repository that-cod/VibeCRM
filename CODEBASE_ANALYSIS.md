# VibeCRM Complete Codebase Analysis

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Complete Data Flow](#complete-data-flow)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Database Schema](#database-schema)
7. [Working Features](#working-features)
8. [Non-Working Features](#non-working-features)
9. [Code Organization](#code-organization)
10. [Integration Points](#integration-points)

---

## 🎯 System Overview

**VibeCRM** is an AI-powered, no-code CRM builder that allows users to:
1. Generate custom CRM schemas using natural language
2. Automatically provision database tables with security
3. Use dynamic CRUD interfaces immediately
4. Export production-ready Next.js code

**Tech Stack:**
- Frontend: Next.js 14 (App Router), React 19, TypeScript
- Backend: Next.js API Routes (Serverless)
- Database: Supabase (PostgreSQL + RLS)
- AI: Anthropic Claude Sonnet 4
- UI: Tailwind CSS, shadcn/ui, Framer Motion

---

## 🏗️ Architecture Diagrams

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Homepage   │  │  Dashboard   │  │   Dynamic    │          │
│  │  (Marketing) │  │   (Main UI)  │  │  CRUD Pages  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  /generate   │  │  /provision  │  │ /export-code │          │
│  │  (AI Schema) │  │  (Database)  │  │  (Code Gen)  │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │  /projects   │  │  /rollback   │  │ /vibe-replay │          │
│  │  (CRUD)      │  │  (Versions)  │  │  (History)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CORE SERVICES                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Claude AI   │  │  SQL Gen     │  │  Resource    │          │
│  │  Integration │  │  (Safe SQL)  │  │  Registry    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐          │
│  │  Validators  │  │ Provisioner  │  │ Code Export  │          │
│  │  (Zod+Rules) │  │ (DB Setup)   │  │  (Next.js)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   projects   │  │ vibe_configs │  │decision_traces│         │
│  │   (Meta)     │  │  (Schemas)   │  │  (AI Log)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────────────────────────┐        │
│  │schema_locks  │  │  User-Generated Tables (Dynamic) │        │
│  │ (Concurrency)│  │  (contacts, deals, etc.)         │        │
│  └──────────────┘  └──────────────────────────────────┘        │
│                                                                  │
│  RLS Policies: user_id = auth.uid() on ALL tables              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Data Flow

### Flow 1: Schema Generation (AI → Database)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Input                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    User enters prompt:
              "Create a CRM for real estate agents"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: API Route - /api/v1/generate (POST)                     │
│ File: app/api/v1/generate/route.ts                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Authenticate user (JWT token)
                              ├─► Validate request (Zod)
                              ├─► Check quota (10 requests/day)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Intent Classification                                    │
│ File: lib/ai/schema-generator.ts → classifyIntent()             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Call Claude AI
                              ├─► Determine: CREATE | MODIFY | RELATE
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Schema Generation                                        │
│ File: lib/ai/schema-generator.ts → generateCRMSchema()          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Send detailed prompt to Claude
                              ├─► Include rules, limits, examples
                              ├─► Parse JSON response
                              │
                              ▼
                    Claude returns CRMSchema:
                    {
                      version: "1.0.0",
                      tables: [
                        {
                          name: "properties",
                          columns: [...],
                          ui_hints: {...}
                        },
                        {
                          name: "agents",
                          columns: [...],
                          ui_hints: {...}
                        }
                      ],
                      relationships: [...]
                    }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Validation Pipeline                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Zod Validation
                              │   File: lib/validators/schema.ts
                              │   - Check types, structure
                              │   - Validate constraints
                              │
                              ├─► Semantic Rules Validation
                              │   File: lib/validators/schema-rules.ts
                              │   - Check reserved keywords
                              │   - Validate foreign keys
                              │   - Detect circular dependencies
                              │   - Ensure audit columns
                              │
                              ▼
                        ✅ Valid Schema
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Save Decision Trace                                      │
│ Table: decision_traces                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Log AI decision
                              ├─► Store prompt, response, reasoning
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Return to User                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Response: { schema_json, intent }
```

### Flow 2: Schema Provisioning (Database Creation)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Action                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                User clicks "Provision Schema"
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: API Route - /api/v1/provision (POST)                    │
│ File: app/api/v1/provision/route.ts                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Authenticate user
                              ├─► Validate schema (Zod + Rules)
                              ├─► Verify project ownership
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: SQL Generation                                           │
│ File: lib/sql/generator.ts → generateProvisioningSQL()          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Sanitize identifiers
                              │   - Remove special chars
                              │   - Check length (max 63)
                              │   - Prevent SQL injection
                              │
                              ├─► Generate CREATE TABLE statements
                              │   - Add audit columns (id, user_id, timestamps)
                              │   - Set data types
                              │   - Add constraints
                              │
                              ├─► Generate RLS Policies
                              │   CREATE POLICY "user_access"
                              │   ON table_name
                              │   FOR ALL
                              │   USING (user_id = auth.uid());
                              │
                              ├─► Generate Triggers
                              │   - updated_at auto-update
                              │
                              ├─► Generate Foreign Keys
                              │   - Add relationships
                              │
                              ▼
                    Combined SQL Script (500-2000 lines)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Execute SQL                                              │
│ File: lib/integration/provisioner.ts                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Call exec_sql RPC function
                              │   (Supabase PostgreSQL function)
                              │
                              ├─► Execute in transaction
                              │   - All or nothing
                              │   - Rollback on error
                              │
                              ▼
                    ✅ Tables Created in Database
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Register Resources                                       │
│ File: lib/integration/schema-to-resource.ts                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Convert CRMSchema → Resource[]
                              │   - Map PostgreSQL types to UI types
                              │   - Extract relationships
                              │   - Generate labels
                              │
                              ├─► Register in ResourceRegistry
                              │   File: lib/resources/registry.ts
                              │   - Store in memory
                              │   - Enable dynamic UI
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Save Configuration                                       │
│ Table: vibe_configs                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Deactivate old configs
                              ├─► Insert new config
                              │   - schema_json
                              │   - schema_version
                              │   - is_active = true
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Return Success                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            Response: {
              success: true,
              tables_created: ["properties", "agents"],
              rls_policies_created: 2
            }
```

### Flow 3: Dynamic CRUD Operations

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Navigates                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            User clicks table card in dashboard
                    → /dynamic/properties
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Dynamic List Page                                        │
│ File: app/dynamic/[resource]/page.tsx                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Get resource from registry
                              │   resourceRegistry.get("properties")
                              │
                              ├─► Load DynamicList component
                              │   File: lib/resources/dynamic-list.tsx
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Fetch Data                                               │
│ Hook: lib/hooks/use-table-data.tsx                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Create Supabase client
                              │   File: lib/supabase/client.ts
                              │
                              ├─► Build query
                              │   supabase.from("properties")
                              │     .select("*")
                              │     .order("created_at", desc)
                              │     .range(0, 19)  // Pagination
                              │
                              ├─► Apply filters (if any)
                              ├─► Apply search (if any)
                              │
                              ▼
                    RLS automatically filters:
                    WHERE user_id = auth.uid()
                              │
                              ▼
                    Return: { data: [...], count: 42 }
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Render UI                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Display table with data
                              ├─► Show pagination controls
                              ├─► Add search bar
                              ├─► Add "Create" button
                              │
                              ▼
                    User sees their properties list
```

### Flow 4: Code Export

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Action                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            User clicks "Export Code" in dashboard
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Export Dialog                                            │
│ Component: components/export-code-dialog.tsx                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► User selects: ZIP or GitHub
                              ├─► If GitHub: enters token + repo
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: API Route - /api/v1/export-code (POST)                  │
│ File: app/api/v1/export-code/route.ts                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Authenticate user
                              ├─► Get project + active schema
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Generate Project Files                                   │
│ File: lib/code-export/project-generator.ts                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► Convert schema to resources
                              │
                              ├─► Generate for each resource:
                              │   File: lib/code-export/component-generator.ts
                              │   
                              │   ├─► TypeScript types
                              │   │   lib/types/properties.ts
                              │   │
                              │   ├─► List page
                              │   │   app/properties/page.tsx
                              │   │   - Table with pagination
                              │   │   - Search functionality
                              │   │   - CRUD buttons
                              │   │
                              │   ├─► Create page
                              │   │   app/properties/create/page.tsx
                              │   │   - Form with all fields
                              │   │   - Validation
                              │   │
                              │   ├─► Edit page
                              │   │   app/properties/[id]/edit/page.tsx
                              │   │
                              │   └─► Show page
                              │       app/properties/[id]/page.tsx
                              │
                              ├─► Generate config files:
                              │   - package.json
                              │   - tsconfig.json
                              │   - tailwind.config.ts
                              │   - next.config.js
                              │   - .env.local
                              │
                              ├─► Generate UI components:
                              │   - components/ui/button.tsx
                              │   - components/ui/input.tsx
                              │   - components/ui/card.tsx
                              │   - etc. (10+ components)
                              │
                              ├─► Generate utilities:
                              │   - lib/supabase/client.ts
                              │   - lib/utils.ts
                              │
                              └─► Generate docs:
                                  - README.md
                                  - .gitignore
                              │
                              ▼
                    Total: 30-50 files generated
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: Package & Deliver                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─► If ZIP:
                              │   - Create ZIP with JSZip
                              │   - Return as download
                              │
                              └─► If GitHub:
                                  - Create/update repository
                                  - Push all files
                                  - Return repo URL
```

---

## 🔌 API Endpoints

### Complete API Map

```
/api/v1/
├── generate (POST)              ✅ WORKING
│   └── Generate CRM schema from natural language
│       Input: { prompt, project_id }
│       Output: { schema_json, intent }
│
├── provision (POST)             ✅ WORKING
│   └── Provision schema to database
│       Input: { schema_json, project_id }
│       Output: { success, tables_created }
│
├── projects/                    ✅ WORKING
│   ├── GET    - List user projects
│   ├── POST   - Create new project
│   ├── PUT    - Update project
│   └── DELETE - Delete project
│
├── projects/[id] (GET)          ✅ WORKING
│   └── Get single project details
│
├── export-code (POST)           ✅ WORKING (NEW)
│   └── Export complete Next.js application
│       Input: { project_id, export_type, github_token?, repo_name? }
│       Output: ZIP file or { repository_url }
│
├── export (POST, GET)           ⚠️ DUPLICATE (OLD SYSTEM)
│   └── Old export system (Refine.dev based)
│       Status: Not integrated, missing dependencies
│
├── code-generate (POST, GET)   ⚠️ DUPLICATE (OLD SYSTEM)
│   └── Alternative code generation
│       Status: Not integrated, uses Refine.dev
│
├── rollback/[projectId]         ✅ WORKING
│   ├── POST - Rollback to previous schema version
│   └── GET  - Get specific version
│
├── schema-lock/[projectId]      ✅ WORKING
│   ├── POST   - Acquire/extend lock
│   ├── DELETE - Release lock
│   └── GET    - Check lock status
│
└── vibe-replay/[projectId]      ✅ WORKING
    └── GET - Get AI decision history
```

### Endpoint Details

#### 1. `/api/v1/generate` (POST)
**Purpose:** Generate CRM schema from natural language  
**File:** `app/api/v1/generate/route.ts`

**Flow:**
```
Request → Authenticate → Validate → Check Quota → 
Classify Intent → Call Claude AI → Validate Schema → 
Log Decision → Return Schema
```

**Request:**
```json
{
  "prompt": "Create a CRM for real estate agents with properties and agents",
  "project_id": "uuid"
}
```

**Response:**
```json
{
  "schema_json": {
    "version": "1.0.0",
    "tables": [...],
    "relationships": [...]
  },
  "intent": "CREATE",
  "reasoning": "..."
}
```

**Dependencies:**
- `lib/ai/schema-generator.ts` - Claude integration
- `lib/validators/schema.ts` - Zod validation
- `lib/validators/schema-rules.ts` - Semantic validation

**Status:** ✅ **WORKING**

---

#### 2. `/api/v1/provision` (POST)
**Purpose:** Provision validated schema to database  
**File:** `app/api/v1/provision/route.ts`

**Flow:**
```
Request → Authenticate → Validate Schema → 
Generate SQL → Execute via RPC → Register Resources → 
Save Config → Return Success
```

**Request:**
```json
{
  "schema_json": { ... },
  "project_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "migration_applied": true,
  "tables_created": ["properties", "agents"],
  "rls_policies_created": 2,
  "vibe_config_id": "uuid"
}
```

**Dependencies:**
- `lib/sql/generator.ts` - SQL generation
- `lib/integration/provisioner.ts` - Database execution
- `lib/integration/schema-to-resource.ts` - Resource conversion
- `lib/resources/registry.ts` - Resource registration

**Status:** ✅ **WORKING**

---

#### 3. `/api/v1/export-code` (POST)
**Purpose:** Export complete Next.js application  
**File:** `app/api/v1/export-code/route.ts`

**Flow:**
```
Request → Authenticate → Get Schema → 
Generate Files → Package (ZIP/GitHub) → Return
```

**Request:**
```json
{
  "project_id": "uuid",
  "export_type": "zip",  // or "github"
  "project_name": "My CRM",
  "github_token": "ghp_...",  // if GitHub
  "repo_name": "username/repo"  // if GitHub
}
```

**Response (ZIP):**
```
Binary ZIP file download
```

**Response (GitHub):**
```json
{
  "success": true,
  "message": "Code pushed to GitHub",
  "repository_url": "https://github.com/username/repo"
}
```

**Dependencies:**
- `lib/code-export/project-generator.ts` - File generation
- `lib/code-export/component-generator.ts` - Component templates
- `jszip` - ZIP creation
- GitHub API - Repository management

**Status:** ✅ **WORKING** (Newly implemented)

---

## 🎨 Frontend Components

### Component Hierarchy

```
app/
├── layout.tsx (Root)
│   └── Toaster (Notifications)
│
├── page.tsx (Homepage)
│   ├── FluidBackground
│   ├── Prompt Input
│   ├── Template Showcase
│   ├── SchemaPreviewModal
│   └── PremiumUnlockModal
│
├── dashboard/
│   ├── layout.tsx
│   │   └── DashboardSidebar
│   │
│   ├── page.tsx (Main Dashboard)
│   │   ├── ProjectProvider (Context)
│   │   ├── ExportCodeDialog ← NEW
│   │   └── Table Cards Grid
│   │
│   ├── tables/[tableName]/
│   │   └── page.tsx (Legacy table view)
│   │
│   ├── resources/
│   │   └── page.tsx
│   │       └── ResourceDashboard
│   │
│   └── vibe-replay/[projectId]/
│       └── page.tsx
│           └── VibeReplayTimeline
│
├── dynamic/[resource]/
│   ├── page.tsx (List)
│   │   └── DynamicList
│   │
│   ├── create/
│   │   └── page.tsx
│   │       └── DynamicCreate
│   │
│   └── [id]/
│       ├── page.tsx (Show)
│       │   └── DynamicShow
│       │
│       └── edit/
│           └── page.tsx
│               └── DynamicEdit
│
├── projects/
│   └── page.tsx
│       └── Project Management
│
├── pricing/
│   └── page.tsx (Marketing)
│
└── legal/
    └── page.tsx (Marketing)
```

### Key Components

#### 1. **DynamicList** ✅ WORKING
**File:** `lib/resources/dynamic-list.tsx`

**Purpose:** Renders list view for any resource

**Features:**
- Pagination
- Search
- Sorting
- CRUD actions
- Responsive table

**Data Flow:**
```
Component → useTableData hook → Supabase query → 
RLS filter → Return data → Render table
```

---

#### 2. **ExportCodeDialog** ✅ WORKING (NEW)
**File:** `components/export-code-dialog.tsx`

**Purpose:** Export code UI

**Features:**
- ZIP download option
- GitHub push option
- Token input (for GitHub)
- Loading states
- Error handling

---

#### 3. **ProjectProvider** ✅ WORKING
**File:** `lib/hooks/use-project.tsx`

**Purpose:** Global project state management

**Provides:**
- Current project
- Active schema
- Project list
- Switch project function
- Refresh functions

**Used by:** All dashboard pages

---

## 💾 Database Schema

### Core Tables

```sql
-- 1. projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_project_per_user UNIQUE(user_id)
);

-- RLS Policy
CREATE POLICY "Users can only see their own projects"
ON projects FOR ALL
USING (user_id = auth.uid());

-- 2. vibe_configs (Schema Storage)
CREATE TABLE vibe_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  schema_version TEXT NOT NULL,
  schema_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_active_config UNIQUE(project_id, is_active) 
    WHERE is_active = true
);

-- RLS Policy
CREATE POLICY "Users can only see their own configs"
ON vibe_configs FOR ALL
USING (user_id = auth.uid());

-- 3. decision_traces (AI Audit Log)
CREATE TABLE decision_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  prompt TEXT,
  ai_response JSONB,
  reasoning TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_decision_traces_user_id 
ON decision_traces(user_id);

-- RLS Policy
CREATE POLICY "Users can only see their own traces"
ON decision_traces FOR ALL
USING (user_id = auth.uid());

-- 4. schema_locks (Concurrency Control)
CREATE TABLE schema_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  locked_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_project_lock UNIQUE(project_id)
);

-- RLS Policy
CREATE POLICY "Users can only see their own locks"
ON schema_locks FOR ALL
USING (user_id = auth.uid());
```

### Dynamic User Tables

When a schema is provisioned, tables are created dynamically:

```sql
-- Example: properties table (generated)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- User-defined columns
  address TEXT NOT NULL,
  price NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_feet INTEGER,
  status TEXT,
  
  -- Audit columns
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policy (auto-generated)
CREATE POLICY "user_access_properties"
ON properties FOR ALL
USING (user_id = auth.uid());

-- Trigger (auto-generated)
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## ✅ Working Features

### 1. **AI Schema Generation** ✅
- Natural language to database schema
- Intent classification
- Validation pipeline
- Decision logging

**Test:**
```bash
POST /api/v1/generate
{
  "prompt": "Create a CRM for real estate",
  "project_id": "uuid"
}
```

---

### 2. **Database Provisioning** ✅
- SQL generation with sanitization
- RLS policy creation
- Foreign key relationships
- Trigger generation
- Resource registration

**Test:**
```bash
POST /api/v1/provision
{
  "schema_json": {...},
  "project_id": "uuid"
}
```

---

### 3. **Dynamic CRUD UI** ✅
- List views with pagination
- Create forms
- Edit forms
- Detail views
- Search and filters

**Test:**
Navigate to `/dynamic/[resource]` after provisioning

---

### 4. **Code Export** ✅ (NEW)
- Complete Next.js project generation
- ZIP download
- GitHub push
- Production-ready code

**Test:**
Click "Export Code" button in dashboard

---

### 5. **Project Management** ✅
- Create projects
- Update projects
- Delete projects
- List projects

**Test:**
```bash
GET /api/v1/projects
POST /api/v1/projects
```

---

### 6. **Schema Versioning** ✅
- Version tracking
- Rollback capability
- History view

**Test:**
```bash
POST /api/v1/rollback/[projectId]
GET /api/v1/vibe-replay/[projectId]
```

---

### 7. **Concurrency Control** ✅
- Schema locks
- Prevent conflicts
- Auto-expiry

**Test:**
```bash
POST /api/v1/schema-lock/[projectId]
```

---

## ❌ Non-Working Features

### 1. **Old Code Generator System** ❌
**Files:**
- `lib/code-generator/*`
- `app/api/v1/code-generate/route.ts`
- `app/demo/code-generate/page.tsx`

**Issues:**
- Uses Refine.dev (not in dependencies)
- Not integrated with main flow
- Generates code with missing imports
- Duplicate of new export system

**Status:** Should be removed

---

### 2. **Old Export System** ❌
**Files:**
- `lib/export/*`
- `app/api/v1/export/route.ts`

**Issues:**
- Incomplete implementation
- Not connected to UI
- Overlaps with new export-code system

**Status:** Should be removed or merged

---

### 3. **Static Table Pages** ⚠️ DEPRECATED
**Files:**
- `app/dashboard/tables/[tableName]/page.tsx`

**Issues:**
- Replaced by dynamic pages
- Dashboard now links to `/dynamic/[resource]`
- Still exists but not used

**Status:** Can be removed

---

### 4. **Demo Pages** ⚠️ ISOLATED
**Files:**
- `app/demo/code-generate/page.tsx`

**Issues:**
- Not linked from main UI
- Uses old code generator
- Incomplete functionality

**Status:** Can be removed

---

## 📂 Code Organization

### Directory Structure

```
VibeCRM/
├── app/                          # Next.js App Router
│   ├── api/v1/                  # API Routes
│   │   ├── generate/            ✅ Working
│   │   ├── provision/           ✅ Working
│   │   ├── export-code/         ✅ Working (NEW)
│   │   ├── projects/            ✅ Working
│   │   ├── rollback/            ✅ Working
│   │   ├── schema-lock/         ✅ Working
│   │   ├── vibe-replay/         ✅ Working
│   │   ├── code-generate/       ❌ Old system
│   │   └── export/              ❌ Old system
│   │
│   ├── dashboard/               ✅ Working
│   │   ├── page.tsx            # Main dashboard
│   │   ├── tables/             ⚠️ Deprecated
│   │   ├── resources/          ✅ Working
│   │   └── vibe-replay/        ✅ Working
│   │
│   ├── dynamic/[resource]/      ✅ Working (NEW)
│   │   ├── page.tsx            # List view
│   │   ├── create/             # Create form
│   │   └── [id]/               # Show & Edit
│   │
│   ├── demo/                    ⚠️ Isolated
│   ├── projects/                ✅ Working
│   ├── pricing/                 ✅ Marketing
│   ├── legal/                   ✅ Marketing
│   ├── layout.tsx               ✅ Root layout
│   ├── page.tsx                 ✅ Homepage
│   └── globals.css              ✅ Styles
│
├── components/                   # React Components
│   ├── export-code-dialog.tsx  ✅ NEW
│   ├── dashboard-sidebar.tsx   ✅ Working
│   ├── schema-preview.tsx      ✅ Working
│   ├── fluid-background.tsx    ✅ Working
│   └── ui/                     ✅ shadcn/ui
│
├── lib/                          # Core Logic
│   ├── ai/                      ✅ Working
│   │   ├── claude.ts           # Claude client
│   │   └── schema-generator.ts # AI integration
│   │
│   ├── code-export/             ✅ NEW (Working)
│   │   ├── component-generator.ts
│   │   └── project-generator.ts
│   │
│   ├── code-generator/          ❌ Old system
│   │   ├── generator.ts
│   │   ├── templates.ts
│   │   └── schemas.ts
│   │
│   ├── export/                  ❌ Old system
│   │   ├── code-exporter.ts
│   │   └── github-exporter.ts
│   │
│   ├── integration/             ✅ Working
│   │   ├── provisioner.ts      # DB provisioning
│   │   ├── schema-to-resource.ts # NEW
│   │   ├── auto-registrar.ts   # Resource registration
│   │   └── vibe-config.ts      # Config management
│   │
│   ├── resources/               ✅ Working
│   │   ├── registry.ts         # Resource storage
│   │   └── dynamic-list.tsx    # Dynamic UI
│   │
│   ├── sql/                     ✅ Working
│   │   └── generator.ts        # SQL generation
│   │
│   ├── validators/              ✅ Working
│   │   ├── schema.ts           # Zod validators
│   │   └── schema-rules.ts     # Semantic rules
│   │
│   ├── supabase/                ✅ Working
│   │   ├── client.ts           # Browser client
│   │   └── server.ts           # Server client
│   │
│   ├── hooks/                   ✅ Working
│   │   ├── use-project.tsx     # Project context
│   │   ├── use-table-data.tsx  # Data fetching
│   │   └── use-*.ts            # Various hooks
│   │
│   ├── projects/                ✅ Working
│   │   └── project-manager.ts  # CRUD operations
│   │
│   ├── config/                  ✅ Working
│   │   └── env-validator.ts    # Environment validation
│   │
│   └── api/                     ✅ Working
│       ├── client.ts           # API client
│       └── error-handler.ts    # Error utilities
│
├── supabase/                     # Database
│   └── migrations/              ✅ Working
│       ├── 20260105000001_initial_schema.sql
│       ├── 20260105000002_exec_sql_function.sql
│       └── 20260106000001_schema_locks.sql
│
├── types/                        ✅ Working
│   └── schema.ts                # TypeScript types
│
├── package.json                  ✅ Working
├── tsconfig.json                 ✅ Working
├── tailwind.config.ts            ✅ Working
├── next.config.ts                ✅ Working
├── README.md                     ✅ Documentation
├── EXPORT_GUIDE.md               ✅ NEW
└── CODEBASE_ANALYSIS.md          ✅ This file
```

---

## 🔗 Integration Points

### 1. **Supabase Integration**
```typescript
// Client-side (Browser)
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server-side (API Routes)
import { supabaseAdmin } from "@/lib/supabase/server";
const { data } = await supabaseAdmin.from("table").select();
```

**Features:**
- Row Level Security (RLS)
- Real-time subscriptions (not used yet)
- Authentication
- PostgreSQL functions

---

### 2. **Claude AI Integration**
```typescript
import { anthropic } from "@/lib/ai/claude";
import { generateCRMSchema } from "@/lib/ai/schema-generator";

const schema = await generateCRMSchema(prompt, intent);
```

**Model:** Claude Sonnet 4 (`claude-sonnet-4-20250514`)  
**Limits:** 10 requests/day (free tier)

---

### 3. **Resource Registry**
```typescript
import { resourceRegistry } from "@/lib/resources/registry";

// Register resource
resourceRegistry.register(resource);

// Get resource
const resource = resourceRegistry.get("properties");

// List all
const all = resourceRegistry.getAll();
```

**Purpose:** Bridge between provisioned schemas and dynamic UI

---

## 📊 Summary

### What's Working ✅
1. AI schema generation from natural language
2. Database provisioning with RLS
3. Dynamic CRUD interfaces
4. Code export (ZIP + GitHub)
5. Project management
6. Schema versioning & rollback
7. Concurrency control
8. Decision logging

### What's Not Working ❌
1. Old code generator (Refine.dev based)
2. Old export system
3. Demo pages (isolated)
4. Static table pages (deprecated)

### What Should Be Removed 🗑️
1. `/lib/code-generator/*` - Replaced by `/lib/code-export/*`
2. `/lib/export/*` - Incomplete old system
3. `/app/api/v1/code-generate/` - Old API
4. `/app/api/v1/export/` - Old API
5. `/app/demo/*` - Not integrated
6. `/app/dashboard/tables/*` - Deprecated

### Architecture Quality 🎯
- **Security:** ✅ Excellent (RLS, SQL sanitization)
- **Code Organization:** ✅ Good (clear separation)
- **Type Safety:** ✅ Excellent (TypeScript + Zod)
- **Documentation:** ✅ Good (inline comments)
- **Testing:** ❌ Missing (no tests)
- **Error Handling:** ✅ Good (standardized)

---

## 🎯 Recommended Next Steps

1. **Remove duplicate systems**
   - Delete old code generator
   - Delete old export system
   - Clean up unused files

2. **Add testing**
   - Unit tests for validators
   - Integration tests for API routes
   - E2E tests for user flows

3. **Improve monitoring**
   - Add logging service (Sentry)
   - Track API usage
   - Monitor AI costs

4. **Enhance features**
   - Add real-time updates
   - Implement webhooks
   - Add data import/export

5. **Performance optimization**
   - Add caching
   - Optimize bundle size
   - Implement lazy loading

---

**End of Analysis**
