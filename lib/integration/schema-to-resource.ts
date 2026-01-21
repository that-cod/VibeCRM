/**
 * @fileoverview Convert CRMSchema to Resource format for dynamic UI system
 * 
 * Reasoning:
 * - Bridges schema generator and dynamic resource system
 * - Converts TableDefinition to Resource format
 * - Enables automatic UI generation from provisioned schemas
 * 
 * Dependencies:
 * - types/schema for CRMSchema
 * - lib/code-generator/schemas for Resource type
 */

import type { CRMSchema, TableDefinition, ColumnDefinition, PostgresType } from "@/types/schema";
import type { Resource, Field, Relationship } from "@/lib/code-generator/schemas";

/**
 * Map PostgreSQL types to Field types
 */
function mapPostgresTypeToFieldType(pgType: PostgresType): Field["type"] {
  const typeMap: Partial<Record<PostgresType, Field["type"]>> = {
    "TEXT": "text",
    "VARCHAR": "text",
    "INTEGER": "number",
    "BIGINT": "number",
    "NUMERIC": "currency",
    "BOOLEAN": "boolean",
    "DATE": "date",
    "TIMESTAMP": "date",
    "TIMESTAMPTZ": "date",
    "UUID": "text",
    "JSONB": "textarea",
  };

  return typeMap[pgType] || "text";
}

/**
 * Convert ColumnDefinition to Field
 */
function convertColumnToField(column: ColumnDefinition): Field {
  // Skip audit columns - they're handled automatically
  const auditColumns = ["id", "user_id", "created_at", "updated_at"];
  
  const fieldType = mapPostgresTypeToFieldType(column.type);
  
  return {
    name: column.name,
    type: fieldType,
    required: !column.nullable,
    display_name: column.name
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
    filterable: true,
    sortable: true,
  };
}

/**
 * Convert TableDefinition to Resource
 */
export function convertTableToResource(table: TableDefinition): Resource {
  // Generate plural name (simple pluralization)
  const pluralName = table.name.endsWith("s") 
    ? table.name 
    : `${table.name}s`;

  // Generate labels
  const singularLabel = table.ui_hints?.label || 
    table.name
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const pluralLabel = `${singularLabel}s`;

  // Convert columns to fields (excluding audit columns)
  const auditColumns = ["id", "user_id", "created_at", "updated_at"];
  const fields = table.columns
    .filter(col => !auditColumns.includes(col.name))
    .map(convertColumnToField);

  // Extract relationships from foreign key columns
  const relationships: Relationship[] = table.columns
    .filter(col => col.references)
    .map(col => ({
      name: col.name.replace(/_id$/, ""),
      type: "belongsTo" as const,
      related_resource: col.references!.table,
      foreign_key_column: col.name,
    }));

  // Determine icon and color from UI hints
  const icon = table.ui_hints?.icon || "Database";
  const color = table.ui_hints?.color || "blue";

  return {
    name: table.name,
    plural_name: pluralName,
    singular_label: singularLabel,
    plural_label: pluralLabel,
    icon,
    description: table.ui_hints?.description || `Manage ${pluralLabel.toLowerCase()}`,
    color,
    fields,
    relationships: relationships.length > 0 ? relationships : undefined,
    route: `/${pluralName}`,
  };
}

/**
 * Convert entire CRMSchema to array of Resources
 */
export function convertSchemaToResources(schema: CRMSchema): Resource[] {
  return schema.tables.map(convertTableToResource);
}

/**
 * Convert CRMSchema to ProjectPlan format (for code generation)
 */
export function convertSchemaToProjectPlan(schema: CRMSchema) {
  return {
    name: "Generated CRM",
    description: "AI-generated CRM schema",
    version: schema.version,
    resources: convertSchemaToResources(schema),
    theme: {
      primary_color: "blue",
      accent_color: "green",
    },
  };
}
