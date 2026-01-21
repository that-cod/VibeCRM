# VibeCRM Visual Flow Diagrams

## Quick Reference Guide

This document provides visual representations of all major flows in VibeCRM.

---

## 🎯 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY MAP                                 │
└─────────────────────────────────────────────────────────────────────────┘

START: User visits homepage (/)
   │
   ├─► Enters natural language prompt
   │   "Create a CRM for real estate agents"
   │
   ▼
┌──────────────────────────────────────┐
│  AI SCHEMA GENERATION                │
│  POST /api/v1/generate               │
│  ✅ WORKING                          │
└──────────────────────────────────────┘
   │
   ├─► Claude AI processes prompt
   ├─► Generates CRMSchema JSON
   ├─► Validates with Zod + Rules
   │
   ▼
Schema Preview Modal appears
   │
   ├─► User reviews tables & columns
   ├─► User clicks "Provision"
   │
   ▼
┌──────────────────────────────────────┐
│  DATABASE PROVISIONING               │
│  POST /api/v1/provision              │
│  ✅ WORKING                          │
└──────────────────────────────────────┘
   │
   ├─► Generates SQL (CREATE TABLE, RLS, etc.)
   ├─► Executes via exec_sql RPC
   ├─► Registers resources in registry
   ├─► Saves to vibe_configs
   │
   ▼
Redirect to Dashboard (/dashboard)
   │
   ├─► Shows project overview
   ├─► Displays table cards
   │
   ▼
┌──────────────────────────────────────┐
│  DYNAMIC CRUD INTERFACE              │
│  /dynamic/[resource]                 │
│  ✅ WORKING                          │
└──────────────────────────────────────┘
   │
   ├─► User clicks table card
   ├─► Sees list of records
   ├─► Can Create/Read/Update/Delete
   │
   ▼
User tests CRM functionality
   │
   ├─► Satisfied with CRM
   ├─► Clicks "Export Code"
   │
   ▼
┌──────────────────────────────────────┐
│  CODE EXPORT                         │
│  POST /api/v1/export-code            │
│  ✅ WORKING (NEW)                    │
└──────────────────────────────────────┘
   │
   ├─► Generates 30-50 files
   ├─► Creates complete Next.js app
   │
   ▼
┌─────────────┬────────────────┐
│  ZIP        │    GitHub      │
│  Download   │    Push        │
└─────────────┴────────────────┘
   │              │
   ▼              ▼
User has production-ready code
   │
   ├─► npm install
   ├─► npm run dev
   │
   ▼
