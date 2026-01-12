# README: VibeCRM Documentation
**Last Updated:** 2026-01-05  
**Status:** Production-Ready Specifications

---

## 🎯 Quick Start

If you're new to VibeCRM development, read these files in order:

1. **`instructions.md`** - Development rules, tech stack, architectural patterns
2. **`api-contracts.json`** - Complete API specification and data model
3. **`migration-logs.md`** - Database schema and implementation roadmap
4. **`MULTI_TENANCY_DESIGN.md`** - RLS-based security architecture
5. **`claude.md`** - AI integration guide for schema generation

---

## 📁 File Structure

### Core Documentation (Must Read)

| File | Purpose | Size |
|------|---------|------|
| `instructions.md` | Global development rules, security, performance, a11y | 12KB |
| `api-contracts.json` | Complete API & database specification | 8.4KB |
| `migration-logs.md` | Database schema, migration history, action items | 12KB |
| `subagents.md` | Quality assurance & automated testing protocol | 13KB |
| `components.md` | shadcn/ui component patterns & usage examples | 9.4KB |
| `claude.md` | Claude integration guide & schema generation rules | 14KB |

### Architectural Specifications (Deep Dives)

| File | Purpose | Size |
|------|---------|------|
| `MULTI_TENANCY_DESIGN.md` | RLS implementation, security guarantees, testing | 11KB |
| `THEME_TOKENS.md` | SaaS 2.0 design system, colors, typography | 12KB |
| `SCHEMA_VALIDATION_SPEC.md` | AI schema validation pipeline (reference) | 2.2KB |
| `MOBILE_RESPONSIVE_SPEC.md` | Responsive patterns, touch gestures, device quirks | 15KB |
| `VIBE_REPLAY_SPEC.md` | AI transparency UI feature specification | 20KB |

### Meta Documentation

| File | Purpose | Size |
|------|---------|------|
| `DOCUMENTATION_UPDATE_SUMMARY.md` | Change log from architectural audit | 12KB |
| `README.md` | This file - Documentation guide | - |

---

## 🏗️ Implementation Roadmap

### ✅ Phase 0: Architecture (COMPLETE)
- All architectural decisions finalized
- Documentation updated to 100% alignment
- Ready for implementation

### 🔄 Phase 1: Core Backend (IN PROGRESS)
**Priority:** HIGH  
**Estimated Time:** 2-3 weeks

**Tasks:**
1. Create database schema (see `migration-logs.md` lines 43-148)
2. Implement `/api/v1/generate` endpoint (see `api-contracts.json` lines 46-71)
3. Implement `/api/v1/provision` endpoint (see `api-contracts.json` lines 72-95)
4. Set up schema validation pipeline (see `SCHEMA_VALIDATION_SPEC.md`)

**Deliverables:**
- Supabase schema with RLS policies
- Working AI schema generation
- Safe SQL provisioning system

### ⏸️ Phase 2: Frontend Foundation (PENDING)
**Priority:** HIGH  
**Estimated Time:** 2-3 weeks

**Tasks:**
1. Dynamic Table Renderer (see `claude.md` lines 280-330)
2. Responsive layouts (see `MOBILE_RESPONSIVE_SPEC.md`)
3. Theme implementation (see `THEME_TOKENS.md`)
4. Command Palette (see `components.md` lines 85-115)

**Deliverables:**
- AI-generated tables rendered correctly
- Mobile-responsive UI
- Working Cmd+K command palette

### ⏸️ Phase 3: Quality & Testing (PENDING)
**Priority:** MEDIUM  
**Estimated Time:** 1-2 weeks

**Tasks:**
1. Implement 6 subagents (see `subagents.md`)
2. Write RLS tests (see `MULTI_TENANCY_DESIGN.md` lines 220-290)
3. Accessibility audit tools
4. Performance monitoring

**Deliverables:**
- CI/CD pipeline with quality gates
- Automated testing suite
- Security scan results

### ⏸️ Phase 4: Advanced Features (PENDING)
**Priority:** LOW (Post-MVP)  
**Estimated Time:** 2-3 weeks

**Tasks:**
1. Vibe Replay UI (see `VIBE_REPLAY_SPEC.md`)
2. Touch gestures (see `MOBILE_RESPONSIVE_SPEC.md` lines 220-280)
3. Schema versioning & undo
4. AI suggestions based on usage

**Deliverables:**
- Working Vibe Replay feature
- Mobile gesture support
- Enhanced AI intelligence

---

## 🔑 Key Architectural Decisions

### Multi-Tenancy: RLS-Based
- **What:** Row-Level Security policies filter data by `user_id`
- **Why:** Better performance, simpler infrastructure, fits free tier
- **Trade-Off:** Shared schema vs perfect isolation
- **Details:** See `MULTI_TENANCY_DESIGN.md`

### Schema Evolution: Supabase Migrations
- **What:** Claude generates `ALTER TABLE` statements
- **Why:** Native Supabase integration, version control friendly
- **Safety:** Double confirmation for destructive ops
- **Details:** See `migration-logs.md` and `api-contracts.json`

### State Management: Optimistic Updates
- **What:** Refine's `useForm` with last-write-wins
- **Why:** Simplifies MVP, accepts data loss risk for simplicity
- **Future:** Add conflict resolution UI post-MVP
- **Details:** See `instructions.md` lines 23-30

---

## 🛡️ Security Model

