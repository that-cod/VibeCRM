/**
 * @fileoverview Safe SQL generation from validated JSON schemas.
 * 
 * Reasoning:
 * - Never accept raw SQL from users (SQL injection prevention)
 * - Generate parameterized, safe SQL from validated schema objects
 * - Include RLS policies automatically for all user tables
 * 
 * Dependencies:
 * - types/schema for CRM schema types
 */

import type { CRMSchema, TableDefinition, ColumnDefinition, CascadeAction } from "@/types/schema";

/**
 * Sanitize SQL identifier (table/column names) to prevent SQL injection
 * PostgreSQL identifiers must start with letter/underscore and contain only alphanumeric/underscore
 */
function sanitizeIdentifier(identifier: string): string {
    // Remove any characters that aren't alphanumeric or underscore
    const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Ensure it starts with a letter or underscore
    if (!/^[a-zA-Z_]/.test(sanitized)) {
        throw new Error(`Invalid identifier: ${identifier}. Must start with letter or underscore.`);
    }
    
    // Limit length to PostgreSQL's 63 character limit
    if (sanitized.length > 63) {
        throw new Error(`Identifier too long: ${identifier}. Max 63 characters.`);
    }
    
    return sanitized;
}

/**
 * Generate CREATE TABLE statement for a single table
 */
function generateCreateTableSQL(table: TableDefinition): string {
    const tableName = sanitizeIdentifier(table.name);
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;

    // Generate column definitions
    const columnDefs = table.columns.map((col) => {
        const colName = sanitizeIdentifier(col.name);
        let def = `  ${colName} ${col.type}`;

        if (col.primaryKey) {
            def += " PRIMARY KEY";
        }

        if (!col.nullable) {
            def += " NOT NULL";
        }

        if (col.default) {
            def += ` DEFAULT ${col.default}`;
        }

        if (col.unique && !col.primaryKey) {
            def += " UNIQUE";
        }

        return def;
    });

    sql += columnDefs.join(",\n");
    sql += "\n);\n";

    return sql;
}

/**
 * Generate ALTER TABLE statements for foreign keys
 * Separated from CREATE TABLE for clarity and to handle circular dependencies
 */
function generateForeignKeySQL(table: TableDefinition): string {
    const fkStatements: string[] = [];
    const tableName = sanitizeIdentifier(table.name);

    table.columns.forEach((col) => {
        if (col.references) {
            const colName = sanitizeIdentifier(col.name);
            const refTable = sanitizeIdentifier(col.references.table);
            const refCol = sanitizeIdentifier(col.references.column);
            const constraintName = sanitizeIdentifier(`fk_${table.name}_${col.name}`);
            fkStatements.push(`
ALTER TABLE ${tableName}
  ADD CONSTRAINT ${constraintName}
  FOREIGN KEY (${colName})
  REFERENCES ${refTable}(${refCol})
  ON DELETE ${col.references.onDelete};
      `);
        }
    });

    return fkStatements.join("\n");
}

/**
 * Generate CREATE INDEX statements for a table
 */
function generateIndexSQL(table: TableDefinition): string {
    if (!table.indexes || table.indexes.length === 0) {
        return "";
    }

    const tableName = sanitizeIdentifier(table.name);
    return table.indexes
        .map((index) => {
            const sanitizedCols = index.columns.map(c => sanitizeIdentifier(c));
            const indexName = sanitizeIdentifier(`idx_${table.name}_${index.columns.join("_")}`);
            const unique = index.unique ? "UNIQUE " : "";
            return `CREATE ${unique}INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${sanitizedCols.join(", ")});`;
        })
        .join("\n");
}

/**
 * Generate RLS policy for a user table
 * All user-generated tables must have RLS to enforce data isolation
 */
function generateRLSPolicySQL(tableName: string): string {
    const sanitizedTable = sanitizeIdentifier(tableName);
    return `
-- Enable RLS on ${sanitizedTable}
ALTER TABLE ${sanitizedTable} ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user isolation
CREATE POLICY user_isolation ON ${sanitizedTable}
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
  `;
}

/**
 * Generate trigger for auto-updating updated_at timestamp
 */
function generateUpdatedAtTriggerSQL(tableName: string): string {
    const sanitizedTable = sanitizeIdentifier(tableName);
    const triggerName = sanitizeIdentifier(`${tableName}_updated_at`);
    return `
-- Create trigger for ${sanitizedTable}.updated_at
CREATE TRIGGER ${triggerName}
  BEFORE UPDATE ON ${sanitizedTable}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  `;
}

/**
 * Generate complete SQL for provisioning a CRM schema
 * CRITICAL: This is the ONLY way SQL is generated - no raw SQL accepted
 * 
 * @param schema - Validated CRM schema object
 * @returns Safe SQL string ready for execution
 */
export function generateProvisioningSQL(schema: CRMSchema): string {
    let sql = `-- VibeCRM Generated Schema v${schema.version}\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- DO NOT MANUALLY EDIT\n\n`;

    sql += `BEGIN;\n\n`;

    // Create the update_updated_at function if it doesn't exist
    sql += `
-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\n\n`;

    // 1. Create all tables
    sql += `-- Create tables\n`;
    schema.tables.forEach((table) => {
        sql += generateCreateTableSQL(table);
        sql += "\n";
    });

    // 2. Add foreign keys
    sql += `\n-- Add foreign key constraints\n`;
    schema.tables.forEach((table) => {
        const fkSQL = generateForeignKeySQL(table);
        if (fkSQL) {
            sql += fkSQL;
            sql += "\n";
        }
    });

    // 3. Create indexes
    sql += `\n-- Create indexes\n`;
    schema.tables.forEach((table) => {
        const idxSQL = generateIndexSQL(table);
        if (idxSQL) {
            sql += idxSQL;
            sql += "\n";
        }

        // Always index user_id for RLS performance
        sql += `CREATE INDEX IF NOT EXISTS idx_${table.name}_user_id ON ${table.name}(user_id);\n`;
    });

    // 4. Enable RLS and create policies
    sql += `\n-- Enable RLS and create policies\n`;
    schema.tables.forEach((table) => {
        sql += generateRLSPolicySQL(table.name);
        sql += "\n";
    });

    // 5. Create updated_at triggers
    sql += `\n-- Create updated_at triggers\n`;
    schema.tables.forEach((table) => {
        sql += generateUpdatedAtTriggerSQL(table.name);
        sql += "\n";
    });

    sql += `COMMIT;\n`;

    return sql;
}

/**
 * Generate SQL for adding a new column (schema evolution)
 */
export function generateAddColumnSQL(
    tableName: string,
    column: ColumnDefinition
): string {
    let sql = `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${column.type}`;

    if (!column.nullable) {
        if (column.default) {
            sql += ` NOT NULL DEFAULT ${column.default}`;
        } else {
            throw new Error(
                `Cannot add non-nullable column '${column.name}' without a default value`
            );
        }
    } else if (column.default) {
        sql += ` DEFAULT ${column.default}`;
    }

    sql += ";";
    return sql;
}

/**
 * Generate SQL for dropping a column (destructive operation)
 */
export function generateDropColumnSQL(tableName: string, columnName: string): string {
    return `ALTER TABLE ${tableName} DROP COLUMN ${columnName};`;
}

/**
 * Generate SQL for dropping a table (destructive operation)
 */
export function generateDropTableSQL(tableName: string): string {
    return `DROP TABLE IF EXISTS ${tableName} CASCADE;`;
}
