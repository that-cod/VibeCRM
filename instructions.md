# VibeCRM Global Instructions

## Core Tech Stack
- **Framework:** Refine.dev v4 (Headless) + Next.js (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL) with Row-Level Security (RLS)
- **AI Orchestrator:** Claude 3.5 Sonnet (Anthropic API)
- **Auth:** Supabase Auth (email/password + OAuth providers)

## Architecture Decisions

### Multi-Tenancy Model: RLS-Based Isolation
- **Strategy:** Shared database schema with Row-Level Security policies
- **Rationale:** Better performance, simpler infrastructure, fits Supabase free tier
- **Constraint:** One project per user (for now)
- **Security:** All tables use `user_id` filtering via RLS policies

### Schema Evolution Strategy
- **Migrations:** Supabase built-in migration system
- **AI Role:** Claude generates `ALTER TABLE` statements for schema changes
- **Safety:** Double confirmation required for destructive operations
- **Conflict Resolution:** Last-write-wins (no rollback for MVP)
- **Priority:** New schema takes precedence over old data

### State Management
- **Optimistic Updates:** Enabled via Refine's `useForm` (built-in)
- **Concurrent Edits:** Last write wins (no conflict resolution UI for MVP)
- **Schema Modifications:** Locked per project (no concurrent AI edits allowed)

---

## Development Rules

### 1. Refine-First Logic
Always use Refine hooks (`useTable`, `useForm`, `useSelect`) for data operations. **Do not use raw `useEffect` for fetching.**

**Rationale:** Refine hooks provide built-in caching, loading states, error handling, and optimistic updates. Raw fetching duplicates this logic and creates inconsistency.

**Example:**
```tsx
// ✅ CORRECT
const { tableProps } = useTable({ resource: "deals" });

// ❌ WRONG
useEffect(() => {
  fetch("/api/deals").then(/* manual state management */);
}, []);
```

### 2. Component Architecture
Use **shadcn/ui** for all visual primitives. Wrap them in Refine's logic.

**Mapping:**
- Lists → `useTable` + `shadcn/ui Table`
- Create/Edit → `useForm` or `useModalForm` + `shadcn/ui Sheet/Dialog`
- Filters → `filters` array + `shadcn/ui Input/Select`
- Notifications → `useNotification` + `sonner`

**Banned:** Ant Design, Material-UI, Bootstrap. Only shadcn/ui components allowed.

### 3. Error Boundaries & Suspense
Every route must have:
- **Suspense boundary** with `<Skeleton />` fallback
- **error.tsx** fallback component
- **not-found.tsx** for 404 states

**Example Structure:**
```
app/
  deals/
    list/
      page.tsx       # Main component
      loading.tsx    # Suspense fallback (Skeleton)
      error.tsx      # Error boundary UI
```

### 4. Loading States
Use shadcn `Skeleton` for all async operations. **No blank screens, no generic spinners.**

**Pattern:**
```tsx
{isLoading ? <Skeleton className="h-8 w-full" /> : <DataTable />}
```

### 5. No Guessing
If a library version is unclear, ask the user. Default to latest stable versions for shadcn and Refine v4.

**Check versions before installing:**
```bash
npm info @refinedev/core version
npm info @supabase/supabase-js version
```

### 6. Type Safety
**Strict TypeScript only.** No `any`. Generate types from Supabase schema.

**Setup:**
```bash
npx supabase gen types typescript --project-id [PROJECT_ID] > types/supabase.ts
```

**Usage:**
```tsx
import { Database } from "@/types/supabase";
type Deal = Database["public"]["Tables"]["deals"]["Row"];
```

### 7. UI Consistency: "SaaS 2.0" Aesthetic
Follow these design principles:
- **White Space:** Minimum 16px padding on cards, 32px page margins
- **Borders:** Use `border-border` (subtle gray), not `border-gray-300`
- **Notifications:** Only `sonner` toasts, positioned top-right
- **Typography:** Inter font from Google Fonts
- **Colors:** Use theme tokens from `THEME_TOKENS.md` (CRM-specific states)

**Empty States:**
- Every empty list shows an illustration (using Lucide icons)
- Context-aware CTA: "Add your first deal" not "No data"
- Optional: "See an example" link to sample data

**Micro-Interactions:**
- Hover states on all interactive elements
- Loading skeletons during async operations
- Success animations for mutations (subtle checkmark)
- Error shake animation for form validation failures

