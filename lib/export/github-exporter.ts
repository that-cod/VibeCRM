/**
 * @fileoverview GitHub Exporter
 * 
 * Reasoning:
 * - Push code to GitHub repositories
 * - Create repositories via GitHub API
 * - Handle authentication with GitHub
 */

import type { ProjectPlan, CodeFile } from "@/lib/code-generator/schemas";

export interface GitHubConfig {
  accessToken: string;
  owner: string;
  repoName: string;
  isPrivate?: boolean;
  description?: string;
}

export interface GitHubExportResult {
  success: boolean;
  repoUrl?: string;
  cloneUrl?: string;
  error?: string;
}

/**
 * Create a new GitHub repository
 */
export async function createGitHubRepo(
  config: GitHubConfig,
  projectPlan: ProjectPlan
): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
  try {
    const response = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: config.repoName,
        description: config.description || projectPlan.description,
        private: config.isPrivate ?? true,
        auto_init: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || "Failed to create repository" };
    }

    const repo = await response.json();
    return { success: true, repoUrl: repo.html_url };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Upload files to GitHub repository
 */
export async function uploadToGitHub(
  config: GitHubConfig,
  files: Array<{ path: string; content: string }>,
  commitMessage: string = "Initial commit from VibeCRM"
): Promise<GitHubExportResult> {
  try {
    // Get the default branch
    const repoInfoResponse = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repoName}`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!repoInfoResponse.ok) {
      return { success: false, error: "Repository not found" };
    }

    const repoInfo = await repoInfoResponse.json();
    const defaultBranch = repoInfo.default_branch;

    // Get the current commit SHA
    const refResponse = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repoName}/git/refs/heads/${defaultBranch}`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!refResponse.ok) {
      return { success: false, error: "Failed to get repository reference" };
    }

    const refData = await refResponse.json();
    const parentSha = refData.object.sha;

    // Create a tree with all files
    const treeItems = files.map((file) => ({
      path: file.path,
      mode: "100644",
      type: "blob",
      content: file.content,
    }));

    const treeResponse = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repoName}/git/trees`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          base_tree: parentSha,
          tree: treeItems,
        }),
      }
    );

    if (!treeResponse.ok) {
      const error = await treeResponse.json();
      return { success: false, error: error.message || "Failed to create tree" };
    }

    const treeData = await treeResponse.json();

    // Create a commit
    const commitResponse = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repoName}/git/commits`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [parentSha],
        }),
      }
    );

    if (!commitResponse.ok) {
      const error = await commitResponse.json();
      return { success: false, error: error.message || "Failed to create commit" };
    }

    const commitData = await commitResponse.json();

    // Update the reference
    await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repoName}/git/refs/heads/${defaultBranch}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sha: commitData.sha,
          force: false,
        }),
      }
    );

    return {
      success: true,
      repoUrl: `https://github.com/${config.owner}/${config.repoName}`,
      cloneUrl: `https://github.com/${config.owner}/${config.repoName}.git`,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Export complete project to GitHub
 */
export async function exportToGitHub(
  config: GitHubConfig,
  projectPlan: ProjectPlan,
  codeFiles: CodeFile[],
  databaseSchema: string
): Promise<GitHubExportResult> {
  try {
    // Create repository
    const createResult = await createGitHubRepo(config, projectPlan);
    if (!createResult.success) {
      return { success: false, error: createResult.error };
    }

    // Prepare files
    const files: Array<{ path: string; content: string }> = [];

    // Add code files
    for (const codeFile of codeFiles) {
      files.push({
        path: codeFile.path,
        content: codeFile.content,
      });
    }

    // Add README
    files.push({
      path: "README.md",
      content: generateReadme(projectPlan),
    });

    // Add package.json
    files.push({
      path: "package.json",
      content: generatePackageJson(projectPlan),
    });

    // Add database schema
    files.push({
      path: "supabase/schema.sql",
      content: databaseSchema,
    });

    // Add .env.example
    files.push({
      path: ".env.example",
      content: generateEnvExample(),
    });

    // Upload files
    const uploadResult = await uploadToGitHub(config, files);
    
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error };
    }

    return {
      success: true,
      repoUrl: uploadResult.repoUrl,
      cloneUrl: uploadResult.cloneUrl,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Helper functions
function generateReadme(plan: ProjectPlan): string {
  return `# ${plan.name}

${plan.description}

## Resources

${plan.resources.map(r => `### ${r.plural_label}`).join("\n")}

## Getting Started

1. \`npm install\`
2. \`cp .env.example .env.local\`
3. \`npm run dev\`

Generated by VibeCRM`;
}

function generatePackageJson(plan: ProjectPlan): string {
  return JSON.stringify({
    name: plan.name.toLowerCase().replace(/\s+/g, "-"),
    version: "1.0.0",
    private: true,
    scripts: { dev: "next dev --turbo", build: "next build", start: "next start" },
    dependencies: {
      "@anthropic-ai/sdk": "^0.32.1",
      "@supabase/supabase-js": "^2.0.0",
      "@tanstack/react-table": "^8.0.0",
      "next": "^15.0.0",
      "react": "^19.0.0",
      "react-hook-form": "^7.0.0",
      "zod": "^3.0.0",
      "lucide-react": "^0.400.0",
    },
  }, null, 2);
}

function generateEnvExample(): string {
  return `NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=`;
}
