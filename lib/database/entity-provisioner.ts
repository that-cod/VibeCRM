/**
 * Entity Provisioner
 * Creates dynamic tables for workspace entities with RLS policies
 */

import type { EntityConfig, FieldConfig, WorkspaceConfig, PostgresFieldType } from '@/types/crm-config';
import { executeDynamicSQL } from './supabase-admin';

/**
 * Map CRM field types to PostgreSQL types
 */
function mapFieldTypeToPostgres(fieldType: string): PostgresFieldType {
    const mapping: Record<string, PostgresFieldType> = {
        'text': 'TEXT',
        'email': 'TEXT',
        'phone': 'TEXT',
        'url': 'TEXT',
        'textarea': 'TEXT',
        'number': 'INTEGER',
        'currency': 'NUMERIC',
        'date': 'DATE',
        'datetime': 'TIMESTAMPTZ',
        'checkbox': 'BOOLEAN',
        'select': 'TEXT',
        'multiselect': 'TEXT[]',
        'relation': 'UUID',
        'file': 'TEXT', // Store file URL
        'user': 'UUID',
    };

    return mapping[fieldType] || 'TEXT';
}

/**
 * Generate CREATE TABLE SQL for an entity
 */
export function generateCreateTableSQL(
    workspaceId: string,
    entitySlug: string,
    entityConfig: EntityConfig
): string {
    // Replace hyphens with underscores for valid PostgreSQL table names
    const safeWorkspaceId = workspaceId.replace(/-/g, '_');
    const safeEntitySlug = entitySlug.replace(/-/g, '_');
    const tableName = `workspace_${safeWorkspaceId}_${safeEntitySlug}`;

    const columns: string[] = [
        // Standard columns
        'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
        'workspace_id UUID NOT NULL',
        'created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL',
        'updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL',
        'created_by UUID REFERENCES auth.users(id)',
    ];

    // Add custom fields from config
    for (const field of entityConfig.fields) {
        // Skip ID field as it's already added
        if (field.name === 'id') continue;

        const postgresType = field.postgresType || mapFieldTypeToPostgres(field.type);
        let columnDef = `${field.name} ${postgresType}`;

        // Add constraints
        if (field.required) {
            columnDef += ' NOT NULL';
        }

        if (field.unique) {
            columnDef += ' UNIQUE';
        }

        if (field.defaultValue !== undefined && field.defaultValue !== null) {
            // Properly format default values based on type
            if (typeof field.defaultValue === 'string') {
                columnDef += ` DEFAULT '${field.defaultValue.replace(/'/g, "''")}'`;
            } else if (typeof field.defaultValue === 'boolean') {
                columnDef += ` DEFAULT ${field.defaultValue}`;
            } else if (typeof field.defaultValue === 'number') {
                columnDef += ` DEFAULT ${field.defaultValue}`;
            }
            // Skip complex objects/arrays as defaults
        }

        columns.push(columnDef);
    }

    const sql = `
CREATE TABLE public.${tableName} (
  ${columns.join(',\n  ')}
);
`.trim();

    return sql;
}

/**
 * Generate RLS policy SQL for workspace entity table
 */
export function generateRLSPolicySQL(
    workspaceId: string,
    entitySlug: string
): string[] {
    // Replace hyphens with underscores for valid PostgreSQL identifiers
    const safeWorkspaceId = workspaceId.replace(/-/g, '_');
    const safeEntitySlug = entitySlug.replace(/-/g, '_');
    const tableName = `workspace_${safeWorkspaceId}_${safeEntitySlug}`;

    return [
        // Enable RLS
        `ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;`,

        // SELECT policy: users who are workspace members can read
        `
CREATE POLICY ${tableName}_select_policy ON public.${tableName}
  FOR SELECT TO authenticated
  USING (
    workspace_id = '${workspaceId}'::uuid AND
    public.can_access_workspace('${workspaceId}'::uuid, auth.uid())
  );
    `.trim(),

        // INSERT policy: workspace members can insert
        `
CREATE POLICY ${tableName}_insert_policy ON public.${tableName}
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id = '${workspaceId}'::uuid AND
    public.can_access_workspace('${workspaceId}'::uuid, auth.uid())
  );
    `.trim(),

        // UPDATE policy: workspace members can update
        `
CREATE POLICY ${tableName}_update_policy ON public.${tableName}
  FOR UPDATE TO authenticated
  USING (
    workspace_id = '${workspaceId}'::uuid AND
    public.can_access_workspace('${workspaceId}'::uuid, auth.uid())
  )
  WITH CHECK (
    workspace_id = '${workspaceId}'::uuid AND
    public.can_access_workspace('${workspaceId}'::uuid, auth.uid())
  );
    `.trim(),

        // DELETE policy: workspace members can delete
        `
CREATE POLICY ${tableName}_delete_policy ON public.${tableName}
  FOR DELETE TO authenticated
  USING (
    workspace_id = '${workspaceId}'::uuid AND
    public.can_access_workspace('${workspaceId}'::uuid, auth.uid())
  );
    `.trim(),
    ];
}