END: Fully functional CRM running locally
```

---

## 🔄 Data Flow: Schema Generation

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEMA GENERATION FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User Input: "Create a CRM for real estate"
   │
   ▼
┌─────────────────────────────────────┐
│ Frontend: app/page.tsx              │
│ - Validates input                   │
│ - Shows loading state               │
└─────────────────────────────────────┘
   │
   │ POST /api/v1/generate
   │ { prompt, project_id }
   ▼
┌─────────────────────────────────────┐
│ API: app/api/v1/generate/route.ts  │
│                                     │
│ Step 1: Authentication              │
│   ├─► Extract JWT token            │
│   ├─► Verify with Supabase         │
│   └─► Get user.id                  │
│                                     │
│ Step 2: Validation                  │
│   ├─► Zod schema check             │
│   └─► Ensure prompt exists         │
│                                     │
│ Step 3: Quota Check                 │
│   ├─► Count today's requests       │
│   ├─► Check limit (10/day)         │
│   └─► Reject if exceeded           │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ AI: lib/ai/schema-generator.ts     │
│                                     │
│ classifyIntent()                    │
│   ├─► Send to Claude               │
│   ├─► Get intent classification    │
│   └─► Return: CREATE/MODIFY/RELATE │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ AI: generateCRMSchema()             │
│                                     │
│ Prompt Engineering:                 │
│   ├─► System prompt (rules)        │
│   ├─► User prompt                  │
│   ├─► Examples                     │
│   └─► Constraints                  │
│                                     │
│ Claude Processing:                  │
│   ├─► Analyzes business domain     │
│   ├─► Designs tables               │
│   ├─► Creates relationships        │
│   └─► Returns JSON                 │
└─────────────────────────────────────┘
   │
   ▼
Raw JSON Response
{
  "version": "1.0.0",
  "tables": [
    {
      "name": "properties",
      "columns": [
        { "name": "address", "type": "TEXT", ... },
        { "name": "price", "type": "NUMERIC", ... }
      ],
      "ui_hints": { "label": "Properties", ... }
    },
    {
      "name": "agents",
      "columns": [...],
      "ui_hints": {...}
    }
  ],
  "relationships": [
    {
      "from_table": "properties",
      "to_table": "agents",
      "type": "many_to_one"
    }
  ]
}
   │
   ▼
┌─────────────────────────────────────┐
│ Validation Pipeline                 │
│                                     │
│ Step 1: Zod Validation              │
│   File: lib/validators/schema.ts   │
│   ├─► Check structure               │
│   ├─► Validate types                │
│   ├─► Ensure required fields        │
│   └─► ✅ or ❌                      │
│                                     │
│ Step 2: Semantic Rules              │
│   File: lib/validators/schema-rules.ts │
│   ├─► Check reserved keywords      │
│   ├─► Validate foreign keys        │
│   ├─► Detect circular deps         │
│   ├─► Ensure audit columns         │
│   └─► ✅ or ❌                      │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Decision Logging                    │
│ Table: decision_traces              │
│                                     │
│ INSERT INTO decision_traces (       │
│   user_id,                          │
│   project_id,                       │
│   action_type: "SCHEMA_GENERATION", │
│   prompt,                           │
│   ai_response,                      │
│   reasoning,                        │
│   model_used: "claude-sonnet-4",   │
│   tokens_used                       │
│ )                                   │
└─────────────────────────────────────┘
   │
   ▼
Response to Frontend
{
  "schema_json": { ... },
  "intent": "CREATE",
  "reasoning": "Generated real estate CRM..."
}
   │
   ▼
Frontend displays SchemaPreviewModal
```

---

## 🗄️ Data Flow: Database Provisioning

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE PROVISIONING FLOW                      │
└─────────────────────────────────────────────────────────────────┘

User clicks "Provision Schema"
   │
   ▼
┌─────────────────────────────────────┐
│ Frontend sends validated schema     │
└─────────────────────────────────────┘
   │
   │ POST /api/v1/provision
   │ { schema_json, project_id }
   ▼
┌─────────────────────────────────────┐
│ API: app/api/v1/provision/route.ts │
│                                     │
│ Step 1: Authentication              │
│ Step 2: Validate schema again       │
│ Step 3: Verify project ownership    │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ SQL Generation                      │
│ File: lib/sql/generator.ts         │
│                                     │
│ For each table:                     │
│   ├─► sanitizeIdentifier()         │
│   │   - Remove special chars       │
│   │   - Check length               │
│   │   - Prevent injection          │
│   │                                 │
│   ├─► generateCreateTableSQL()     │
│   │   CREATE TABLE properties (    │
│   │     id UUID PRIMARY KEY,       │
│   │     user_id UUID NOT NULL,     │
│   │     address TEXT NOT NULL,     │
│   │     price NUMERIC,             │
│   │     created_at TIMESTAMPTZ,    │
│   │     updated_at TIMESTAMPTZ     │
│   │   );                           │
│   │                                 │
│   ├─► generateRLSPolicies()        │
│   │   CREATE POLICY "user_access"  │
│   │   ON properties                │
│   │   FOR ALL                       │
│   │   USING (user_id = auth.uid());│
│   │                                 │
│   ├─► generateTriggers()           │
│   │   CREATE TRIGGER update_ts     │
│   │   BEFORE UPDATE ON properties  │
│   │   FOR EACH ROW                 │
│   │   EXECUTE FUNCTION update_ts();│
│   │                                 │
│   └─► generateForeignKeys()        │
│       ALTER TABLE properties       │
│       ADD CONSTRAINT fk_agent      │
│       FOREIGN KEY (agent_id)       │
│       REFERENCES agents(id);       │
└─────────────────────────────────────┘
   │
   ▼
