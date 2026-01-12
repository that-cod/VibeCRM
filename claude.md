# Claude Development Guide: Refine.dev Implementation

## 1. Core Logic Strategy

### Resource-Centric Architecture
Every CRM feature must be mapped to a **Resource**. In VibeCRM, resources are dynamically generated from user prompts.

**Example:**
- User prompt: "Track sales deals with companies and contacts"
- Generated resources: `deals`, `companies`, `contacts`
- Refine registration:
  ```tsx
  <Refine
    resources={[
      { name: "deals", list: "/deals", create: "/deals/create", edit: "/deals/:id/edit" },
      { name: "companies", list: "/companies", create: "/companies/create" },
      { name: "contacts", list: "/contacts", create: "/contacts/create" },
    ]}
  />
  ```

### The "Logic First" Rule
Always define the `useTable` or `useForm` hook **before** writing any UI/JSX code.

**Rationale:** Refine hooks provide data, loading states, and error handling. UI components are just presentation layers.

**Pattern:**
```tsx
// ✅ CORRECT: Logic first, then UI
function DealList() {
  // 1. Logic layer (Refine hook)
  const { tableQueryResult, current, setCurrent, pageSize, setPageSize } = useTable({
    resource: "deals",
    pagination: { current: 1, pageSize: 50 },
  });
  
  const deals = tableQueryResult.data?.data ?? [];
  
  // 2. UI layer (shadcn components)
  return (
    <div>
      {deals.length === 0 ? <EmptyDeals /> : <DataTable data={deals} />}
      <Pagination current={current} pageSize={pageSize} />
    </div>
  );
}

// ❌ WRONG: Mixing fetch logic with UI
function DealList() {
  const [deals, setDeals] = useState([]);
  
  useEffect(() => {
    fetch("/api/deals").then(r => r.json()).then(setDeals);
  }, []); // This bypasses Refine's caching and error handling
  
  return <div>{/* UI */}</div>;
}
```

### Relational Integrity
When a user prompts for a relationship (e.g., "Tasks for a Deal"), you must:
1. Use the `useSelect` hook for UI dropdowns
2. Create foreign keys in the JSON Schema
3. Define RLS policies to maintain user isolation

**Example:**
```tsx
// UI: Select company for a deal
import { useSelect } from "@refinedev/core";

const { selectProps } = useSelect({
  resource: "companies",
  optionLabel: "name",
  optionValue: "id",
});

return <Select {...selectProps} />;
```

**Database Schema:**
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  -- ... other fields
);
```

---

## 2. Component Mapping (shadcn/ui + Refine)

Follow this **strict mapping** when building UI:

### Lists
- **Refine:** `useTable` provides data, pagination, sorting, filtering
- **shadcn:** `Table`, `TableBody`, `TableRow`, `TableCell`

```tsx
import { useTable } from "@refinedev/react-table";
import { Table } from "@/components/ui/table";

const { getRowModel } = useTable({ columns, refineCoreProps: { resource: "deals" } });

return <Table>{/* Render rows from getRowModel() */}</Table>;
```

### Modals/Drawers
- **Refine:** `useModalForm` controls visibility and form state
- **shadcn:** `Dialog` or `Sheet` (prefer Sheet for mobile UX)

```tsx
import { useModalForm } from "@refinedev/react-hook-form";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const { modal, saveButtonProps, register } = useModalForm({
  refineCoreProps: { resource: "deals", action: "create" },
});

return (
  <Sheet open={modal.visible} onOpenChange={(open) => !open && modal.close()}>
    <SheetContent>{/* Form fields */}</SheetContent>
  </Sheet>
);
```

### Filters
- **Refine:** `filters` array with operators (`eq`, `contains`, `gte`, etc.)
- **shadcn:** `Input`, `Select`, `DatePicker` (future)

```tsx
import { useTable } from "@refinedev/core";

const { setFilters } = useTable({ resource: "deals" });

// On input change
setFilters([
  { field: "name", operator: "contains", value: searchTerm },
  { field: "status", operator: "eq", value: selectedStatus },
]);
```

### Notifications
- **Refine:** `useNotification` for success/error messages
- **shadcn:** `sonner` for toast notifications

```tsx
import { useNotification } from "@refinedev/core";
import { toast } from "sonner";

const { open } = useNotification();

// After mutation
open?.({
  type: "success",
  message: "Deal created successfully",
});

