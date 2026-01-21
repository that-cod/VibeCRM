/**
 * @fileoverview Type definitions for deployment system
 * 
 * Phase 4: One-Click Deployment
 * Types for Vercel and GitHub integration
 */

export type DeploymentProvider = "vercel" | "netlify" | "railway";

export type DeploymentStatus = 
  | "idle"
  | "preparing"
  | "creating_repo"
  | "pushing_code"
  | "configuring"
  | "deploying"
  | "success"
  | "error";

export interface DeploymentConfig {
  projectName: string;
  provider: DeploymentProvider;
  githubRepo?: {
    owner: string;
    name: string;
    private: boolean;
  };
  envVars: Record<string, string>;
  buildCommand?: string;
  outputDirectory?: string;
  framework?: "nextjs" | "react" | "vue";
}

export interface DeploymentResult {
  success: boolean;
  deploymentId?: string;
  url?: string;
  previewUrl?: string;
  githubUrl?: string;
  error?: string;
  logs?: string[];
}

export interface DeploymentProgress {
  status: DeploymentStatus;
  message: string;
  progress: number; // 0-100
  timestamp: number;
  details?: any;
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: "BUILDING" | "READY" | "ERROR" | "CANCELED";
  readyState: "QUEUED" | "BUILDING" | "READY" | "ERROR";
  createdAt: number;
  buildingAt?: number;
  readyAt?: number;
  alias?: string[];
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
}

export interface DeploymentEnvironment {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL?: string;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
}