Combined SQL Script (500-2000 lines)
   │
   ▼
┌─────────────────────────────────────┐
│ Execute SQL                         │
│ File: lib/integration/provisioner.ts│
│                                     │
│ Method 1: Batch Execution           │
│   ├─► Call exec_sql RPC            │
│   │   SELECT exec_sql($1);         │
│   │   - Runs as SECURITY DEFINER   │
│   │   - Service role privileges    │
│   │   - Transaction wrapper        │
│   │                                 │
│   └─► If success: ✅               │
│       If error: Try fallback       │
│                                     │
│ Method 2: Fallback (if needed)      │
│   └─► Execute statements one-by-one│
└─────────────────────────────────────┘
   │
   ▼
✅ Tables created in Supabase
   │
   ▼
┌─────────────────────────────────────┐
│ Resource Registration               │
│ File: lib/integration/              │
│       schema-to-resource.ts         │
│                                     │
│ convertSchemaToResources()          │
│   ├─► For each table:              │
│   │   - Map PG types to UI types   │
│   │   - Extract relationships      │
│   │   - Generate labels            │
│   │   - Create Resource object     │
│   │                                 │
│   └─► Returns Resource[]           │
│       [                             │
│         {                           │
│           name: "properties",       │
│           plural_name: "properties",│
│           fields: [...],            │
│           relationships: [...]      │
│         },                          │
│         ...                         │
│       ]                             │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Register in Registry                │
│ File: lib/resources/registry.ts    │
│                                     │
│ resourceRegistry.register(resource) │
│   ├─► Store in memory Map          │
│   ├─► Enable dynamic UI            │
│   └─► Available for CRUD           │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Save Configuration                  │
│ Table: vibe_configs                 │
│                                     │
│ Step 1: Deactivate old configs     │
│   UPDATE vibe_configs               │
│   SET is_active = false             │
│   WHERE project_id = $1             │
│   AND schema_version != $2;         │
│                                     │
│ Step 2: Insert new config           │
│   INSERT INTO vibe_configs (        │
│     project_id,                     │
│     user_id,                        │
│     schema_version,                 │
│     schema_json,                    │
│     is_active: true                 │
│   );                                │
└─────────────────────────────────────┘
   │
   ▼
Response to Frontend
{
  "success": true,
  "tables_created": ["properties", "agents"],
  "rls_policies_created": 2,
  "vibe_config_id": "uuid"
}
   │
   ▼
Frontend redirects to /dashboard
```

---

## 🎨 Data Flow: Dynamic CRUD

```
┌─────────────────────────────────────────────────────────────────┐
│                      DYNAMIC CRUD FLOW                           │
└─────────────────────────────────────────────────────────────────┘

User navigates to /dynamic/properties
   │
   ▼
┌─────────────────────────────────────┐
│ Page: app/dynamic/[resource]/      │
│       page.tsx                      │
│                                     │
│ const resource = params.resource    │
│ // "properties"                     │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Get Resource from Registry          │
│                                     │
│ const resourceData =                │
│   resourceRegistry.get("properties")│
│                                     │
│ Returns:                            │
│ {                                   │
│   name: "properties",               │
│   plural_name: "properties",        │
│   fields: [                         │
│     { name: "address", type: "text" },│
│     { name: "price", type: "currency" }│
│   ],                                │
│   relationships: [...]              │
│ }                                   │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Component: DynamicList              │
│ File: lib/resources/dynamic-list.tsx│
│                                     │
│ Receives: resourceData              │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Hook: useTableData()                │
│ File: lib/hooks/use-table-data.tsx │
│                                     │
│ const {                             │
│   data,                             │
│   isLoading,                        │
│   pagination,                       │
│   createRecord,                     │
│   updateRecord,                     │
│   deleteRecord                      │
│ } = useTableData("properties")      │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Supabase Query                      │
│                                     │
│ const supabase = createClient()     │
│                                     │
│ let query = supabase                │
│   .from("properties")               │
│   .select("*", { count: "exact" }) │
│   .order("created_at", { desc })    │
│   .range(0, 19)  // Page 1          │
│                                     │
│ // Search filter (if any)           │
│ if (search) {                       │
│   query = query.ilike(              │
│     "address",                      │
│     `%${search}%`                   │
│   )                                 │
│ }                                   │
│                                     │
│ const { data, error } = await query │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ RLS Policy Applied (Automatic)      │
│                                     │
│ PostgreSQL adds WHERE clause:       │
│   WHERE user_id = auth.uid()        │
│                                     │
│ User only sees their own data       │
└─────────────────────────────────────┘
   │
   ▼
