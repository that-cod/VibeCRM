/**
 * @fileoverview API endpoint for one-click deployment
 * 
 * Phase 4: One-Click Deployment
 * Handles deployment orchestration
 */

import { NextRequest, NextResponse } from "next/server";
import { createDeploymentManager } from "@/lib/deployment/deployment-manager";
import { CRMSchemaValidator } from "@/lib/validators/schema";
import type { CRMSchema } from "@/types/schema";
import type { DeploymentConfig } from "@/lib/deployment/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schema,
      project_name,
      github_token,
      vercel_token,
      env_vars,
      github_repo,
    } = body;

    // Validate inputs
    if (!schema) {
      return NextResponse.json(
        { error: "Schema is required" },
        { status: 400 }
      );
    }

    if (!project_name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (!github_token) {
      return NextResponse.json(
        { error: "GitHub token is required" },
        { status: 400 }
      );
    }

    if (!vercel_token) {
      return NextResponse.json(
        { error: "Vercel token is required" },
        { status: 400 }
      );
    }

    // Validate schema
    const schemaValidation = CRMSchemaValidator.safeParse(schema);
    if (!schemaValidation.success) {
      return NextResponse.json(
        { error: "Invalid schema format", details: schemaValidation.error },
        { status: 400 }
      );
    }

    const validatedSchema = schemaValidation.data as CRMSchema;

    // Create deployment config
    const config: DeploymentConfig = {
      projectName: project_name,
      provider: "vercel",
      githubRepo: github_repo,
      envVars: env_vars || {},
      framework: "nextjs",
    };

    // Deploy
    const manager = createDeploymentManager();
    const result = await manager.deploy(
      validatedSchema,
      config,
      github_token,
      vercel_token
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Deployment failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deployment_id: result.deploymentId,
      url: result.url,
      preview_url: result.previewUrl,
      github_url: result.githubUrl,
    });
  } catch (error: any) {
    console.error("Deployment error:", error);

    return NextResponse.json(
      { error: "Failed to deploy project", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check deployment status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get("deployment_id");
    const vercelToken = searchParams.get("vercel_token");

    if (!deploymentId || !vercelToken) {
      return NextResponse.json(
        { error: "deployment_id and vercel_token are required" },
        { status: 400 }
      );
    }

    const manager = createDeploymentManager();
    const status = await manager.checkDeploymentStatus(deploymentId, vercelToken);

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Status check error:", error);

    return NextResponse.json(
      { error: "Failed to check deployment status", message: error.message },
      { status: 500 }
    );
  }
}
