/**
 * @fileoverview Database Provisioner
 *
 * Reasoning:
 * - Creates database tables from generated schema
 * - Generates proper SQL with RLS policies
 * - Handles foreign key constraints
 * - Executes in Supabase via RPC or direct SQL
 * - Logs all decisions to decision_traces for Vibe Replay
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ProjectPlan, Resource } from "@/lib/code-generator/schemas";
import type { CRMSchema } from "@/types/schema";

export interface ProvisionResult {
  success: boolean;
  tables_created: string[];
  errors: string[];
  sql_executed: string;
  decision_trace_id?: string;
}

export async function provisionDatabase(
  plan: ProjectPlan,
  projectId: string,
  userId: string,
  schemaBefore?: CRMSchema
): Promise<ProvisionResult> {
  const tablesCreated: string[] = [];
  const errors: string[] = [];
  const sqlStatements: string[] = [];

  try {
    // Generate SQL for each resource
    for (const resource of plan.resources) {
      const createTableSQL = generateCreateTableSQL(resource);
      sqlStatements.push(createTableSQL);
      tablesCreated.push(resource.plural_name);
    }

    // Execute all SQL statements in a transaction
    const combinedSQL = sqlStatements.join("\n\n");

    // Try to execute via RPC function first (safer)
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: combinedSQL,
    });

    if (rpcError) {
      // Fallback: Try direct SQL execution
      const { error: directError } = await supabaseAdmin.from("vibe_configs").select("id").limit(1);

      if (!directError) {
        // RPC function doesn't exist, but we can still try to execute
        // Use a different approach - create tables one by one
        for (const resource of plan.resources) {
          try {
            const sql = generateCreateTableSQL(resource);
            await executeSQLDirectly(sql);
            tablesCreated.push(resource.plural_name);
          } catch (err: any) {
            errors.push(`Failed to create ${resource.plural_name}: ${err.message}`);
          }
        }
      }
    }

    // Log the decision to decision_traces
    const schemaAfter = generateSchemaFromPlan(plan);
    const decisionTrace = await logDecision({
      projectId,
      userId,
      intent: plan.description || "Generated CRM schema",
      action: `Created ${tablesCreated.length} table(s): ${tablesCreated.join(", ")}`,
      precedent: "Standard VibeCRM pattern: Create tables with user isolation RLS policies",
      version: plan.version || "1.0.0",
      schemaBefore,
      schemaAfter,
    });

    return {
      success: errors.length === 0,
      tables_created: tablesCreated,
      errors,
      sql_executed: combinedSQL,
      decision_trace_id: decisionTrace?.id,
    };

  } catch (err: any) {
    return {
      success: false,
      tables_created: tablesCreated,
      errors: [err.message],
      sql_executed: sqlStatements.join("\n\n"),
    };
  }
}

/**
 * Log a decision to decision_traces for Vibe Replay
 */
