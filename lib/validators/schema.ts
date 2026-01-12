/**
 * @fileoverview Zod validators for CRM schema validation.
 * 
 * Reasoning:
 * - Runtime validation ensures AI-generated schemas are safe
 * - Prevents SQL injection and malformed data
 * - Enforces architectural constraints (max tables, columns, etc.)
 * 
 * Dependencies:
 * - zod for runtime schema validation
 */

import { z } from "zod";

/**
 * PostgreSQL type validator
 */
export const PostgresTypeSchema = z.enum([
    "UUID",
    "TEXT",
    "VARCHAR",
    "INTEGER",
    "BIGINT",
    "BOOLEAN",
    "TIMESTAMP",
    "TIMESTAMPTZ",
    "DATE",
    "NUMERIC",
    "JSONB",
    "TEXT[]",
    "INTEGER[]",
    "UUID[]",
]);

/**
 * Cascade action validator
 */
export const CascadeActionSchema = z.enum(["CASCADE", "RESTRICT", "SET NULL", "NO ACTION"]);

/**
 * Column definition validator
 */
export const ColumnDefinitionSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(63) // PostgreSQL identifier limit
        .regex(/^[a-z][a-z0-9_]*$/, "Column name must be snake_case starting with a letter"),
    type: PostgresTypeSchema,
    nullable: z.boolean(),
    default: z.string().optional(),
    unique: z.boolean().optional(),
    primaryKey: z.boolean().optional(),
    references: z
        .object({
            table: z.string().min(1),
            column: z.string().min(1),
            onDelete: CascadeActionSchema,
        })
        .optional(),
});

/**
 * Index definition validator
 */
export const IndexDefinitionSchema = z.object({
    name: z.string().min(1).max(63),
    columns: z.array(z.string()).min(1),
    unique: z.boolean().optional(),
});

/**
 * UI hints validator
 */
export const UIHintsSchema = z.object({
    icon: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    color: z.string().optional(),
    columns: z.record(
        z.string(),  // Key schema
        z.object({
            display_name: z.string().min(1),
            filterable: z.boolean().optional(),
            sortable: z.boolean().optional(),
            mobile_priority: z.number().int().min(1).max(4).optional(),
            type: z.enum(["currency", "url", "email", "phone", "textarea", "enum"]).optional(),
        })
    ),
});

/**
 * Table definition validator
 * Enforces max 50 columns per table
 */
export const TableDefinitionSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(63)
        .regex(/^[a-z][a-z0-9_]*$/, "Table name must be snake_case starting with a letter"),
    columns: z
        .array(ColumnDefinitionSchema)
        .min(1, "Table must have at least one column")
        .max(50, "Table cannot have more than 50 columns"),
    indexes: z.array(IndexDefinitionSchema).optional(),
    ui_hints: UIHintsSchema,
});

/**
 * Relationship validator
 */
export const RelationshipSchema = z.object({
    from_table: z.string().min(1),
    from_column: z.string().min(1),
    to_table: z.string().min(1),
    to_column: z.string().min(1),
    type: z.enum(["one-to-one", "one-to-many", "many-to-one", "many-to-many"]),
});

/**
 * Complete CRM schema validator
 * Enforces max 15 tables per project (free tier limit)
 */
export const CRMSchemaValidator = z.object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be semver format (e.g., 1.0.0)"),
    tables: z
        .array(TableDefinitionSchema)
        .min(1, "Schema must have at least one table")
        .max(15, "Schema cannot have more than 15 tables (free tier limit)"),
    relationships: z.array(RelationshipSchema),
});

/**
 * Generate schema request validator
 */
export const GenerateSchemaRequestSchema = z.object({
    prompt: z.string().min(10, "Prompt must be at least 10 characters").max(1000, "Prompt too long"),
    project_id: z.string().uuid().optional(), // For schema modifications
});

/**
 * Provision schema request validator
 */
export const ProvisionSchemaRequestSchema = z.object({
    schema_json: CRMSchemaValidator,
    project_id: z.string().uuid(),
    confirmation_token: z.string().optional(), // For destructive operations
});

/**
 * Create project request validator
 */
export const CreateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
    description: z.string().max(500, "Description too long").optional(),
});

/**
 * Update project request validator
 */
export const UpdateProjectSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
});

/**
 * Acquire schema lock request validator
 */
export const AcquireLockSchema = z.object({
    duration_minutes: z.number().int().min(1, "Duration must be at least 1 minute").max(10, "Duration cannot exceed 10 minutes").optional().default(5),
});
