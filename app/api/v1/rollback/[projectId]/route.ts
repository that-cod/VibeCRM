/**
 * @fileoverview Rollback API - Revert to previous schema version
 *
 * Reasoning:
 * - Allows users to rollback to any previous schema version
 * - Creates a new version with the old schema
 * - Logs the rollback as a decision trace
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CRMSchema } from "@/types/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { targetVersion, reason } = body;

    if (!targetVersion) {
      return NextResponse.json(
        { error: "Missing targetVersion" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Get the target vibe config
    const { data: targetConfig, error: configError } = await supabaseAdmin
      .from("vibe_configs")
      .select("schema_json, schema_version")
      .eq("project_id", projectId)
      .eq("schema_version", targetVersion)
      .single();

    if (configError || !targetConfig) {
      return NextResponse.json(
        { error: `Version ${targetVersion} not found` },
        { status: 404 }
      );
    }

    // Get current active config for schema_before
    const { data: currentConfig } = await supabaseAdmin
      .from("vibe_configs")
      .select("schema_json, schema_version")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .single();

    // Deactivate all current configs
    await supabaseAdmin
      .from("vibe_configs")
      .update({ is_active: false })
      .eq("project_id", projectId);

    // Calculate new version (patch bump)
    const versionParts = targetVersion.split(".");
    const newPatch = parseInt(versionParts[2] || "0") + 1;
    const newVersion = `${versionParts[0] || "1"}.${versionParts[1] || "0"}.${newPatch}`;

    // Create new config with the rolled-back schema
    const { data: newConfig, error: createError } = await supabaseAdmin
      .from("vibe_configs")
      .insert({
        project_id: projectId,
        user_id: user.id,
        schema_version: newVersion,
        schema_json: targetConfig.schema_json as CRMSchema,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create rollback config:", createError);
      return NextResponse.json(
        { error: "Failed to create rollback version" },
        { status: 500 }
      );
    }

    // Log the rollback as a decision trace
    await supabaseAdmin.from("decision_traces").insert({
      project_id: projectId,
      user_id: user.id,
      intent: `Rollback to v${targetVersion}: ${reason || "No reason provided"}`,
      action: `Rolled back from v${currentConfig?.schema_version || "?"} to v${newVersion}`,
      precedent: "User requested rollback to previous schema version",
      version: newVersion,
      schema_before: currentConfig?.schema_json as CRMSchema,
      schema_after: targetConfig.schema_json as CRMSchema,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back to v${targetVersion} as v${newVersion}`,
      new_version: newVersion,
      rolled_back_from: targetVersion,
      config_id: newConfig.id,
    });
  } catch (error: any) {
    console.error("Rollback error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version");

    if (!version) {
      return NextResponse.json(
        { error: "Missing version parameter" },
        { status: 400 }
      );
    }

    const { data: config, error } = await supabaseAdmin
      .from("vibe_configs")
      .select("schema_json, schema_version, created_at, is_active")
      .eq("project_id", projectId)
      .eq("schema_version", version)
      .single();

    if (error || !config) {
      return NextResponse.json(
        { error: `Version ${version} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version: config.schema_version,
      schema: config.schema_json,
      created_at: config.created_at,
      is_active: config.is_active,
    });
  } catch (error: any) {
    console.error("Get version error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
