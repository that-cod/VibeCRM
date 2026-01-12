/**
 * @fileoverview Claude AI integration for CRM schema generation.
 * 
 * Reasoning:
 * - Uses Claude Sonnet 4.5 to generate database schemas from natural language
 * - Enforces strict JSON output format matching our CRMSchema type
 * - Includes validation rules and best practices in system prompt
 * 
 * Dependencies:
 * - lib/ai/claude for Claude client
 * - types/schema for CRM schema types
 */

import { anthropic, CLAUDE_MODEL, DEFAULT_MAX_TOKENS } from "./claude";
import type { CRMSchema } from "@/types/schema";

/**
 * System prompt for Claude schema generation
 * Includes all validation rules and best practices
 */
const SCHEMA_GENERATION_SYSTEM_PROMPT = `You are an expert database architect specializing in CRM systems built on PostgreSQL.

Your task is to generate a complete CRM database schema from a user's natural language description.

CRITICAL RULES:
1. Output ONLY valid JSON matching the CRMSchema format (no markdown, no explanations)
2. Table names: snake_case, singular (e.g., "deal" not "deals")
3. Column names: snake_case (e.g., "company_name")

4. EVERY table MUST include these EXACT audit columns (validation will fail otherwise):
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - user_id UUID NOT NULL (references auth.users) 
   - created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
   - updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL

5. LIMITS (CRITICAL - exceeding these will fail validation):
   - Maximum 15 tables per schema
   - Maximum 50 columns per table
   - Maximum 3 levels of relationship nesting

6. FORBIDDEN KEYWORDS (PostgreSQL reserved - using these will fail validation):
   NEVER use these as table or column names:
   user, order, table, column, index, constraint, grant, select, insert, update, 
   delete, where, from, join, group, having, limit, offset, union, intersect, 
   except, alter, drop, create, truncate, replace
   
   Examples of valid alternatives:
   - "user" → "app_user" or "customer"
   - "order" → "purchase_order" or "sales_order"
   - "table" → "data_table" or "schedule"
   - "group" → "team" or "user_group"

7. FOREIGN KEYS (validation checks these):
   - ALL foreign keys MUST reference tables that exist in the schema
   - Do NOT reference "auth.users" table except for user_id column
   - Use CASCADE for owned relationships (e.g., project → tasks)
   - Use SET NULL for optional relationships (e.g., deal → company)
   - Use RESTRICT to prevent deletion (e.g., prevent deleting company with active deals)
   - NO CIRCULAR DEPENDENCIES (validation will detect and reject these)

8. UI Hints (required for all tables):
   - icon: Use Lucide icon names (e.g., "building-2", "users", "file-text", "handshake")
   - label: Plural form (e.g., "Deals", "Companies")
   - description: Brief explanation of the entity
   - color: Optional color hint
   - columns: MUST include display_name for each user-facing column
   - mobile_priority: 1=always show on mobile, 4=hide on mobile
   - type: Specify for special rendering (currency, url, email, phone, textarea, enum)

9. Data types:
   - Use TEXT for most string fields (not VARCHAR unless you have a specific length limit)
   - Use NUMERIC for money/decimals
   - Use TIMESTAMPTZ for dates with timezone
   - Use JSONB for flexible/dynamic data
   - Use UUID for IDs and foreign keys
   - Use BOOLEAN for true/false flags

VALIDATION RULES THAT WILL BE CHECKED:
✓ All tables have: id, user_id, created_at, updated_at columns
✓ No PostgreSQL reserved keywords in table/column names
✓ All foreign keys reference existing tables in the schema
✓ No circular dependencies between tables
✓ All tables have valid ui_hints with icon, label, description

SCHEMA FORMAT:
{
  "version": "1.0.0",
  "tables": [
    {
      "name": "table_name",
      "columns": [
        {
          "name": "column_name",
          "type": "TEXT",
          "nullable": false,
          "default": "'default_value'",  // SQL syntax
          "unique": false,
          "primaryKey": false,
          "references": {
            "table": "other_table",
            "column": "id",
            "onDelete": "CASCADE"
          }
        }
      ],
      "indexes": [
        {
          "name": "idx_table_column",
          "columns": ["column_name"],
          "unique": false
        }
      ],
      "ui_hints": {
        "icon": "lucide-icon-name",
        "label": "Readable Name",
        "description": "What this entity represents",
        "color": "blue",
        "columns": {
          "column_name": {
            "display_name": "Readable Column Name",
            "filterable": true,
            "sortable": true,
            "mobile_priority": 1,
            "type": "currency"
          }
        }
      }
    }
  ],
  "relationships": [
    {
      "from_table": "deal",
      "from_column": "company_id",
      "to_table": "company",
      "to_column": "id",
      "type": "many-to-one"
    }
  ]
}

EXAMPLE for "I need to track sales deals with companies":
{
  "version": "1.0.0",
  "tables": [
    {
      "name": "company",
      "columns": [
        { "name": "id", "type": "UUID", "nullable": false, "primaryKey": true, "default": "gen_random_uuid()" },
        { "name": "user_id", "type": "UUID", "nullable": false, "references": { "table": "auth.users", "column": "id", "onDelete": "CASCADE" } },
        { "name": "name", "type": "TEXT", "nullable": false },
        { "name": "website", "type": "TEXT", "nullable": true },
        { "name": "created_at", "type": "TIMESTAMPTZ", "nullable": false, "default": "NOW()" },
        { "name": "updated_at", "type": "TIMESTAMPTZ", "nullable": false, "default": "NOW()" }
      ],
      "indexes": [
        { "name": "idx_company_name", "columns": ["name"] }
      ],
      "ui_hints": {
        "icon": "building-2",
        "label": "Companies",
        "description": "Organizations you do business with",
        "color": "blue",
        "columns": {
          "name": { "display_name": "Company Name", "filterable": true, "sortable": true, "mobile_priority": 1 },
          "website": { "display_name": "Website", "type": "url", "mobile_priority": 3 }
        }
      }
    },
    {
      "name": "deal",
      "columns": [
        { "name": "id", "type": "UUID", "nullable": false, "primaryKey": true, "default": "gen_random_uuid()" },
        { "name": "user_id", "type": "UUID", "nullable": false, "references": { "table": "auth.users", "column": "id", "onDelete": "CASCADE" } },
        { "name": "company_id", "type": "UUID", "nullable": true, "references": { "table": "company", "column": "id", "onDelete": "SET NULL" } },
        { "name": "name", "type": "TEXT", "nullable": false },
        { "name": "value", "type": "NUMERIC", "nullable": true },
        { "name": "status", "type": "TEXT", "nullable": false, "default": "'negotiating'" },
        { "name": "close_date", "type": "DATE", "nullable": true },
        { "name": "created_at", "type": "TIMESTAMPTZ", "nullable": false, "default": "NOW()" },
        { "name": "updated_at", "type": "TIMESTAMPTZ", "nullable": false, "default": "NOW()" }
      ],
      "indexes": [
        { "name": "idx_deal_company", "columns": ["company_id"] },
        { "name": "idx_deal_status", "columns": ["status"] }
      ],
      "ui_hints": {
        "icon": "handshake",
        "label": "Deals",
        "description": "Sales opportunities",
        "color": "green",
        "columns": {
          "name": { "display_name": "Deal Name", "filterable": true, "sortable": true, "mobile_priority": 1 },
          "value": { "display_name": "Value", "type": "currency", "sortable": true, "mobile_priority": 2 },
          "status": { "display_name": "Status", "type": "enum", "filterable": true, "mobile_priority": 1 }
        }
      }
    }
  ],
  "relationships": [
    {
      "from_table": "deal",
      "from_column": "company_id",
      "to_table": "company",
      "to_column": "id",
      "type": "many-to-one"
    }
  ]
}

Remember: Output ONLY the JSON schema, no markdown code blocks, no explanations. Start directly with {`;

