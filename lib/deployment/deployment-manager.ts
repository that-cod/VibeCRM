/**
 * @fileoverview Deployment manager orchestrating the entire deployment flow
 * 
 * Phase 4: One-Click Deployment
 * Coordinates GitHub, Vercel, and code generation
 */

import { createGitHubClient } from "./github-client";
import { createVercelClient } from "./vercel-client";
import { generateProjectFiles } from "@/lib/code-export/project-generator";
import type {
  DeploymentConfig,
  DeploymentResult,
  DeploymentProgress,
  DeploymentStatus,
} from "./types";
import type { CRMSchema } from "@/types/schema";

export class DeploymentManager {
  private progressCallbacks: Set<(progress: DeploymentProgress) => void> = new Set();

  /**
   * Deploy a CRM project
   */
  async deploy(
    schema: CRMSchema,
    config: DeploymentConfig,
    githubToken: string,
    vercelToken: string
  ): Promise<DeploymentResult> {
    try {
      // Step 1: Prepare
      this.updateProgress("preparing", "Preparing deployment...", 0);

      // Generate project files
      const supabaseUrl = config.envVars.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = config.envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      
      const fileArray = generateProjectFiles(
        schema,
        config.projectName,
        supabaseUrl,
        supabaseAnonKey
      );
      
      // Convert CodeFile[] to Record<string, string>
      const files: Record<string, string> = {};
      fileArray.forEach(file => {
        files[file.path] = file.content;
      });

      // Step 2: Create GitHub repository
      this.updateProgress("creating_repo", "Creating GitHub repository...", 20);

      const githubClient = createGitHubClient(githubToken);
      const user = await githubClient.getAuthenticatedUser();
      
      let repository;
      const repoName = config.githubRepo?.name || config.projectName;
      const repoExists = await githubClient.repositoryExists(user.login, repoName);

      if (repoExists) {
        repository = await githubClient.getRepository(user.login, repoName);
        if (!repository) {
          throw new Error("Repository exists but could not be retrieved");
        }
      } else {
        repository = await githubClient.createRepository(
          repoName,
          config.githubRepo?.private ?? true,
          `VibeCRM project: ${config.projectName}`
        );
      }
      
      if (!repository) {
        throw new Error("Failed to create or retrieve repository");
      }

      // Step 3: Push code to GitHub
      this.updateProgress("pushing_code", "Pushing code to GitHub...", 40);

      await githubClient.pushFiles(
        user.login,
        repoName,
        files,
        "Initial VibeCRM deployment"
      );

      // Step 4: Configure Vercel
      this.updateProgress("configuring", "Configuring Vercel project...", 60);

      const vercelClient = createVercelClient(vercelToken);
      
      // Check if project exists
      let project = await vercelClient.getProject(config.projectName);
      
      if (!project) {
        // Create new project
        project = await vercelClient.createProject({
          ...config,
          githubRepo: {
            owner: user.login,
            name: repoName,
            private: config.githubRepo?.private ?? true,
          },
        });
      } else {
        // Update environment variables
        await vercelClient.setEnvironmentVariables(project.id, config.envVars);
      }

      // Link GitHub repository
      await vercelClient.linkGitHubRepo(project.id, repository.full_name);

      // Step 5: Deploy to Vercel
      this.updateProgress("deploying", "Deploying to Vercel...", 80);

      // Trigger deployment by pushing to GitHub
      // Vercel will automatically deploy when linked to GitHub
      
      // Wait a bit for Vercel to pick up the deployment
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Get latest deployment
      const deployments = await vercelClient.listDeployments(config.projectName);
      const latestDeployment = deployments[0];

      if (!latestDeployment) {
        throw new Error("Deployment not found. Please check Vercel dashboard.");
      }

      // Step 6: Success
      this.updateProgress("success", "Deployment successful!", 100);

      return {
        success: true,
        deploymentId: latestDeployment.id,
        url: `https://${latestDeployment.url}`,
        previewUrl: `https://${latestDeployment.url}`,
        githubUrl: repository.html_url,
      };
    } catch (error: any) {
      this.updateProgress("error", error.message, 0);

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check deployment status
   */
  async checkDeploymentStatus(
    deploymentId: string,
    vercelToken: string
  ): Promise<DeploymentProgress> {
    try {
      const vercelClient = createVercelClient(vercelToken);
      const deployment = await vercelClient.getDeployment(deploymentId);

      let status: DeploymentStatus;
      let message: string;
      let progress: number;

      switch (deployment.readyState) {
        case "QUEUED":
          status = "deploying";
          message = "Deployment queued...";
          progress = 85;
          break;
        case "BUILDING":
          status = "deploying";
          message = "Building project...";
          progress = 90;
          break;
        case "READY":
          status = "success";
          message = "Deployment ready!";
          progress = 100;
          break;
        case "ERROR":
          status = "error";
          message = "Deployment failed";
          progress = 0;
          break;
        default:
          status = "deploying";
          message = "Deploying...";
          progress = 85;
      }

      return {
        status,
        message,
        progress,
        timestamp: Date.now(),
        details: deployment,
      };
    } catch (error: any) {
      return {
        status: "error",
        message: error.message,
        progress: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(callback: (progress: DeploymentProgress) => void): () => void {
    this.progressCallbacks.add(callback);
    return () => {
      this.progressCallbacks.delete(callback);
    };
  }

  /**
   * Update progress and notify subscribers
   */
  private updateProgress(
    status: DeploymentStatus,
    message: string,
    progress: number,
    details?: any
  ) {
    const progressUpdate: DeploymentProgress = {
      status,
      message,
      progress,
      timestamp: Date.now(),
      details,
    };

    this.progressCallbacks.forEach(callback => callback(progressUpdate));
  }
}

/**
 * Create a deployment manager instance
 */
export function createDeploymentManager(): DeploymentManager {
  return new DeploymentManager();
}