// Or directly with sonner
toast.success("Deal created successfully");
```

---

## 3. JSON Schema Generation Protocol

When the user provides a prompt, generate a JSON schema following these rules:

### Rule 1: Normalization
Always create **separate tables** for distinct entities. No mega-tables.

**Example:**
- ❌ Bad: One `crm_data` table with columns `deal_name`, `company_name`, `contact_name`
- ✅ Good: Three tables: `deals`, `companies`, `contacts` with foreign keys

### Rule 2: Metadata with ui_hints
Include **`ui_hints`** for icons, labels, and column visibility:

```json
{
  "tables": [
    {
      "name": "deals",
      "ui_hints": {
        "icon": "handshake",
        "label": "Deals",
        "description": "Sales opportunities you're tracking",
        "color": "blue",
        "columns": {
          "name": {
            "display_name": "Deal Name",
            "filterable": true,
            "sortable": true,
            "mobile_priority": 1
          },
          "value": {
            "display_name": "Deal Value",
            "type": "currency",
            "mobile_priority": 2
          },
          "notes": {
            "display_name": "Notes",
            "type": "textarea",
            "mobile_priority": 4
          }
        }
      },
      "columns": [
        { "name": "id", "type": "UUID", "nullable": false },
        { "name": "user_id", "type": "UUID", "nullable": false, "references": { "table": "auth.users", "column": "id" } },
        { "name": "name", "type": "TEXT", "nullable": false },
        { "name": "value", "type": "NUMERIC", "nullable": true },
        { "name": "company_id", "type": "UUID", "nullable": true, "references": { "table": "companies", "column": "id", "onDelete": "SET NULL" } },
        { "name": "created_at", "type": "TIMESTAMPTZ", "nullable": false, "default": "NOW()" },
        { "name": "updated_at", "type": "TIMESTAMPTZ", "nullable": false, "default": "NOW()" }
      ]
    }
  ]
}
```

### Rule 3: Mandatory Audit Columns
Every table must include (enforced by `SCHEMA_VALIDATION_SPEC.md`):

```sql
user_id UUID REFERENCES auth.users(id) NOT NULL,  -- For RLS filtering
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
```

### Rule 4: Traceability for Context Graph
When generating or modifying schemas, create a `decision_trace` record:

```typescript
await supabase.from("decision_traces").insert({
  project_id: currentProject.id,
  user_id: user.id,
  intent: "User asked to track sales deals with companies",
  action: "Generated 3 tables: deals, companies, contacts",
  precedent: "Standard CRM pattern: Deal → Company (many-to-one)",
  version: "1.0.0",
});
```

**Why:** Powers the Vibe Replay feature, showing users how their CRM evolved.

---

## 4. Validation Gates (Security & Quality)

Before generating schemas, validate based on `SCHEMA_VALIDATION_SPEC.md`:

### Pre-Generation Checks
```typescript
// 1. Quota check
if (userAIRequestsToday >= tierLimits.maxAIRequests) {
  throw new Error("Daily AI request limit reached");
}

// 2. Intent classification
const intent = await classifyIntent(userPrompt);
if (!["CREATE", "MODIFY", "RELATE"].includes(intent)) {
  throw new Error(`Invalid intent: ${intent}`);
}

// 3. Entity count estimation
const estimatedTables = estimateEntityCount(userPrompt);
if (estimatedTables > tierLimits.maxTables) {
  throw new Error(`Your prompt may create ${estimatedTables} tables (limit: ${tierLimits.maxTables})`);
}
```

### Post-Generation Validation
```typescript
// 1. JSON structure validation (Zod)
const validated = CRMSchemaValidator.parse(generatedSchema);

// 2. Reserved keywords
validateNoReservedWords(validated);

// 3. Foreign key integrity
validateForeignKeys(validated);

// 4. Circular dependencies
detectCircularDependencies(validated);

// 5. Audit columns present
validateAuditColumns(validated);
```

### Provisioning Safety
```typescript
// NEVER accept raw SQL
// ❌ const sql = userInput;

// ✅ Generate SQL from validated schema
const safeSQL = generateSQLFromSchema(validatedSchema);

// Wrap in transaction for rollback on error
await supabase.rpc("execute_in_transaction", { sql: safeSQL });
```

---

## 5. Schema Evolution & Destructive Operations

When users modify existing schemas:

### ALTER TABLE Generation
```typescript
// User prompt: "Add priority field to tasks"
// Claude generates:
{
  "operation": "ALTER",
  "table": "tasks",
  "changes": [
    {
      "type": "ADD_COLUMN",
      "column": {
        "name": "priority",
        "type": "TEXT",
        "nullable": true,
        "default": "'medium'"
      }
    }
  ]
}

