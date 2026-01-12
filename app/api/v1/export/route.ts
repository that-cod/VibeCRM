import { NextRequest, NextResponse } from "next/server";
import { generateExportFiles, downloadAsZip } from "@/lib/export/code-exporter";
import { exportToGitHub } from "@/lib/export/github-exporter";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const isDev = process.env.NODE_ENV === "development";
    
    if (!authHeader && !isDev) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { export_format, project_plan, code_files, database_schema, github_config } = body;

    if (!export_format) {
      return NextResponse.json({ error: "Export format is required" }, { status: 400 });
    }

    if (export_format === "zip") {
      const files = generateExportFiles({
        projectPlan: project_plan,
        codeFiles: code_files || [],
        databaseSchema: database_schema || "",
        includeReadme: true,
        includePackageJson: true,
      });

      return NextResponse.json({
        success: true,
        format: "zip",
        file_count: files.length,
        files: files.map(f => ({ path: f.path, size: f.content.length })),
        message: `Generated ${files.length} files for download`,
      });
    }

    if (export_format === "github") {
      if (!github_config?.accessToken) {
        return NextResponse.json(
          { error: "GitHub access token is required for GitHub export" },
          { status: 400 }
        );
      }

      const result = await exportToGitHub(
        {
          accessToken: github_config.accessToken,
          owner: github_config.owner,
          repoName: github_config.repoName,
          isPrivate: github_config.isPrivate ?? true,
          description: github_config.description,
        },
        project_plan,
        code_files || [],
        database_schema || ""
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        format: "github",
        repoUrl: result.repoUrl,
        cloneUrl: result.cloneUrl,
        message: `Successfully exported to ${result.repoUrl}`,
      });
    }

    return NextResponse.json({ error: "Invalid export format" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    if (format === "templates") {
      return NextResponse.json({
        success: true,
        templates: ["zip", "github"],
        description: {
          zip: "Download project as ZIP file",
          github: "Push code to GitHub repository",
        },
      });
    }

    return NextResponse.json({ success: true, message: "Export API" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
