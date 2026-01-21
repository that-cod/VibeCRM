/**
 * @fileoverview API endpoint for schema refinement
 * 
 * Phase 2: Chat-Based Iteration
 * Handles chat-based schema refinement requests
 */

import { NextRequest, NextResponse } from "next/server";
import { generateSchemaRefinement } from "@/lib/ai/refine-generator";
import { CRMSchemaValidator } from "@/lib/validators/schema";
import type { CRMSchema } from "@/types/schema";
import type { ChatMessage } from "@/lib/chat/types";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { message, current_schema, conversation_history } = body;

    // Validate inputs
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!current_schema) {
      return NextResponse.json(
        { error: "Current schema is required" },
        { status: 400 }
      );
    }

    // Validate current schema
    const schemaValidation = CRMSchemaValidator.safeParse(current_schema);
    if (!schemaValidation.success) {
      return NextResponse.json(
        { error: "Invalid schema format", details: schemaValidation.error },
        { status: 400 }
      );
    }

    const currentSchema = schemaValidation.data as CRMSchema;
    const history = (conversation_history || []) as ChatMessage[];

    // Generate refinement
    const result = await generateSchemaRefinement(
      message,
      currentSchema,
      history
    );

    // Validate updated schema
    const updatedSchemaValidation = CRMSchemaValidator.safeParse(result.updatedSchema);
    if (!updatedSchemaValidation.success) {
      return NextResponse.json(
        {
          error: "Generated schema is invalid",
          details: updatedSchemaValidation.error,
        },
        { status: 500 }
      );
    }

    // Return response
    return NextResponse.json({
      intent: result.intent,
      reasoning: result.reasoning,
      changes: result.changes,
      updated_schema: result.updatedSchema,
      message: result.responseMessage,
    });
  } catch (error: any) {
    console.error("Refine error:", error);

    // Handle specific errors
    if (error.message?.includes("API key")) {
      return NextResponse.json(
        { error: "AI service configuration error" },
        { status: 500 }
      );
    }

    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process refinement", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for refine options/info
 */
export async function GET() {
  return NextResponse.json({
    supported_intents: [
      "ADD_TABLE",
      "MODIFY_TABLE",
      "DELETE_TABLE",
      "ADD_COLUMN",
      "MODIFY_COLUMN",
      "DELETE_COLUMN",
      "ADD_RELATIONSHIP",
      "MODIFY_UI",
      "ADD_FEATURE",
      "FIX_ERROR",
      "CLARIFY",
      "OTHER",
    ],
    examples: [
      "Add a status column to the properties table",
      "Change the color of the agents table to green",
      "Add a notes field to contacts",
      "Remove the description column from deals",
      "Add dark mode support",
      "Make the UI more modern",
    ],
  });
}