// Converted to SQL:
ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium';
```

### Destructive Operations Protocol
If user prompts: "Remove the phone column from contacts"

**Step 1:** Show impact warning
```
⚠️ WARNING: Destructive operation detected

Your request: "Remove the phone column from contacts"

Impact:
- 1,247 contacts currently have phone numbers
- This data will be PERMANENTLY LOST
- This cannot be undone

Type "I understand" to continue, or modify your request.
```

**Step 2:** Second confirmation (if user types "I understand")
```
🚨 FINAL CONFIRMATION

To DELETE the 'phone' column and ALL DATA, type exactly:
DELETE PHONE COLUMN

This is your last chance to cancel.
```

**Step 3:** Only execute after both confirmations

---

## 6. Dynamic Table Renderer

Build a renderer that translates `ui_hints` to shadcn components:

```tsx
// components/DynamicTableRenderer.tsx
export function DynamicTableRenderer({ schema, resource }) {
  const hints = schema.ui_hints[resource];
  
  // Map column types to components
  const renderCell = (column, value) => {
    const colHints = hints.columns[column.name];
    
    switch (colHints.type) {
      case "currency":
        return <span>${value.toLocaleString()}</span>;
      
      case "url":
        return <a href={value} className="text-primary underline">{value}</a>;
      
      case "enum":
        return <Badge variant={value}>{value}</Badge>;
      
      case "textarea":
        return <p className="text-sm text-muted-foreground line-clamp-2">{value}</p>;
      
      default:
        return <span>{value}</span>;
    }
  };
  
  const { tableQueryResult } = useTable({ resource });
  const data = tableQueryResult.data?.data ?? [];
  
  return (
    <Table>
      <TableHeader>
        {/* Render headers from hints.columns */}
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id}>
            {Object.entries(row).map(([key, value]) => (
              <TableCell key={key}>
                {renderCell({ name: key }, value)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 7. RLS Policy Generation

For every user-generated table, create an RLS policy:

```sql
-- Template
CREATE POLICY user_isolation ON {table_name}
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Example for deals table
CREATE POLICY user_isolation ON deals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Critical:** Without RLS, users could see each other's data (major security vulnerability).

---

## 8. Decision Trace for Reasoning Blocks

For every code block generated, include a "Reasoning" block at the top:

```tsx
/**
 * @fileoverview Deal list view with dynamic filtering and Vibe-aware state management.
 * 
 * Reasoning:
 * - Why useTable? Provides built-in pagination, sorting, and filtering without manual state.
 * - How does this handle scaling? Refine's useTable supports infinite scroll and virtualization.
 * - What precedent? Standard CRM list pattern with mobile-responsive card view fallback.
 * 
 * Context Graph:
 * - All creates/updates trigger decision_trace logging (see onSuccess handler).
 * - Table schema dynamically loaded from vibe_configs (user's AI-generated schema).
 */

import { useTable } from "@refinedev/core";
// ... component code
```

---

## 9. Performance Patterns

### Avoid N+1 Queries
```tsx
// ❌ WRONG - Fires a query per deal
deals.map((deal) => {
  const { data: company } = useOne({ resource: "companies", id: deal.company_id });
  return <div>{company?.name}</div>;
});

// ✅ CORRECT - Single query for all companies
const companyIds = deals.map(d => d.company_id);
const { data: companies } = useMany({
  resource: "companies",
  ids: companyIds,
});

deals.map((deal) => {
  const company = companies?.find(c => c.id === deal.company_id);
  return <div>{company?.name}</div>;
});
```

### Use React.memo for Expensive Renders
```tsx
export const DealCard = React.memo(({ deal }) => {
  // Complex rendering logic
}, (prevProps, nextProps) => prevProps.deal.id === nextProps.deal.id);
```

---

## 10. Keyboard Shortcuts & Power User Features

Implement global shortcuts for Vibe Replay and command palette:

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd+K: Open command palette
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      openCommandPalette();
    }
    
    // Cmd+/: Open Vibe Replay
    if ((e.metaKey || e.ctrlKey) && e.key === "/") {
      e.preventDefault();
      openVibeReplay();
    }
  };
  
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

---

## Summary: The VibeCRM Development Loop

1. **User Prompt** → Validate → Generate JSON Schema → Create decision_trace
2. **Schema Review** → Show ER diagram → Confirm → Provision with RLS policies
3. **Dynamic Rendering** → Read ui_hints → Map to shadcn components → Refine hooks for data
4. **Mutations** → useForm → Create decision_trace → Show success notification
5. **Vibe Replay** → Show timeline of all prompts and schema changes

**Always:** Logic first (Refine hooks), then UI (shadcn components). Never raw SQL. Always RLS.