### 8. Security (CRITICAL)
**Critical Rules:**
- ✅ **Never accept raw SQL.** Use JSON schema → SQL generator pipeline only
- ✅ **Validate all user inputs.** Use Zod schemas for API routes
- ✅ **Use Supabase RLS** for all permission checks (not application-level logic)
- ✅ **Environment variables:** Never commit `.env.local`. Use Vercel/Netlify secrets
- ✅ **API routes:** Verify user session on every request using Supabase Auth

**RLS Policy Pattern:**
```sql
-- All user-generated data must filter by user_id
CREATE POLICY "Users can only access their own data"
ON deals
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

**SQL Injection Prevention for `/api/provision`:**
```tsx
// ❌ WRONG - Direct SQL execution
await supabase.rpc("execute_sql", { sql: userInput });

// ✅ CORRECT - JSON schema validation → SQL generation
const validated = CRMSchemaValidator.parse(userInput);
const sql = generateSafeSQL(validated);
await supabase.rpc("execute_migration", { migration_sql: sql });
```

### 9. Performance
**Critical Rules:**
- ✅ **Index all foreign keys.** Supabase auto-creates them, verify with `pg_indexes`
- ✅ **Limit list views** to 50 items with pagination (`useTable` default)
- ✅ **Use React.memo** for expensive components (charts, complex tables)
- ✅ **Image optimization:** Use Next.js `<Image />` component with `sizes` prop
- ✅ **Bundle analysis:** Run `npm run build` and check for bloat (>500KB chunks)

**Detect N+1 Queries:**
```tsx
// ❌ WRONG - N+1 query
deals.map(deal => {
  const { data: company } = useOne({ resource: "companies", id: deal.company_id });
  // Fires a query per deal!
});

// ✅ CORRECT - Use `useMany` or JOIN
const { data: companies } = useMany({
  resource: "companies",
  ids: deals.map(d => d.company_id),
});
```

### 10. Accessibility
**All interactive elements must have:**
- ✅ **ARIA labels:** `<Button aria-label="Delete deal">...</Button>`
- ✅ **Keyboard navigation:** Test with Tab/Enter/Escape
- ✅ **Color contrast:** Minimum 4.5:1 (use WebAIM contrast checker)
- ✅ **Focus indicators:** Visible outline on `:focus-visible`

**shadcn/ui compliance:**
- Most shadcn components have built-in a11y (via Radix UI)
- **Custom components:** Add `role`, `aria-*` attributes manually

**Testing:**
```bash
npm run build && npx @axe-core/cli dist/
```

### 11. Mobile-First Responsive Design
**Breakpoints (from `MOBILE_RESPONSIVE_SPEC.md`):**
- Mobile: 320px - 640px (card-based layouts)
- Tablet: 641px - 1024px (hybrid layouts)
- Desktop: 1025px+ (full DataTable experience)

**DataTable Responsive Pattern:**
```tsx
// Mobile: Card view with key fields
// Tablet: Horizontal scroll with sticky first column
// Desktop: Full table with all columns
<ResponsiveDataTable 
  mobileLayout="cards"
  tabletLayout="scroll"
  desktopLayout="full"
/>
```

---

## File Header Requirement
Every new file must begin with a JSDoc `@fileoverview` comment:

```tsx
/**
 * @fileoverview Deal list view component using Refine useTable + shadcn DataTable.
 * 
 * Reasoning:
 * - useTable provides server-side pagination, sorting, filtering out of the box.
 * - shadcn Table is headless (no built-in data logic), perfect for Refine integration.
 * - Sheet component used for create/edit instead of modal for better mobile UX.
 * 
 * Dependencies:
 * - @refinedev/core: useTable, useNavigation
 * - @/components/ui: Table, Sheet, Button
 * - Supabase RLS: `deals` table policies enforce user can only see their own deals.
 */
