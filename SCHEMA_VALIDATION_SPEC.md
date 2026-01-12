# Schema Validation Specification
**(Complete version available in brain/91e12d09-6c4e-49e0-b5e9-1a1242bc7852/schema_validation_spec.md)**

**This file is a reference copy. For the full specification with code examples, see the audit artifacts.**

---

## Quick Reference

### Validation Pipeline

1. **Pre-Generation:**
   - Quota check (free tier: 10 AI requests/day)
   - Intent classification (CREATE/MODIFY/RELATE only)
   - Entity count estimation (max 15 tables)

2. **Post-Generation:**
   - JSON structure validation (Zod schema)
   - Reserved keyword detection
   - Foreign key integrity check
   - Circular dependency detection
   - Audit column verification (`user_id`, `created_at`, `updated_at`)

3. **Pre-Provisioning:**
   - Acquire schema lock (prevent concurrent modifications)
   - Generate SQL from JSON (NO raw SQL accepted)
   - Create RLS policies for all tables
   - Execute in transaction with rollback on error

### Schema Limits (Free Tier)

| Constraint | Limit | Reason |
|------------|-------|--------|
| Tables per project | 15 | Prevents complexity, fits free tier |
| Columns per table | 50 | PostgreSQL best practice |
| Relationship nesting | 3 levels | Prevents infinite recursion |
| AI requests/day | 10 | Rate limiting |

### Reserved Keywords (Blocked)

```typescript
const POSTGRES_RESERVED = [
  "user", "order", "table", "column", "index", "constraint",
  "select", "insert", "update", "delete", "where", "from"
];
```

### Mandatory Columns (Every Table)

```sql
user_id UUID REFERENCES auth.users(id) NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
```

---

## Implementation Status

- [x] Zod schema for JSON validation
- [ ] Quota enforcement function
- [ ] Intent classification using Claude
- [ ] Entity count estimation (NER)
- [ ] Reserved keyword validator
- [ ] Foreign key integrity checker
- [ ] Circular dependency detector
- [ ] Schema lock system (distributed lock)
- [ ] Safe SQL generator (parameterized templates)
- [ ] RLS policy generator

---

For complete implementation details, code examples, and testing strategies, see:  
`/Users/maheshyadav/.gemini/antigravity/brain/91e12d09-6c4e-49e0-b5e9-1a1242bc7852/schema_validation_spec.md`
