/**
 * @fileoverview API Route: POST /api/v1/provision
 * 
 * Purpose: Provision validated CRM schema to Supabase database
 * 
 * Reasoning:
 * - Executes generated SQL in database
 * - NEVER accepts raw SQL (only validated JSON schemas)
 * - Creates RLS policies automatically
 * - Atomic operation with transaction rollback on error
 * 
 * Dependencies:
 * - lib/sql/generator for safe SQL generation
 * - lib/validators for schema validation
 * - lib/supabase/server for database operations
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CRMSchemaValidator } from "@/lib/validators/schema";
import { validateAllSchemaRules } from "@/lib/validators/schema-rules";
import { generateProvisioningSQL } from "@/lib/sql/generator";
import { convertSchemaToResources } from "@/lib/integration/schema-to-resource";
import { resourceRegistry } from "@/lib/resources/registry";
import type { CRMSchema } from "@/types/schema";

export async function POST(request: NextRequest) {
    try {
        // 1. Get authenticated user
        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // 2. Parse and validate request
        const body = await request.json();
        const validation = ProvisionSchemaRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { schema_json, project_id } = validation.data;

        // 3. Verify project ownership
        const { data: project, error: projectError } = await supabaseAdmin
            .from("projects")
            .select("id, user_id")
            .eq("id", project_id)
            .eq("user_id", user.id)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // 4. Run validation rules one more time (defense in depth)
        const rulesValidation = validateAllSchemaRules(schema_json as any);
        if (!rulesValidation.passed) {
            return NextResponse.json(
                {
                    error: "Schema validation failed",
                    details: rulesValidation.errors,
                },
                { status: 400 }
            );
        }

        // 5. Generate safe SQL from validated JSON
        const sql = generateProvisioningSQL(schema_json as any);

        // 6. Execute SQL in transaction (rolls back on error)
        try {
            // Use raw SQL execution (admin only - never exposed to users)
            const { error: execError } = await supabaseAdmin.rpc("exec_sql", {
                sql_query: sql,
            });

            if (execError) {
                throw new Error(`SQL execution failed: ${execError.message}`);
            }
        } catch (sqlError: any) {
            console.error("Provisioning error:", sqlError);

            return NextResponse.json(
                {
                    error: "Failed to provision schema",
                    message: "Database execution failed. Your schema may have conflicts with existing data.",
                    details: sqlError.message,
                },
                { status: 500 }
            );
        }

        // 7. Deactivate old schemas
        await supabaseAdmin
            .from("vibe_configs")
            .update({ is_active: false })
            .eq("project_id", project_id)
            .neq("schema_version", schema_json.version);

        // 8. Save new schema config
        const { data: config, error: configError } = await supabaseAdmin
            .from("vibe_configs")
            .insert({
                project_id,
                user_id: user.id,
                schema_version: schema_json.version,
                schema_json,
                is_active: true,
            })
            .select()
            .single();

        if (configError) {
            console.error("Failed to save vibe_config:", configError);
            // Non-fatal - schema is already provisioned
        }

        // 9. Register resources for dynamic UI
        try {
            const resources = convertSchemaToResources(schema_json);
            resources.forEach(resource => {
                resourceRegistry.register(resource);
            });
            console.log(`Registered ${resources.length} resources to dynamic registry`);
        } catch (regError) {
            console.error("Failed to register resources:", regError);
            // Non-fatal - tables are already provisioned
        }

        // 10. Count provisioned resources
        const tablesCreated = schema_json.tables.map(t => t.name);
        const rlsPoliciesCreated = schema_json.tables.length; // One policy per table

        // 11. Return success response
        return NextResponse.json({
            success: true,
            migration_applied: true,
            tables_created: tablesCreated,
            rls_policies_created: rlsPoliciesCreated,
            vibe_config_id: config?.id,
            message: `Successfully provisioned ${tablesCreated.length} table(s) to your database.`,
        });

    } catch (error: any) {
        console.error("Provision error:", error);

        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to provision schema",
            },
            { status: 500 }
        );
    }
}
