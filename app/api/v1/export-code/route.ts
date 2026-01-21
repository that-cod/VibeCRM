/**
 * @fileoverview API endpoint for exporting generated CRM code
 * 
 * Reasoning:
 * - Generates complete Next.js project from provisioned schema
 * - Supports ZIP download and GitHub push
 * - Production-ready, standalone code
 * 
 * Dependencies:
 * - lib/code-export/project-generator for code generation
 * - lib/supabase/server for database access
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateProjectFiles } from "@/lib/code-export/project-generator";
import JSZip from "jszip";
import type { CRMSchema } from "@/types/schema";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const { project_id, export_type = "zip", project_name, github_token, repo_name } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    // 3. Get project and verify ownership
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // 4. Get active schema
    const { data: config, error: configError } = await supabaseAdmin
      .from("vibe_configs")
      .select("schema_json")
      .eq("project_id", project_id)
      .eq("is_active", true)
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: "No active schema found for this project" },
        { status: 404 }
      );
    }

    const schema = config.schema_json as CRMSchema;

    // 5. Get Supabase credentials for .env file
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // 6. Generate project files
    const files = generateProjectFiles(
      schema,
      project_name || project.name,
      supabaseUrl,
      supabaseAnonKey
    );

    // 7. Handle export type
    if (export_type === "zip") {
      // Create ZIP file
      const zip = new JSZip();

      files.forEach(file => {
        zip.file(file.path, file.content);
      });

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Return ZIP file
      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${project.name.replace(/\s+/g, "-")}.zip"`,
        },
      });
    } else if (export_type === "github") {
      // Push to GitHub
      if (!github_token || !repo_name) {
        return NextResponse.json(
          { error: "github_token and repo_name are required for GitHub export" },
          { status: 400 }
        );
      }

      try {
        await pushToGitHub(files, github_token, repo_name);

        return NextResponse.json({
          success: true,
          message: `Code pushed to GitHub repository: ${repo_name}`,
          repository_url: `https://github.com/${repo_name}`,
        });
      } catch (githubError: any) {
        console.error("GitHub push error:", githubError);
        return NextResponse.json(
          { error: "Failed to push to GitHub", details: githubError.message },
          { status: 500 }
        );
      }
    } else if (export_type === "files") {
      // Return files as JSON (for preview or custom handling)
      return NextResponse.json({
        success: true,
        files: files.map(f => ({
          path: f.path,
          content: f.content,
          size: Buffer.byteLength(f.content, "utf8"),
        })),
        total_files: files.length,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid export_type. Must be 'zip', 'github', or 'files'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Push generated files to GitHub repository
 */
async function pushToGitHub(
  files: Array<{ path: string; content: string }>,
  token: string,
  repoFullName: string
): Promise<void> {
  const [owner, repo] = repoFullName.split("/");

  if (!owner || !repo) {
    throw new Error("Invalid repository name. Format should be 'owner/repo'");
  }

  const githubApiUrl = "https://api.github.com";

  // 1. Check if repo exists, create if not
  try {
    const repoCheckResponse = await fetch(`${githubApiUrl}/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (repoCheckResponse.status === 404) {
      // Create repository
      const createRepoResponse = await fetch(`${githubApiUrl}/user/repos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repo,
          description: "AI-generated CRM application",
          private: false,
          auto_init: true,
        }),
      });

      if (!createRepoResponse.ok) {
        const error = await createRepoResponse.json();
        throw new Error(`Failed to create repository: ${error.message}`);
      }

      // Wait a bit for repo initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error: any) {
    throw new Error(`GitHub API error: ${error.message}`);
  }

  // 2. Get default branch SHA
  const branchResponse = await fetch(
    `${githubApiUrl}/repos/${owner}/${repo}/git/refs/heads/main`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  let baseSha: string;
  if (branchResponse.ok) {
    const branchData = await branchResponse.json();
    baseSha = branchData.object.sha;
  } else {
    // Try master branch
    const masterResponse = await fetch(
      `${githubApiUrl}/repos/${owner}/${repo}/git/refs/heads/master`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!masterResponse.ok) {
      throw new Error("Could not find default branch");
    }

    const masterData = await masterResponse.json();
    baseSha = masterData.object.sha;
  }

  // 3. Get base tree
  const commitResponse = await fetch(
    `${githubApiUrl}/repos/${owner}/${repo}/git/commits/${baseSha}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // 4. Create blobs for all files
  const tree = await Promise.all(
    files.map(async (file) => {
      const blobResponse = await fetch(
        `${githubApiUrl}/repos/${owner}/${repo}/git/blobs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: file.content,
            encoding: "utf-8",
          }),
        }
      );

      const blobData = await blobResponse.json();

      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      };
    })
  );

  // 5. Create tree
  const treeResponse = await fetch(
    `${githubApiUrl}/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    }
  );

  const treeData = await treeResponse.json();

  // 6. Create commit
  const newCommitResponse = await fetch(
    `${githubApiUrl}/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update CRM code from VibeCRM",
        tree: treeData.sha,
        parents: [baseSha],
      }),
    }
  );

  const newCommitData = await newCommitResponse.json();

  // 7. Update reference
  const updateRefResponse = await fetch(
    `${githubApiUrl}/repos/${owner}/${repo}/git/refs/heads/main`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: true,
      }),
    }
  );

  if (!updateRefResponse.ok) {
    // Try master branch
    await fetch(
      `${githubApiUrl}/repos/${owner}/${repo}/git/refs/heads/master`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: true,
        }),
      }
    );
  }
}

/**
 * GET endpoint to retrieve export options
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    export_types: ["zip", "github", "files"],
    description: {
      zip: "Download complete project as ZIP file",
      github: "Push code directly to GitHub repository",
      files: "Get files as JSON (for preview)",
    },
    required_fields: {
      zip: ["project_id"],
      github: ["project_id", "github_token", "repo_name"],
      files: ["project_id"],
    },
  });
}