Data returned to frontend
[
  {
    id: "uuid-1",
    address: "123 Main St",
    price: 500000,
    user_id: "user-uuid",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z"
  },
  ...
]
   │
   ▼
┌─────────────────────────────────────┐
│ Render UI                           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Properties                      │ │
│ │ [Search...] [+ Add Property]    │ │
│ ├─────────────────────────────────┤ │
│ │ Address      | Price   | Actions│ │
│ ├─────────────────────────────────┤ │
│ │ 123 Main St  | $500k   | [Edit] │ │
│ │ 456 Oak Ave  | $750k   | [Edit] │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Previous] Page 1 of 3 [Next]       │
└─────────────────────────────────────┘
```

### CRUD Operations Detail

```
CREATE:
User clicks "+ Add Property"
   ↓
Navigate to /dynamic/properties/create
   ↓
DynamicCreate component loads
   ↓
Form with fields from resourceData
   ↓
User fills form and submits
   ↓
supabase.from("properties").insert(data)
   ↓
RLS adds user_id automatically
   ↓
Record created ✅
   ↓
Redirect to list view

READ:
User clicks "View" button
   ↓
Navigate to /dynamic/properties/[id]
   ↓
DynamicShow component loads
   ↓
supabase.from("properties").select().eq("id", id).single()
   ↓
RLS filters by user_id
   ↓
Display record details

UPDATE:
User clicks "Edit" button
   ↓
Navigate to /dynamic/properties/[id]/edit
   ↓
DynamicEdit component loads
   ↓
Load existing data
   ↓
User modifies form and submits
   ↓
supabase.from("properties").update(data).eq("id", id)
   ↓
RLS ensures user owns record
   ↓
Record updated ✅
   ↓
Redirect to list view

DELETE:
User clicks "Delete" button
   ↓
Confirmation dialog
   ↓
supabase.from("properties").delete().eq("id", id)
   ↓
RLS ensures user owns record
   ↓
Record deleted ✅
   ↓
Refresh list view
```

---

## 📦 Data Flow: Code Export

```
┌─────────────────────────────────────────────────────────────────┐
│                       CODE EXPORT FLOW                           │
└─────────────────────────────────────────────────────────────────┘

User clicks "Export Code" in dashboard
   │
   ▼
┌─────────────────────────────────────┐
│ Component: ExportCodeDialog         │
│ File: components/                   │
│       export-code-dialog.tsx        │
│                                     │
│ User selects:                       │
│   ○ Download ZIP                    │
│   ○ Push to GitHub                  │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ If GitHub selected:                 │
│   ├─► Enter GitHub token            │
│   └─► Enter repo name               │
│       (username/repository)         │
└─────────────────────────────────────┘
   │
   ▼
User clicks "Export"
   │
   │ POST /api/v1/export-code
   │ {
   │   project_id,
   │   export_type: "zip" | "github",
   │   github_token?,
   │   repo_name?
   │ }
   ▼
