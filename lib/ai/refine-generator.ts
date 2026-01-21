/**
 * @fileoverview AI-powered schema refinement generator
 * 
 * Phase 2: Chat-Based Iteration
 * Generates delta changes to schemas based on user requests
 */

import { anthropic } from "./claude";
import type { CRMSchema } from "@/types/schema";
import type { RefineIntent, SchemaChanges, ChatMessage } from "@/lib/chat/types";

/**
 * Classify the intent of a refinement request
 */
export async function classifyRefineIntent(
  message: string,
  currentSchema: CRMSchema
): Promise<RefineIntent> {
  const prompt = `
You are analyzing a user's request to modify a CRM schema.

Current schema has these tables: ${currentSchema.tables.map(t => t.name).join(", ")}

User request: "${message}"

Classify the intent into ONE of these categories:
- ADD_TABLE: User wants to add a new table
- MODIFY_TABLE: User wants to modify an existing table
- DELETE_TABLE: User wants to remove a table
- ADD_COLUMN: User wants to add a column to a table
- MODIFY_COLUMN: User wants to modify a column
- DELETE_COLUMN: User wants to remove a column
- ADD_RELATIONSHIP: User wants to add a relationship between tables
- MODIFY_UI: User wants to change UI/styling (colors, labels, etc.)
- ADD_FEATURE: User wants to add a feature (dark mode, search, etc.)
- FIX_ERROR: User is reporting an error or issue
- CLARIFY: User is asking a question or needs clarification
- OTHER: None of the above

Respond with ONLY the category name, nothing else.
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    messages: [{ role: "user", content: prompt }],
  });

  const intent = response.content[0].type === "text"
    ? response.content[0].text.trim() as RefineIntent
    : "OTHER";

  return intent;
}

/**
 * Generate schema changes based on user request
 */
export async function generateSchemaRefinement(
  message: string,
  currentSchema: CRMSchema,
  conversationHistory: ChatMessage[]
): Promise<{
  intent: RefineIntent;
  reasoning: string;
  changes: SchemaChanges[];
  updatedSchema: CRMSchema;
  responseMessage: string;
}> {
  // First, classify intent
  const intent = await classifyRefineIntent(message, currentSchema);

  // Build context from conversation history
  const historyContext = conversationHistory
    .slice(-5)
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Generate changes
  const prompt = `
You are an AI assistant helping to refine a CRM schema based on user requests.

CURRENT SCHEMA:
${JSON.stringify(currentSchema, null, 2)}

CONVERSATION HISTORY:
${historyContext}

USER REQUEST: "${message}"
INTENT: ${intent}

Your task:
1. Understand what the user wants to change
2. Generate ONLY the delta changes needed (not the full schema)
3. Ensure changes are valid and maintain data integrity
4. Provide a friendly response message

IMPORTANT RULES:
- Always include audit columns: id, user_id, created_at, updated_at
- Use proper PostgreSQL types: TEXT, VARCHAR, INTEGER, BIGINT, NUMERIC, BOOLEAN, DATE, TIMESTAMP, TIMESTAMPTZ, UUID, JSONB
- Maintain foreign key relationships
- Keep existing data structure unless explicitly asked to change
- For UI changes (colors, labels), only modify ui_hints

Respond in this JSON format:
{
  "reasoning": "Brief explanation of what you're doing",
  "changes": [
    {
      "type": "add|modify|delete",
      "target": "table|column|relationship|ui_hints",
      "tableName": "table_name",
      "columnName": "column_name (if applicable)",
      "changes": { /* the actual changes */ }
    }
  ],
  "updatedSchema": { /* the complete updated schema */ },
  "message": "Friendly response to user about what was changed"
}

Generate the response now:
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.content[0].type === "text"
    ? response.content[0].text
    : "";

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response");
  }

  const result = JSON.parse(jsonMatch[0]);

  return {
    intent,
    reasoning: result.reasoning,
    changes: result.changes || [],
    updatedSchema: result.updatedSchema,
    responseMessage: result.message,
  };
}

/**
 * Apply schema changes (helper function)
 */
export function applySchemaChanges(
  schema: CRMSchema,
  changes: SchemaChanges[]
): CRMSchema {
  let updatedSchema = JSON.parse(JSON.stringify(schema)); // Deep clone

  changes.forEach(change => {
    switch (change.target) {
      case "table":
        if (change.type === "add") {
          updatedSchema.tables.push(change.changes);
        } else if (change.type === "modify") {
          const tableIndex = updatedSchema.tables.findIndex(
            (t: any) => t.name === change.tableName
          );
          if (tableIndex !== -1) {
            updatedSchema.tables[tableIndex] = {
              ...updatedSchema.tables[tableIndex],
              ...change.changes,
            };
          }
        } else if (change.type === "delete") {
          updatedSchema.tables = updatedSchema.tables.filter(
            (t: any) => t.name !== change.tableName
          );
        }
        break;

      case "column":
        const table = updatedSchema.tables.find(
          (t: any) => t.name === change.tableName
        );
        if (table) {
          if (change.type === "add") {
            table.columns.push(change.changes);
          } else if (change.type === "modify") {
            const colIndex = table.columns.findIndex(
              (c: any) => c.name === change.columnName
            );
            if (colIndex !== -1) {
              table.columns[colIndex] = {
                ...table.columns[colIndex],
                ...change.changes,
              };
            }
          } else if (change.type === "delete") {
            table.columns = table.columns.filter(
              (c: any) => c.name !== change.columnName
            );
          }
        }
        break;

      case "ui_hints":
        const uiTable = updatedSchema.tables.find(
          (t: any) => t.name === change.tableName
        );
        if (uiTable) {
          uiTable.ui_hints = {
            ...uiTable.ui_hints,
            ...change.changes,
          };
        }
        break;

      case "relationship":
        if (change.type === "add") {
          if (!updatedSchema.relationships) {
            updatedSchema.relationships = [];
          }
          updatedSchema.relationships.push(change.changes);
        }
        break;
    }
  });

  return updatedSchema;
}