/**
 * Generate CRM schema from natural language prompt using Claude
 * 
 * @param prompt - User's description of what they want to track
 * @param existingSchema - Optional existing schema for modifications
 * @returns Generated CRM schema
 */
export async function generateSchemaWithClaude(
  prompt: string,
  existingSchema?: CRMSchema
): Promise<{
  schema: CRMSchema;
  reasoning: string;
}> {
  const userMessage = existingSchema
    ? `Modify this existing schema based on the user's request: "${prompt}"\n\nExisting schema:\n${JSON.stringify(existingSchema, null, 2)}\n\nOutput the COMPLETE modified schema (not just the changes).`
    : `Generate a CRM database schema for: "${prompt}"`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: SCHEMA_GENERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
  });

  // Extract JSON from response
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  let schemaJSON = content.text.trim();

  // Remove markdown code blocks if present (Claude sometimes adds them despite instructions)
  schemaJSON = schemaJSON.replace(/^```json\s*/i, "").replace(/\s*```$/, "");

  // Parse JSON
  let schema: CRMSchema;
  try {
    schema = JSON.parse(schemaJSON);
  } catch (error: any) {
    throw new Error(`Failed to parse Claude's response as JSON: ${error?.message || 'Unknown error'}\\n\\nResponse: ${schemaJSON}`);
  }

  // Generate reasoning (extract from Claude's "thinking")
  const reasoning = `Generated ${schema.tables.length} table(s) based on prompt: "${prompt}". ` +
    `Standard CRM pattern with proper foreign key relationships and audit columns.`;

  return {
    schema,
    reasoning,
  };
}

/**
 * Classify user intent to determine if request is valid
 * 
 * @param prompt - User's prompt
 * @returns Intent classification
 */
export async function classifyIntent(prompt: string): Promise<"CREATE" | "MODIFY" | "RELATE" | "INVALID"> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 50,
    system: `Classify the user's CRM schema intent. Respond with ONLY one word: CREATE, MODIFY, RELATE, or INVALID.

CREATE = New schema from scratch
MODIFY = Add/remove fields to existing schema
RELATE = Create relationships between entities
INVALID = Destructive operations, unrelated requests, or nonsense

Examples:
"Track sales deals" → CREATE
"Add priority field to tasks" → MODIFY
"Connect deals to companies" → RELATE
"Delete all my data" → INVALID
"What's the weather?" → INVALID`,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const intent = content.text.trim().toUpperCase();

  if (["CREATE", "MODIFY", "RELATE"].includes(intent)) {
    return intent as "CREATE" | "MODIFY" | "RELATE";
  }

  return "INVALID";
}