┌─────────────────────────────────────┐
│ API: app/api/v1/export-code/       │
│      route.ts                       │
│                                     │
│ Step 1: Authenticate                │
│ Step 2: Get project & schema        │
│ Step 3: Get Supabase credentials    │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Generate Project Files              │
│ File: lib/code-export/              │
│       project-generator.ts          │
│                                     │
│ generateProjectFiles(               │
│   schema,                           │
│   projectName,                      │
│   supabaseUrl,                      │
│   supabaseAnonKey                   │
│ )                                   │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Step 1: Convert Schema              │
│                                     │
│ const resources =                   │
│   convertSchemaToResources(schema)  │
│                                     │
│ [                                   │
│   { name: "properties", ... },      │
│   { name: "agents", ... }           │
│ ]                                   │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Step 2: Generate Config Files       │
│                                     │
│ files.push({                        │
│   path: "package.json",             │
│   content: generatePackageJson()    │
│ })                                  │
│                                     │
│ files.push({                        │
│   path: "tsconfig.json",            │
│   content: generateTsConfig()       │
│ })                                  │
│                                     │
│ files.push({                        │
│   path: "tailwind.config.ts",       │
│   content: generateTailwindConfig() │
│ })                                  │
│                                     │
│ files.push({                        │
│   path: ".env.local",               │
│   content: `                        │
│     NEXT_PUBLIC_SUPABASE_URL=...    │
│     NEXT_PUBLIC_SUPABASE_ANON_KEY=..│
│   `                                 │
│ })                                  │
│                                     │
│ ... (10+ config files)              │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Step 3: Generate UI Components      │
│                                     │
│ files.push({                        │
│   path: "components/ui/button.tsx", │
│   content: "..."                    │
│ })                                  │
│                                     │
│ files.push({                        │
│   path: "components/ui/input.tsx",  │
│   content: "..."                    │
│ })                                  │
│                                     │
│ ... (10+ UI components)             │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Step 4: Generate Resource Files     │
│ File: lib/code-export/              │
│       component-generator.ts        │
│                                     │
│ For each resource:                  │
│                                     │
│ ├─► generateTypeDefinitions()      │
│ │   lib/types/properties.ts        │
│ │   - Interface definition         │
│ │   - Create/Update types          │
│ │                                   │
│ ├─► generateListPage()             │
│ │   app/properties/page.tsx        │
│ │   - Table component              │
│ │   - Pagination                   │
│ │   - Search                       │
│ │   - CRUD buttons                 │
│ │                                   │
│ ├─► generateCreatePage()           │
│ │   app/properties/create/page.tsx │
│ │   - Form with all fields         │
│ │   - Validation                   │
│ │   - Submit handler               │
│ │                                   │
│ ├─► generateEditPage()             │
│ │   app/properties/[id]/edit/      │
│ │       page.tsx                   │
│ │   - Load existing data           │
│ │   - Form with values             │
│ │   - Update handler               │
│ │                                   │
│ └─► generateShowPage()             │
│     app/properties/[id]/page.tsx   │
│     - Display all fields           │
│     - Edit/Delete buttons          │
└─────────────────────────────────────┘
   │
   ▼
Total Files Generated: 30-50
   │
   ├─► Config files: ~10
   ├─► UI components: ~10
   ├─► Resource files: ~20-30
   └─► Docs: ~2
   │
   ▼
┌─────────────────────────────────────┐
│ Step 5: Package & Deliver           │
└─────────────────────────────────────┘
   │
   ├─────────────────┬─────────────────┐
   │                 │                 │
   ▼                 ▼                 ▼
ZIP Export      GitHub Export    Files JSON
   │                 │                 │
   │                 │                 │
   ▼                 ▼                 ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Create ZIP  │ │ GitHub API  │ │ Return JSON │
│ with JSZip  │ │ Integration │ │ Array       │
│             │ │             │ │             │
│ - Add files │ │ - Create    │ │ [           │
│ - Generate  │ │   repo      │ │   {         │
│   buffer    │ │ - Create    │ │     path,   │
│             │ │   blobs     │ │     content │
│ Return as   │ │ - Create    │ │   },        │
│ download    │ │   tree      │ │   ...       │
│             │ │ - Commit    │ │ ]           │
│             │ │ - Push      │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
   │                 │                 │
   ▼                 ▼                 ▼