### No Raw SQL Ever
```typescript
// ❌ BLOCKED
await supabase.rpc("execute_sql", { sql: userInput });

// ✅ REQUIRED
const schema = validateSchema(userInput);
const sql = generateSafeSQL(schema);
await supabase.rpc("execute_migration", { sql });
```

### RLS Policies on All Tables
Every user-generated table MUST have:
```sql
CREATE POLICY user_isolation ON {table}
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Validation Pipeline
1. **Pre-Generation:** Quota, intent, entity count
2. **Post-Generation:** JSON structure, reserved words, foreign keys
3. **Pre-Provisioning:** Schema lock, SQL generation, RLS policies

**Details:** See `SCHEMA_VALIDATION_SPEC.md`

---

## 🎨 Design System

### Color Tokens (CRM-Specific)
```css
--deal-won: hsl(142.1 76.2% 36.3%);      /* Green */
--deal-lost: hsl(0 84.2% 60.2%);         /* Red */
--deal-negotiating: hsl(45.4 93.4% 47.5%); /* Amber */
--priority-high: hsl(0 84.2% 60.2%);     /* Red */
--priority-medium: hsl(221.2 83.2% 53.3%); /* Blue */
--priority-low: hsl(142.1 76.2% 36.3%);  /* Green */
```

**Details:** See `THEME_TOKENS.md`

### Responsive Breakpoints
- **Mobile:** 320px - 639px (card-based layouts)
- **Tablet:** 640px - 1023px (hybrid layouts)
- **Desktop:** 1024px+ (full tables)

**Details:** See `MOBILE_RESPONSIVE_SPEC.md`

---

## 🧪 Testing Strategy

### Unit Tests
- Validation functions (reserved words, foreign keys, circular deps)
- SQL generator
- UI components

### Integration Tests
- Full pipeline: prompt → validation → provisioning
- RLS policy enforcement
- API route auth checks

### E2E Tests (Playwright)
- User creates project → schema generated → data added
- Mobile responsive flows
- Keyboard shortcuts

**Details:** See `subagents.md` and `MULTI_TENANCY_DESIGN.md`

---

## 🚀 Getting Started (For New Developers)

### 1. Set Up Environment
```bash
# Clone repo
git clone <repo-url>
cd VibeCRM

# Install dependencies
npm install

# Set up Supabase
# Create project at supabase.com
# Copy .env.example to .env.local
# Add Supabase URL and keys
```

### 2. Read Core Documentation
- `instructions.md` - Development rules
- `api-contracts.json` - API specification
- `migration-logs.md` - Database schema

### 3. Run Database Migrations
```bash
# Apply schema from migration-logs.md
npx supabase db push
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Run Quality Checks
```bash
# Type check + lint (Agent 1)
npm run type-check && npm run lint

# Security scan (Agent 4)
npm run security-scan

# Accessibility check (Agent 6)
npm run a11y-check
```

---

## 📖 Common Tasks

### Adding a New Component
1. Check `components.md` for existing patterns
2. Use shadcn/ui primitives only (no Ant Design)
3. Follow theme tokens from `THEME_TOKENS.md`
4. Add `@fileoverview` comment with reasoning
5. Test responsive behavior (see `MOBILE_RESPONSIVE_SPEC.md`)

### Modifying Database Schema
1. Update `migration-logs.md` with change
2. Ensure RLS policy is created (see `MULTI_TENANCY_DESIGN.md`)
3. Update `api-contracts.json` entity definition
4. Run `npx supabase gen types` to update TypeScript types
5. Run Agent 2 (Schema Verifier) to validate

### Adding a New API Route
1. Check `api-contracts.json` for endpoint spec
2. Add Supabase auth check (see `instructions.md` security rules)
3. Use Zod for request validation
4. Create decision_trace for schema changes
5. Return JSON responses (no raw data)

---

## 🐛 Troubleshooting

### "RLS Policy Not Working"
- Check policy is enabled: `ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;`
- Verify policy USING clause includes `user_id = auth.uid()`
- Test with `supabase db test` (see `MULTI_TENANCY_DESIGN.md` lines 220-290)

### "Schema Validation Failing"
- Check reserved keywords (`user`, `order`, `table`, etc.)
- Verify foreign keys reference existing tables
- Ensure audit columns present (`user_id`, `created_at`, `updated_at`)
- See `SCHEMA_VALIDATION_SPEC.md` for complete rules

### "Mobile Layout Broken"
- Verify responsive classes (`md:hidden`, `lg:block`)
- Check `MOBILE_RESPONSIVE_SPEC.md` for correct patterns
- Test on real device (iOS Safari, Android Chrome)
- Check viewport height calculation (iOS quirk)

---

## 📞 Support

**Documentation Issues:** Open GitHub issue with "docs:" prefix  
**Implementation Questions:** Reference specific file/line in issue  
**Security Concerns:** Email security@vibe-crm.com (do not open public issue)

---

## 📊 Documentation Stats

- **Total Files:** 12
- **Total Size:** ~120KB
- **Last Updated:** 2026-01-05
- **Coverage:**
  - ✅ Security: 100%
  - ✅ RLS Policies: 100%
  - ✅ API Endpoints: 100%
  - ✅ UI Components: 100%
  - ✅ Testing Strategy: 100%

---

**Ready to Build?** Start with Phase 1 tasks in `migration-logs.md` 🚀
