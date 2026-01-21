/**
 * @fileoverview GitHub API client for repository management
 * 
 * Phase 4: One-Click Deployment
 * Handles GitHub repository creation and code pushing
 */

import type { GitHubRepository } from "./types";

export class GitHubClient {
  private token: string;
  private baseUrl = "https://api.github.com";

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Create a new repository
   */
  async createRepository(
    name: string,
    isPrivate: boolean = true,
    description?: string
  ): Promise<GitHubRepository> {
    const response = await fetch(`${this.baseUrl}/user/repos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        name,
        private: isPrivate,
        description: description || `VibeCRM project: ${name}`,
        auto_init: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create GitHub repo: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get repository by name
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepository | null> {
    const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(`Failed to get GitHub repo: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create or update a file in the repository
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          sha,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create/update file: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get file content from repository
   */
  async getFileContent(
    owner: string,
    repo: string,
    path: string
  ): Promise<{ content: string; sha: string } | null> {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(`Failed to get file: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
    };
  }

  /**
   * Push multiple files to repository
   */
  async pushFiles(
    owner: string,
    repo: string,
    files: Record<string, string>,
    commitMessage: string = "Deploy VibeCRM project"
  ): Promise<void> {
    // Push files sequentially to avoid conflicts
    for (const [path, content] of Object.entries(files)) {
      try {
        // Check if file exists
        const existing = await this.getFileContent(owner, repo, path);
        
        // Create or update
        await this.createOrUpdateFile(
          owner,
          repo,
          path,
          content,
          commitMessage,
          existing?.sha
        );
      } catch (error: any) {
        console.error(`Failed to push file ${path}:`, error);
        throw error;
      }
    }
  }

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get user: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if repository exists
   */
  async repositoryExists(owner: string, repo: string): Promise<boolean> {
    const repository = await this.getRepository(owner, repo);
    return repository !== null;
  }
}

/**
 * Create a GitHub client instance
 */
export function createGitHubClient(token: string): GitHubClient {
  return new GitHubClient(token);
}
