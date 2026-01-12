/**
 * @fileoverview API Route: GET /api/v1/vibe-replay/[projectId]
 * 
 * Purpose: Fetch AI decision history for Vibe Replay UI
 * 
 * Reasoning:
 * - Provides transparency into AI schema generation
 * - Returns chronological decision traces
 * - Includes schema version history
 * 
 * Dependencies:
 * - lib/supabase/server for database operations
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ projectId: string }> }
) {
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

        const { projectId } = await context.params;

        // 2. Verify project access
        const { data: project, error: projectError } = await supabaseAdmin
            .from("projects")
            .select("id")
            .eq("id", projectId)
            .eq("user_id", user.id)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // 3. Fetch decision traces (RLS filters automatically)
        const { data: traces, error: tracesError } = await supabaseAdmin
            .from("decision_traces")
            .select("*")
            .eq("project_id", projectId)
            .order("timestamp", { ascending: false });

        if (tracesError) {
            console.error("Failed to fetch traces:", tracesError);
            return NextResponse.json(
                { error: "Failed to fetch decision history" },
                { status: 500 }
            );
        }

        // 4. Fetch schema versions
        const { data: versions, error: versionsError } = await supabaseAdmin
            .from("vibe_configs")
            .select("schema_version, created_at, is_active")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

        if (versionsError) {
            console.error("Failed to fetch versions:", versionsError);
            // Non-fatal
        }

        // 5. Fetch current active schema
        const { data: currentConfig, error: configError } = await supabaseAdmin
            .from("vibe_configs")
            .select("schema_json")
            .eq("project_id", projectId)
            .eq("is_active", true)
            .single();

        if (configError) {
            console.error("Failed to fetch current schema:", configError);
            // Non-fatal
        }

        // 6. Return complete Vibe Replay data
        return NextResponse.json({
            traces: traces || [],
            schema_versions: versions || [],
            current_schema: currentConfig?.schema_json || null,
        });

    } catch (error: any) {
        console.error("Vibe Replay error:", error);

        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to fetch vibe replay data",
            },
            { status: 500 }
        );
    }
}
