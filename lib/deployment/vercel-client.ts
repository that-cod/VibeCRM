/**
 * @fileoverview Vercel API client for deployments
 * 
 * Phase 4: One-Click Deployment
 * Handles Vercel API interactions
 */

import type { VercelDeployment, DeploymentConfig } from "./types";

export class VercelClient {
  private token: string;
  private teamId?: string;
  private baseUrl = "https://api.vercel.com";

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  /**
   * Create a new project on Vercel
   */
  async createProject(config: DeploymentConfig): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v9/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: config.projectName,
        framework: config.framework || "nextjs",
        gitRepository: config.githubRepo ? {
          type: "github",
          repo: `${config.githubRepo.owner}/${config.githubRepo.name}`,
        } : undefined,
        environmentVariables: Object.entries(config.envVars).map(([key, value]) => ({
          key,
          value,
          type: "encrypted",
          target: ["production", "preview", "development"],
        })),
        buildCommand: config.buildCommand,
        outputDirectory: config.outputDirectory,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create Vercel project: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Deploy a project to Vercel
   */
  async deploy(projectName: string, files: Record<string, string>): Promise<VercelDeployment> {
    // Create deployment
    const response = await fetch(`${this.baseUrl}/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        files: Object.entries(files).map(([file, data]) => ({
          file,
          data,
        })),
        projectSettings: {
          framework: "nextjs",
        },
        target: "production",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to deploy to Vercel: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get deployment status
   */
  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    const response = await fetch(`${this.baseUrl}/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get deployment: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Link GitHub repository to Vercel project
   */
  async linkGitHubRepo(projectId: string, repoFullName: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v9/projects/${projectId}/link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "github",
        repo: repoFullName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to link GitHub repo: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Set environment variables for a project
   */
  async setEnvironmentVariables(
    projectId: string,
    envVars: Record<string, string>
  ): Promise<any> {
    const promises = Object.entries(envVars).map(([key, value]) =>
      fetch(`${this.baseUrl}/v9/projects/${projectId}/env`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key,
          value,
          type: "encrypted",
          target: ["production", "preview", "development"],
        }),
      })
    );

    const results = await Promise.all(promises);
    
    for (const response of results) {
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to set env var: ${error.error?.message || response.statusText}`);
      }
    }

    return { success: true };
  }

  /**
   * Get project by name
   */
  async getProject(projectName: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/v9/projects/${projectName}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(`Failed to get project: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all deployments for a project
   */
  async listDeployments(projectName: string): Promise<VercelDeployment[]> {
    const response = await fetch(
      `${this.baseUrl}/v6/deployments?projectId=${projectName}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to list deployments: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.deployments || [];
  }
}

/**
 * Create a Vercel client instance
 */
export function createVercelClient(token: string, teamId?: string): VercelClient {
  return new VercelClient(token, teamId);
}
