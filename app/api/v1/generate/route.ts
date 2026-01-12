/**
 * @fileoverview API Route: POST /api/v1/generate
 * 
 * Purpose: Generate CRM schema from natural language prompt using Claude AI
 * 
 * Reasoning:
 * - Primary "Vibe-to-Code" endpoint
 * - Validates user quota before calling AI
 * - Runs complete validation pipeline on generated schema
 * - Creates decision_trace for AI transparency
 * 
 * Dependencies:
 * - lib/ai/schema-generator for Claude integration
 * - lib/validators for schema validation
 * - lib/supabase/server for database operations
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSchemaWithClaude, classifyIntent } from "@/lib/ai/schema-generator";
import { CRMSchemaValidator, GenerateSchemaRequestSchema } from "@/lib/validators/schema";
import { validateAllSchemaRules } from "@/lib/validators/schema-rules";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CRMSchema } from "@/types/schema";

export async function POST(request: NextRequest) {
    try {
        // 1. Get authenticated user (or use dev mode)
        const isDev = process.env.NODE_ENV === "development";
        let user: { id: string; email?: string };

        const authHeader = request.headers.get("authorization");

        if (!authHeader && isDev) {
            // Development mode: use mock user
            console.log("⚠️ DEV MODE: Using mock user (no auth header provided)");
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

        // 2. Parse and validate request
        const body = await request.json();
        const validation = GenerateSchemaRequestSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid request", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { prompt, project_id } = validation.data;

        // 3. Check quota (free tier: 10 AI requests per day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabaseAdmin
            .from("decision_traces")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("timestamp", today.toISOString());

        if (countError) {
            return NextResponse.json({ error: "Failed to check quota" }, { status: 500 });
        }

        const DAILY_LIMIT = 10; // Free tier
        if (count && count >= DAILY_LIMIT) {
            return NextResponse.json(
                {
                    error: "Daily AI request limit reached",
                    limit: DAILY_LIMIT,
                    message: "You've used all 10 AI requests for today. Try again tomorrow or upgrade to Pro.",
                },
                { status: 429 }
            );
        }

        // 4. Classify intent
        const intent = await classifyIntent(prompt);

        if (intent === "INVALID") {
            return NextResponse.json(
                {
                    error: "Invalid intent",
                    message: "Your request appears to be destructive or unrelated to CRM schema generation. " +
                        "Please describe what CRM entities you want to track (e.g., 'Track sales deals with companies and contacts').",
                },
                { status: 400 }
            );
        }

        // 5. Get existing schema if modifying
        let existingSchema: CRMSchema | undefined;
        if (project_id && intent === "MODIFY") {
            const { data: config, error: configError } = await supabaseAdmin
                .from("vibe_configs")
                .select("schema_json")
                .eq("project_id", project_id)
                .eq("user_id", user.id)
                .eq("is_active", true)
                .single();

            if (configError || !config) {
                return NextResponse.json(
                    { error: "Project not found or no active schema" },
                    { status: 404 }
                );
            }

            existingSchema = config.schema_json as CRMSchema;
        }

        // 6. Generate schema with Claude
        const { schema, reasoning } = await generateSchemaWithClaude(prompt, existingSchema);

        // 7. Validate generated schema with Zod
        const zodValidation = CRMSchemaValidator.safeParse(schema);
        if (!zodValidation.success) {
            // Log this as a potential AI hallucination
            console.error("Schema validation failed:", zodValidation.error);

            return NextResponse.json(
                {
                    error: "Generated schema failed validation",
                    details: zodValidation.error.issues,
                    message: "The AI generated an invalid schema. Please try rephrasing your request.",
                },
                { status: 500 }
            );
        }

        // 8. Run semantic validation rules
        const rulesValidation = validateAllSchemaRules(schema);
        if (!rulesValidation.passed) {
            return NextResponse.json(
                {
                    error: "Schema failed validation rules",
                    details: rulesValidation.errors,
                    message: "Generated schema has integrity issues. Please try again.",
                },
                { status: 400 }
            );
        }

        // 9. Create decision trace
        const { data: trace, error: traceError } = await supabaseAdmin
            .from("decision_traces")
            .insert({
                project_id: project_id || null,
                user_id: user.id,
                intent: prompt,
                action: `Generated ${schema.tables.length} table(s): ${schema.tables.map(t => t.name).join(", ")}`,
                precedent: reasoning,
                version: schema.version,
                schema_before: existingSchema || null,
                schema_after: schema,
            })
            .select()
            .single();

        if (traceError) {
            console.error("Failed to create decision trace:", traceError);
            // Non-blocking error - continue
        }

        // 10. Return generated schema
        return NextResponse.json({
            schema,
            decision_trace_id: trace?.id,
            validation_warnings: [], // Could add non-blocking warnings here
            message: `Successfully generated ${schema.tables.length} table(s) for your CRM.`,
        });

    } catch (error: any) {
        console.error("Schema generation error:", error);

        return NextResponse.json(
            {
                error: "Internal server error",
                message: error.message || "Failed to generate schema",
            },
            { status: 500 }
        );
    }
}