my-crm.zip      github.com/      JSON response
downloaded      user/my-crm      for preview
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                           │
└─────────────────────────────────────────────────────────────────┘

Request arrives at API endpoint
   │
   ▼
┌─────────────────────────────────────┐
│ Layer 1: Authentication             │
│                                     │
│ const authHeader =                  │
│   request.headers.get("authorization")│
│                                     │
│ if (!authHeader) {                  │
│   return 401 Unauthorized           │
│ }                                   │
│                                     │
│ const token = authHeader            │
│   .replace("Bearer ", "")           │
│                                     │
│ const { data: { user } } =          │
│   await supabaseAdmin               │
│     .auth.getUser(token)            │
│                                     │
│ if (!user) {                        │
│   return 401 Unauthorized           │
│ }                                   │
└─────────────────────────────────────┘
   │
   ▼
✅ User authenticated
   │
   ▼
┌─────────────────────────────────────┐
│ Layer 2: Input Validation           │
│                                     │
│ Zod Schema Validation:              │
│   - Type checking                   │
│   - Required fields                 │
│   - Format validation               │
│   - Length constraints              │
│                                     │
│ If invalid:                         │
│   return 400 Bad Request            │
└─────────────────────────────────────┘
   │
   ▼
✅ Input validated
   │
   ▼
┌─────────────────────────────────────┐
│ Layer 3: Authorization              │
│                                     │
│ Check resource ownership:           │
│                                     │
│ const { data: project } =           │
│   await supabase                    │
│     .from("projects")               │
│     .select()                       │
│     .eq("id", project_id)           │
│     .eq("user_id", user.id)         │
│     .single()                       │
│                                     │
│ if (!project) {                     │
│   return 403 Forbidden              │
│ }                                   │
└─────────────────────────────────────┘
   │
   ▼
✅ User authorized
   │
   ▼
┌─────────────────────────────────────┐
│ Layer 4: SQL Injection Prevention   │
│ File: lib/sql/generator.ts         │
│                                     │
│ sanitizeIdentifier(name) {          │
│   // Remove special characters      │
│   const clean = name                │
│     .replace(/[^a-zA-Z0-9_]/g, '')  │
│                                     │
│   // Check starts with letter       │
│   if (!/^[a-zA-Z_]/.test(clean)) {  │
│     throw Error("Invalid")          │
│   }                                 │
│                                     │
│   // Check length (max 63)          │
│   if (clean.length > 63) {          │
│     throw Error("Too long")         │
│   }                                 │
│                                     │
│   return clean                      │
│ }                                   │
│                                     │
│ Applied to ALL identifiers:         │
│   - Table names                     │
│   - Column names                    │
│   - Index names                     │
│   - Policy names                    │
└─────────────────────────────────────┘
   │
   ▼
✅ SQL safe
   │
   ▼
┌─────────────────────────────────────┐
│ Layer 5: Row Level Security (RLS)   │
│                                     │
│ Every table has RLS enabled:        │
│                                     │
│ CREATE POLICY "user_access"         │
│ ON table_name                       │
│ FOR ALL                             │
│ USING (user_id = auth.uid());       │
│                                     │
│ PostgreSQL automatically adds:      │
│   WHERE user_id = auth.uid()        │
│                                     │
│ to ALL queries (SELECT, INSERT,     │
│ UPDATE, DELETE)                     │
│                                     │
│ Users can ONLY access their data    │
└─────────────────────────────────────┘
   │
   ▼
✅ Data isolated
   │
   ▼