/**
 * Generate index SQL for better query performance
 */
export function generateIndexSQL(
    workspaceId: string,
    entitySlug: string,
    entityConfig: EntityConfig
): string[] {
    // Replace hyphens with underscores for valid PostgreSQL identifiers
    const safeWorkspaceId = workspaceId.replace(/-/g, '_');
    const safeEntitySlug = entitySlug.replace(/-/g, '_');
    const tableName = `workspace_${safeWorkspaceId}_${safeEntitySlug}`;
    const indexes: string[] = [];

    // Always index workspace_id for RLS performance
    indexes.push(
        `CREATE INDEX ${tableName}_workspace_id_idx ON public.${tableName}(workspace_id);`
    );

    // Index created_at for sorting
    indexes.push(
        `CREATE INDEX ${tableName}_created_at_idx ON public.${tableName}(created_at DESC);`
    );

    // Index sortable and filterable fields
    for (const field of entityConfig.fields) {
        if (field.sortable || field.filterable) {
            indexes.push(
                `CREATE INDEX ${tableName}_${field.name}_idx ON public.${tableName}(${field.name});`
            );
        }
    }

    return indexes;
}

/**
 * Generate updated_at trigger SQL
 */
export function generateUpdatedAtTriggerSQL(
    workspaceId: string,
    entitySlug: string
): string {
    // Replace hyphens with underscores for valid PostgreSQL identifiers
    const safeWorkspaceId = workspaceId.replace(/-/g, '_');
    const safeEntitySlug = entitySlug.replace(/-/g, '_');
    const tableName = `workspace_${safeWorkspaceId}_${safeEntitySlug}`;

    return `
CREATE TRIGGER ${tableName}_updated_at
  BEFORE UPDATE ON public.${tableName}
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  `.trim();
}

/**
 * Provision a single entity (create table + RLS + indexes)
 */
export async function provisionEntity(
    workspaceId: string,
    entitySlug: string,
    entityConfig: EntityConfig
): Promise<void> {
    try {
        // Generate and execute CREATE TABLE
        const createTableSQL = generateCreateTableSQL(workspaceId, entitySlug, entityConfig);
        await executeDynamicSQL(createTableSQL);

        // Generate and execute RLS policies
        const rlsPolicies = generateRLSPolicySQL(workspaceId, entitySlug);
        for (const policySQL of rlsPolicies) {
            await executeDynamicSQL(policySQL);
        }

        // Generate and execute indexes
        const indexes = generateIndexSQL(workspaceId, entitySlug, entityConfig);
        for (const indexSQL of indexes) {
            await executeDynamicSQL(indexSQL);
        }

        // Generate and execute updated_at trigger
        const triggerSQL = generateUpdatedAtTriggerSQL(workspaceId, entitySlug);
        await executeDynamicSQL(triggerSQL);

        console.log(`Successfully provisioned entity: ${entitySlug} for workspace: ${workspaceId}`);
    } catch (error) {
        console.error(`Error provisioning entity ${entitySlug}:`, error);
        throw new Error(`Failed to provision entity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Provision all entities for a workspace
 */
export async function provisionWorkspace(workspaceId: string, config: WorkspaceConfig): Promise<void> {
    try {
        // Provision each entity
        for (const [entitySlug, entityConfig] of Object.entries(config.entities)) {
            await provisionEntity(workspaceId, entitySlug, entityConfig);
        }

        console.log(`Successfully provisioned all entities for workspace: ${workspaceId}`);
    } catch (error) {
        console.error(`Error provisioning workspace ${workspaceId}:`, error);
        throw new Error(`Failed to provision workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Drop all tables for a workspace (cleanup)
 */
export async function deprovisionWorkspace(workspaceId: string, entitySlugs: string[]): Promise<void> {
    try {
        for (const entitySlug of entitySlugs) {
            // Replace hyphens with underscores for valid PostgreSQL identifiers
            const safeWorkspaceId = workspaceId.replace(/-/g, '_');
            const safeEntitySlug = entitySlug.replace(/-/g, '_');
            const tableName = `workspace_${safeWorkspaceId}_${safeEntitySlug}`;
            const dropSQL = `DROP TABLE IF EXISTS public.${tableName} CASCADE;`;
            await executeDynamicSQL(dropSQL);
        }

        console.log(`Successfully deprovisioned workspace: ${workspaceId}`);
    } catch (error) {
        console.error(`Error deprovisioning workspace ${workspaceId}:`, error);
        throw new Error(`Failed to deprovision workspace: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