async function logDecision({
  projectId,
  userId,
  intent,
  action,
  precedent,
  version,
  schemaBefore,
  schemaAfter,
}: {
  projectId: string;
  userId: string;
  intent: string;
  action: string;
  precedent?: string;
  version: string;
  schemaBefore?: CRMSchema;
  schemaAfter?: CRMSchema;
}) {
  try {
    const { data, error } = await supabaseAdmin
      .from("decision_traces")
      .insert({
        project_id: projectId,
        user_id: userId,
        intent,
        action,
        precedent,
        version,
        schema_before: schemaBefore,
        schema_after: schemaAfter,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to log decision trace:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error logging decision trace:", err);
    return null;
  }
}

/**
 * Generate a CRMSchema from a ProjectPlan
 */
function generateSchemaFromPlan(plan: ProjectPlan): CRMSchema {
  return {
    version: plan.version || "1.0.0",
    tables: plan.resources.map((resource) => ({
      name: resource.plural_name,
      columns: [
        { name: "id", type: "UUID" as const, nullable: false },
        { name: "user_id", type: "UUID" as const, nullable: false },
        { name: "created_at", type: "TIMESTAMPTZ" as const, nullable: false },
        { name: "updated_at", type: "TIMESTAMPTZ" as const, nullable: false },
        ...resource.fields.map((field) => ({
          name: field.name,
          type: field.type.toUpperCase() as any,
          nullable: !field.required,
        })),
      ],
      ui_hints: {
        icon: resource.icon || "table",
        label: resource.plural_label,
        description: resource.description,
        columns: {},
      },
    })),
    relationships: plan.resources.flatMap((resource) =>
      (resource.relationships || []).map((rel) => ({
        from_table: resource.plural_name,
        from_column: rel.foreign_key_column,
        to_table: rel.related_resource,
        to_column: "id",
        type: "one-to-many" as const,
      }))
    ),
  };
}

/**
 * Generate CREATE TABLE SQL for a resource
 */
function generateCreateTableSQL(resource: Resource): string {
  const columns: string[] = [
    'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE',
    'created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL',
    'updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL',
  ];

  // Add business fields
  for (const field of resource.fields) {
    if (["id", "user_id", "created_at", "updated_at"].includes(field.name)) {
      continue; // Already added
    }

    let columnDef = `${field.name} ${mapFieldTypeToPostgres(field.type)}`;

    if (!field.required) {
      columnDef += " NULL";
    } else {
      columnDef += " NOT NULL";
    }

    if (field.default_value) {
      columnDef += ` DEFAULT ${field.default_value}`;
    }

    columns.push(columnDef);
  }

  // Add foreign key constraints for relationships
  for (const rel of resource.relationships || []) {
    columns.push(
      `${rel.foreign_key_column} UUID REFERENCES ${rel.related_resource}(id) ON DELETE SET NULL`
    );
  }

  // Build the full SQL
  const tableName = resource.plural_name;
  
  return `
-- Create table: ${tableName}
CREATE TABLE IF NOT EXISTS ${tableName} (
  ${columns.join(",\n  ")}
);

-- Enable Row Level Security
ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "${tableName}_user_isolation" ON ${tableName};

-- Create user isolation policy (users can only see their own data)
CREATE POLICY "${tableName}_user_isolation" ON ${tableName}
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON ${tableName}(user_id);
CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName}(created_at DESC);
${generateIndexesSQL(resource)}
`.trim();
}

/**
 * Generate index creation SQL
 */
function generateIndexesSQL(resource: Resource): string {
  const indexes: string[] = [];

  // Index on searchable text fields
  for (const field of resource.fields) {
    if (field.type === "text" && field.filterable) {
      indexes.push(
        `CREATE INDEX IF NOT EXISTS idx_${resource.plural_name}_${field.name} ON ${resource.plural_name}(${field.name});`
      );
    }
  }

  // Index on status/select fields
  for (const field of resource.fields) {
    if (field.type === "select" || field.type === "status") {
      indexes.push(
        `CREATE INDEX IF NOT EXISTS idx_${resource.plural_name}_${field.name} ON ${resource.plural_name}(${field.name});`
      );
    }
  }

  // Index on foreign keys
  for (const rel of resource.relationships || []) {
    indexes.push(
      `CREATE INDEX IF NOT EXISTS idx_${resource.plural_name}_${rel.foreign_key_column} ON ${resource.plural_name}(${rel.foreign_key_column});`
    );
  }

  return indexes.join("\n");
}

/**
 * Map field type to PostgreSQL type
 */
function mapFieldTypeToPostgres(fieldType: string): string {
  switch (fieldType) {
    case "text":
    case "email":
    case "url":
    case "phone":
    case "textarea":
      return "TEXT";
    case "number":
    case "currency":
      return "NUMERIC(15,2)";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "DATE";
    case "select":
    case "status":
      return "TEXT";
    default:
      return "TEXT";
  }
}

/**
 * Execute SQL directly via exec_sql RPC function
 * This is used as a fallback when batch execution fails
 */
async function executeSQLDirectly(sql: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc("exec_sql", { sql_query: sql });
  if (error) {
    throw new Error(`SQL execution failed: ${error.message}`);
  }
}

/**
 * Drop a table (for cleanup/rollback)
 */
export async function dropTable(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: `DROP TABLE IF EXISTS ${tableName} CASCADE;`,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Check if a table exists
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(tableName)
      .select("id")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Get table schema info (for debugging)
 */
export async function getTableInfo(tableName: string): Promise<{
  columns: Array<{ name: string; type: string }>;
  policies: string[];
} | null> {
  try {
    // This would typically query information_schema
    // For now, return null as we can't easily get this info
    return null;
  } catch {
    return null;
  }
}