┌─────────────────────────────────────┐
│ Layer 6: Rate Limiting              │
│                                     │
│ AI endpoints have quotas:           │
│   - 10 requests/day (free tier)     │
│                                     │
│ Check in decision_traces:           │
│   SELECT COUNT(*)                   │
│   FROM decision_traces              │
│   WHERE user_id = $1                │
│   AND created_at >= CURRENT_DATE    │
│                                     │
│ If count >= 10:                     │
│   return 429 Too Many Requests      │
└─────────────────────────────────────┘
   │
   ▼
✅ Rate limit OK
   │
   ▼
Process request safely
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Application starts
   │
   ▼
┌─────────────────────────────────────┐
│ Root Layout                         │
│ File: app/layout.tsx                │
│                                     │
│ Wraps entire app with:              │
│   - Toaster (notifications)         │
│   - Font configuration              │
└─────────────────────────────────────┘
   │
   ▼
User navigates to /dashboard
   │
   ▼
┌─────────────────────────────────────┐
│ Dashboard Layout                    │
│ File: app/dashboard/layout.tsx     │
│                                     │
│ <ProjectProvider>                   │
│   <DashboardSidebar />              │
│   {children}                        │
│ </ProjectProvider>                  │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ ProjectProvider Initialization      │
│ File: lib/hooks/use-project.tsx    │
│                                     │
│ useEffect(() => {                   │
│   loadProjects()                    │
│ }, [])                              │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Load Projects                       │
│                                     │
│ const { projects } =                │
│   await getProjects()               │
│                                     │
│ setProjects(allProjects)            │
│                                     │
│ if (allProjects.length > 0) {       │
│   switchProject(allProjects[0].id)  │
│ }                                   │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Load Active Schema                  │
│                                     │
│ const { data: config } =            │
│   await supabase                    │
│     .from("vibe_configs")           │
│     .select("schema_json")          │
│     .eq("project_id", projectId)    │
│     .eq("is_active", true)          │
│     .single()                       │
│                                     │
│ setActiveSchema(config.schema_json) │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ Context Value Available             │
│                                     │
│ {                                   │
│   currentProject: {...},            │
│   activeSchema: {...},              │
│   projects: [...],                  │
│   isLoading: false,                 │
│   error: null,                      │
│   switchProject: fn,                │
│   refreshSchema: fn,                │
│   refreshProjects: fn              │
│ }                                   │
└─────────────────────────────────────┘
   │
   ▼
All dashboard pages can access via:
const { currentProject, activeSchema } = useProject()
```

---

## 📊 Working vs Non-Working Features

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE STATUS MAP                            │
└─────────────────────────────────────────────────────────────────┘

✅ WORKING FEATURES
├── AI Schema Generation
│   ├── Natural language processing
│   ├── Intent classification
│   ├── Schema validation
│   └── Decision logging
│
├── Database Provisioning
│   ├── SQL generation
│   ├── RLS policy creation
│   ├── Foreign key setup
│   ├── Trigger creation
│   └── Resource registration
│
├── Dynamic CRUD Interface
│   ├── List views
│   ├── Create forms
│   ├── Edit forms
│   ├── Detail views
│   ├── Pagination
│   ├── Search
│   └── Filtering
│
├── Code Export (NEW)
│   ├── ZIP download
│   ├── GitHub push
│   ├── Complete Next.js app
│   └── Production-ready code
│
├── Project Management
│   ├── Create projects
│   ├── Update projects
│   ├── Delete projects
│   └── List projects
│
├── Schema Versioning
│   ├── Version tracking
│   ├── Rollback capability
│   └── History view
│
└── Security
    ├── JWT authentication
    ├── RLS policies
    ├── SQL sanitization
    └── Rate limiting

❌ NON-WORKING FEATURES
├── Old Code Generator
│   ├── Uses Refine.dev (missing deps)
│   ├── Not integrated
│   └── Generates broken code
│
├── Old Export System
│   ├── Incomplete
│   └── Not connected to UI
│
└── Demo Pages
    └── Isolated, not linked

⚠️ DEPRECATED FEATURES
├── Static Table Pages
│   └── Replaced by dynamic pages
│
└── Legacy Components
    └── Not used anymore
```

---

**End of Visual Flows**