```

**Required sections:**
1. **Purpose:** What this file does (1 sentence)
2. **Reasoning:** Why this architectural choice (2-3 bullets)
3. **Dependencies:** Key Refine hooks and shadcn components used

---

## AI-Specific Rules (For Claude Sonnet)

### Schema Generation Protocol
When generating JSON schemas for CRM entities:

1. **Normalization:** Always create separate tables for distinct entities (no mega-tables)

2. **Metadata:** Include `ui_hints` for every table and column:
   ```json
   {
     "ui_hints": {
       "icon": "building-2",        // Lucide icon name
       "label": "Companies",
       "description": "Organizations you do business with",
       "color": "blue",             // From THEME_TOKENS.md
       "columns": {
         "name": { 
           "display_name": "Company Name", 
           "filterable": true,
           "mobile_priority": 1     // Show on mobile card view
         },
         "website": { 
           "display_name": "Website", 
           "type": "url",
           "mobile_priority": 3     // Hide on mobile
         }
       }
     }
   }
   ```

3. **Audit Columns (MANDATORY):** Every table must include:
   ```sql
   user_id UUID REFERENCES auth.users(id) NOT NULL,
   created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
   updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   ```

4. **Validation Gates (enforced by `SCHEMA_VALIDATION_SPEC.md`):**
   - Max 15 tables per schema (free tier limit)
   - Max 50 columns per table
   - Max 3 levels of relationship nesting
   - No PostgreSQL reserved keywords (`user`, `order`, `table`, etc.)

### Decision Trace Requirement
For every schema generated or modified, create a `decision_trace` record:
```sql
INSERT INTO decision_traces (user_id, project_id, intent, action, precedent, version)
VALUES (
  $1, 
  $2,
  'User asked to track sales deals with companies and contacts',
  'Generated 3 tables: deals, companies, contacts with foreign keys',
  'Standard CRM pattern: Deal → Company (many-to-one), Deal → Contact (many-to-one)',
  'v1.0.0'
);
```

### Destructive Operations Protocol
When user prompts for destructive changes (DROP TABLE, DROP COLUMN, major type changes):

**Step 1:** Ask for confirmation with impact warning:
```
⚠️ WARNING: This operation will DELETE data.

Your request: "Remove the 'phone' column from contacts"

Impact:
- 1,247 contacts currently have phone numbers
- This data will be PERMANENTLY LOST
- This cannot be undone

Type "I understand" to confirm, or modify your request.
```

**Step 2:** If user confirms, ask AGAIN with typed confirmation:
```
🚨 FINAL CONFIRMATION REQUIRED

To proceed with deleting the 'phone' column and ALL associated data, 
type exactly: DELETE PHONE COLUMN

This is your last chance to cancel.
```

**Step 3:** Only execute after two explicit confirmations.

---

## Keyboard Shortcuts (For Vibe Replay & Command Palette)

**Global Shortcuts:**
- `Cmd/Ctrl + K` → Open command palette
- `Cmd/Ctrl + /` → Open Vibe Replay timeline
- `Cmd/Ctrl + Shift + C` → Create new record (context-aware)
- `?` → Show keyboard shortcuts help

**List View Shortcuts:**
- `C` → Create new
- `S` → Focus search
- `F` → Open filters
- `Enter` → Edit selected row
- `Delete` → Delete selected row (with confirmation)

**Form Shortcuts:**
- `Cmd/Ctrl + Enter` → Save
- `Escape` → Cancel without saving
- `Tab/Shift+Tab` → Navigate fields

---

## Git Commit Conventions
Use conventional commits:
- `feat:` New feature (e.g., `feat: add deal list view`)
- `fix:` Bug fix
- `refactor:` Code improvement without behavior change
- `docs:` Documentation only
- `style:` Formatting, linting
- `test:` Adding tests
- `chore:` Build scripts, dependencies

**Example:**
```bash
git commit -m "feat: implement dynamic table renderer with ui_hints support"
```

---

## When to Ask the User

**Always ask before:**
1. Adding a new major dependency (>50KB)
2. Modifying database schema in production (for existing projects)
3. Implementing a complex algorithm with trade-offs (UX vs performance)
4. Changing authentication strategy

**Never ask for:**
1. Styling tweaks (just follow SaaS 2.0 rules + THEME_TOKENS.md)
2. Adding type annotations
3. Standard error handling
4. Routine Refine hook usage

---

## Supabase Free Tier Constraints

**Limits (as of 2026):**
- Database: 500MB storage
- API requests: Unlimited
- Auth users: Unlimited
- File storage: 1GB
- Egress bandwidth: 2GB/month

**Optimization Strategies:**
- Use CDN for static assets (Vercel/Netlify)
- Compress images before upload
- Implement pagination on all list views
- Archive old records to cold storage if approaching limits

**Connection Pooling:**
- Free tier: ~60 concurrent connections
- Use Supabase's built-in pooler (PgBouncer mode)
- Implement connection retry logic for rate limits