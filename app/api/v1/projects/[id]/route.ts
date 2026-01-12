/**
 * @fileoverview API Route: GET/PATCH/DELETE /api/v1/projects/[id]
 * 
 * Purpose: Manage individual project operations
 * 
 * Reasoning:
 * - CRUD operations for single project
 * - RLS ensures user can only modify their own projects
 * - Delete cascades to vibe_configs, decision_traces, and user tables
 * 
 * Dependencies:
 * - lib/validators/schema for request validation
 * - lib/supabase/server for database operations
 */

import { NextRequest, NextResponse } from "next/server";
import { UpdateProjectSchema } from "@/lib/validators/schema";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * GET - Get single project details
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Get authenticated user (or dev mode)
        const isDev = process.env.NODE_ENV === "development";
        let user: { id: string; email?: string };

        const authHeader = request.headers.get("authorization");

        if (!authHeader && isDev) {
            console.log("⚠️ DEV MODE: Using mock user");
            user = {
                id: "00000000-0000-0000-0000-000000000000",
                email: "dev@example.com"
            };
        } else if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        } else {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (authError || !authUser) {
                return NextResponse.json({ error: "Invalid token" }, { status: 401 });
            }

            user = authUser;
        }

        const { id: projectId } = await context.params;

        // 2. Fetch project with schema info
        const { data: project, error: projectError } = await supabaseAdmin
            .from("projects")
            .select(`
                id,
                name,
                description,
                created_at,
                updated_at,
                vibe_configs (
                    id,
                    schema_version,
                    is_active,
                    created_at
                )
            `)
            .eq("id", projectId)
            .eq("user_id", user.id)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // 3. Format response
        const activeConfig = project.vibe_configs?.find((c: any) => c.is_active);

        return NextResponse.json({
            project: {
                id: project.id,
                name: project.name,
                description: project.description,
                created_at: project.created_at,
                updated_at: project.updated_at,
                active_schema_version: activeConfig?.schema_version || null,
                active_config_id: activeConfig?.id || null,
                schema_versions: project.vibe_configs || [],
            },
        });

    } catch (error: any) {
        console.error("Get project error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to get project",
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH - Update project
 */
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Get authenticated user (or dev mode)
        const isDev = process.env.NODE_ENV === "development";
        let user: { id: string; email?: string };

        const authHeader = request.headers.get("authorization");

        if (!authHeader && isDev) {
            console.log("⚠️ DEV MODE: Using mock user");
            user = {
                id: "00000000-0000-0000-0000-000000000000",
                email: "dev@example.com"
            };
        } else if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        } else {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (authError || !authUser) {
                return NextResponse.json({ error: "Invalid token" }, { status: 401 });
            }

            user = authUser;
        }

        const { id: projectId } = await context.params;

        // 2. Parse and validate request
        const body = await request.json();
        const validation = UpdateProjectSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request", details: validation.error.issues },
                { status: 400 }
            );
        }

        const updates = validation.data;

        // 3. Update project (RLS ensures ownership)
        const { data: project, error: updateError } = await supabaseAdmin
            .from("projects")
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq("id", projectId)
            .eq("user_id", user.id)
            .select()
            .single();

        if (updateError || !project) {
            console.error("Failed to update project:", updateError);
            return NextResponse.json(
                { error: "Failed to update project or access denied" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            project,
            message: "Project updated successfully",
        });

    } catch (error: any) {
        console.error("Update project error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to update project",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Delete project
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Get authenticated user (or dev mode)
        const isDev = process.env.NODE_ENV === "development";
        let user: { id: string; email?: string };

        const authHeader = request.headers.get("authorization");

        if (!authHeader && isDev) {
            console.log("⚠️ DEV MODE: Using mock user");
            user = {
                id: "00000000-0000-0000-0000-000000000000",
                email: "dev@example.com"
            };
        } else if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        } else {
            const token = authHeader.replace("Bearer ", "");
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

            if (authError || !authUser) {
                return NextResponse.json({ error: "Invalid token" }, { status: 401 });
            }

            user = authUser;
        }

        const { id: projectId } = await context.params;

        // 2. Check if project exists and get table names
        const { data: configs, error: configError } = await supabaseAdmin
            .from("vibe_configs")
            .select("schema_json")
            .eq("project_id", projectId)
            .eq("user_id", user.id);

        if (configError) {
            console.error("Failed to check project configs:", configError);
        }

        // Extract table names for cascade deletion warning
        const tableNames: string[] = [];
        if (configs && configs.length > 0) {
            configs.forEach((config: any) => {
                if (config.schema_json && config.schema_json.tables) {
                    config.schema_json.tables.forEach((table: any) => {
                        if (!tableNames.includes(table.name)) {
                            tableNames.push(table.name);
                        }
                    });
                }
            });
        }

        // 3. Delete project (CASCADE will delete related records)
        const { error: deleteError } = await supabaseAdmin
            .from("projects")
            .delete()
            .eq("id", projectId)
            .eq("user_id", user.id);

        if (deleteError) {
            console.error("Failed to delete project:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete project or access denied" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Project deleted successfully",
            warning: tableNames.length > 0
                ? `The following tables were also deleted: ${tableNames.join(", ")}`
                : null,
            deleted_tables: tableNames,
        });

    } catch (error: any) {
        console.error("Delete project error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to delete project",
            },
            { status: 500 }
        );
    }
}
