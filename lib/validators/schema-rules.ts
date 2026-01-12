/**
 * @fileoverview Schema validation functions for pre/post-generation checks.
 * 
 * Reasoning:
 * - Prevents AI hallucinations by validating generated schemas
 * - Enforces PostgreSQL constraints and best practices
 * - Detects circular dependencies and integrity issues
 * 
 * Dependencies:
 * - types/schema for type definitions
 */

import type { CRMSchema, ValidationResult } from "@/types/schema";

/**
 * PostgreSQL reserved keywords that cannot be used as table/column names
 */
const POSTGRES_RESERVED = [
    "user",
    "order",
    "table",
    "column",
    "index",
    "constraint",
    "grant",
    "select",
    "insert",
    "update",
    "delete",
    "where",
    "from",
    "join",
    "group",
    "having",
    "limit",
    "offset",
    "union",
    "intersect",
    "except",
    "alter",
    "drop",
    "create",
    "truncate",
    "replace",
];

/**
 * Check for PostgreSQL reserved keywords in table/column names
 */
export function validateNoReservedWords(schema: CRMSchema): ValidationResult {
    const violations: string[] = [];

    schema.tables.forEach((table) => {
        if (POSTGRES_RESERVED.includes(table.name.toLowerCase())) {
            violations.push(`Table name '${table.name}' is a PostgreSQL reserved word`);
        }

        table.columns.forEach((col) => {
            if (POSTGRES_RESERVED.includes(col.name.toLowerCase())) {
                violations.push(`Column '${table.name}.${col.name}' uses a PostgreSQL reserved word`);
            }
        });
    });

    return violations.length > 0 ? { passed: false, errors: violations } : { passed: true };
}

/**
 * Validate all foreign keys reference existing tables
 * Allows references to auth.users (Supabase auth table)
 */
export function validateForeignKeys(schema: CRMSchema): ValidationResult {
    const tableNames = new Set(schema.tables.map((t) => t.name));
    const errors: string[] = [];

    // Add allowed external tables (Supabase auth)
    const allowedExternalTables = new Set(["auth.users"]);

    schema.tables.forEach((table) => {
        table.columns.forEach((col) => {
            if (col.references) {
                const refTable = col.references.table;
                // Check if it's in the schema OR an allowed external table
                if (!tableNames.has(refTable) && !allowedExternalTables.has(refTable)) {
                    errors.push(
                        `${table.name}.${col.name} references non-existent table '${refTable}'`
                    );
                }
            }
        });
    });

    return errors.length > 0 ? { passed: false, errors } : { passed: true };
}

/**
 * Detect circular dependencies in table relationships
 * Uses DFS to find cycles in the dependency graph
 */
export function detectCircularDependencies(schema: CRMSchema): ValidationResult {
    // Build dependency graph
    const graph = new Map<string, Set<string>>();

    schema.tables.forEach((table) => {
        const deps = new Set<string>();
        table.columns.forEach((col) => {
            if (col.references) {
                deps.add(col.references.table);
            }
        });
        graph.set(table.name, deps);
    });

    // DFS cycle detection
    function hasCycle(node: string, visited: Set<string>, stack: Set<string>): boolean {
        visited.add(node);
        stack.add(node);

        for (const neighbor of graph.get(node) || []) {
            if (!visited.has(neighbor)) {
                if (hasCycle(neighbor, visited, stack)) return true;
            } else if (stack.has(neighbor)) {
                return true; // Back edge found = cycle
            }
        }

        stack.delete(node);
        return false;
    }

    const visited = new Set<string>();
    for (const table of graph.keys()) {
        if (!visited.has(table)) {
            if (hasCycle(table, visited, new Set())) {
                return {
                    passed: false,
                    errors: [`Circular dependency detected involving table '${table}'`],
                };
            }
        }
    }

    return { passed: true };
}

/**
 * Validate that all tables include mandatory audit columns
 * Required: user_id, created_at, updated_at
 */
export function validateAuditColumns(schema: CRMSchema): ValidationResult {
    const errors: string[] = [];

    schema.tables.forEach((table) => {
        const columnNames = table.columns.map((c) => c.name);

        if (!columnNames.includes("user_id")) {
            errors.push(`${table.name} missing 'user_id' audit column`);
        }
        if (!columnNames.includes("created_at")) {
            errors.push(`${table.name} missing 'created_at' audit column`);
        }
        if (!columnNames.includes("updated_at")) {
            errors.push(`${table.name} missing 'updated_at' audit column`);
        }
    });

    return errors.length > 0 ? { passed: false, errors } : { passed: true };
}

/**
 * Run all validation checks on a schema
 * Returns aggregate result with all errors
 */
export function validateAllSchemaRules(schema: CRMSchema): ValidationResult {
    const checks = [
        validateNoReservedWords(schema),
        validateForeignKeys(schema),
        detectCircularDependencies(schema),
        validateAuditColumns(schema),
    ];

    const allErrors = checks
        .filter((check) => !check.passed)
        .flatMap((check) => check.errors || []);

    if (allErrors.length > 0) {
        return {
            passed: false,
            errors: allErrors,
        };
    }

    return { passed: true };
}
