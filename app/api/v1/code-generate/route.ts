import { NextRequest, NextResponse } from "next/server";
import { generateCodeFromPrompt, generateDatabaseSchema, generateDependencies } from "@/lib/code-generator/generator";
import { supabaseAdmin } from "@/lib/supabase/server";
import { provisionDatabase, registerResourcesFromPlan, saveVibeConfig, getActiveResources } from "@/lib/integration";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isDev = process.env.NODE_ENV === "development";
    let user: { id: string };

    if (!authHeader && isDev) {
      user = { id: "00000000-0000-0000-0000-000000000000" };
    } else if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !authUser) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      user = authUser;
    }

    const body = await request.json();
    const { prompt, project_id, auto_provision = true, auto_register = true } = body;

    if (!prompt || typeof prompt !== "string" || prompt.length < 10) {
      return NextResponse.json(
        { error: "Invalid request", message: "Prompt must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Step 1: Generate code from prompt (Phase 1)
    const result = await generateCodeFromPrompt(prompt);

    if (!result.success || !result.projectPlan || !result.codeFiles) {
      return NextResponse.json(
        { error: "Generation failed", message: result.error || "Unknown error" },
        { status: 500 }
      );
    }

    // Step 2: Auto-register resources (Phase 2 integration)
    let registrationResult = null;
    if (auto_register) {
      registrationResult = registerResourcesFromPlan({
        projectPlan: result.projectPlan,
        clearExisting: false,
      });
    }

    // Step 3: Provision database tables
    let provisionResult = null;
    if (auto_provision) {
      provisionResult = await provisionDatabase(result.projectPlan);
    }

    // Step 4: Save config to Supabase
    const config = await saveVibeConfig({
      userId: user.id,
      projectId: project_id,
      schema: result.projectPlan,
      isActive: true,
    });

    // Step 5: Create decision trace
    await supabaseAdmin.from("decision_traces").insert({
      project_id: project_id || null,
      user_id: user.id,
      intent: prompt,
      action: `Generated ${result.projectPlan.resources.length} resources with ${result.codeFiles.length} code files`,
      precedent: "AI Code Generator + Auto-Provisioning",
      version: result.projectPlan.version,
      schema_after: { 
        project_plan: result.projectPlan, 
        file_count: result.codeFiles.length,
        database_provisioned: provisionResult?.success || false,
        resources_registered: registrationResult?.resources_registered.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      project_plan: result.projectPlan,
      code_files: result.codeFiles,
      database_schema: generateDatabaseSchema(result.projectPlan),
      dependencies: generateDependencies(result.projectPlan),
      integration: {
        registration: registrationResult ? {
          success: registrationResult.success,
          resources_registered: registrationResult.resources_registered,
          total_fields: registrationResult.total_fields,
          errors: registrationResult.errors,
        } : null,
        provisioning: provisionResult ? {
          success: provisionResult.success,
          tables_created: provisionResult.tables_created,
          errors: provisionResult.errors,
        } : null,
        config_saved: !!config,
      },
      summary: {
        resources_count: result.projectPlan.resources.length,
        files_count: result.codeFiles.length,
        resources: result.projectPlan.resources.map(r => ({
          name: r.name,
          plural: r.plural_name,
          fields: r.fields.length,
          route: `/${r.plural_name}`,
        })),
        dynamic_route: `/dynamic/${result.projectPlan.resources[0]?.plural_name}`,
      },
      message: `Successfully generated ${result.projectPlan.resources.length} resources. ` +
        `Database tables ${provisionResult?.success ? 'created' : 'not created'}. ` +
        `Resources ${registrationResult?.success ? 'registered' : 'not registered'}.`,
    });

  } catch (error: any) {
    console.error("Code generation error:", error);
    return NextResponse.json({ error: "Internal error", message: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isDev = process.env.NODE_ENV === "development";
    
    if (!authHeader && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = isDev ? "00000000-0000-0000-0000-000000000000" : "user_id";
    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");

    // Get decision traces (history)
    let historyQuery = supabaseAdmin
      .from("decision_traces")
      .select("id, project_id, intent, action, version, timestamp")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(20);

    if (project_id) {
      historyQuery = historyQuery.eq("project_id", project_id);
    }

    const { data: history, error: historyError } = await historyQuery;

    if (historyError) {
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    // Get active resources
    const resources = await getActiveResources(userId);

    return NextResponse.json({
      success: true,
      history: history || [],
      resources: resources,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
