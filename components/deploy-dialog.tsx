"use client";

/**
 * @fileoverview Deployment dialog component
 * 
 * Phase 4: One-Click Deployment
 * UI for deploying CRM to production
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Rocket, Loader2, CheckCircle, AlertCircle, Github, ExternalLink } from "lucide-react";
import type { CRMSchema } from "@/types/schema";
import type { DeploymentProgress } from "@/lib/deployment/types";

interface DeployDialogProps {
  schema: CRMSchema;
  projectName: string;
  trigger?: React.ReactNode;
}

export function DeployDialog({ schema, projectName, trigger }: DeployDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState<DeploymentProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [githubToken, setGithubToken] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [repoName, setRepoName] = useState(projectName);
  const [isPrivate, setIsPrivate] = useState(true);
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseServiceKey, setSupabaseServiceKey] = useState("");

  const handleDeploy = async () => {
    if (!githubToken || !vercelToken || !supabaseUrl || !supabaseAnonKey) {
      setError("Please fill in all required fields");
      return;
    }

    setIsDeploying(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema,
          project_name: repoName,
          github_token: githubToken,
          vercel_token: vercelToken,
          github_repo: {
            name: repoName,
            private: isPrivate,
          },
          env_vars: {
            NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
            SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Deployment failed");
      }

      setResult(data);
      setProgress({
        status: "success",
        message: "Deployment successful!",
        progress: 100,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error("Deployment error:", err);
      setError(err.message || "Failed to deploy");
      setProgress({
        status: "error",
        message: err.message,
        progress: 0,
        timestamp: Date.now(),
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleReset = () => {
    setProgress(null);
    setResult(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Rocket className="h-4 w-4" />
            Deploy to Production
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Deploy to Production
          </DialogTitle>
          <DialogDescription>
            Deploy your CRM to Vercel with GitHub integration in one click
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-6 py-4">
            {/* GitHub Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub Configuration
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="github-token">
                  GitHub Personal Access Token *
                </Label>
                <Input
                  id="github-token"
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  disabled={isDeploying}
                />
                <p className="text-xs text-gray-500">
                  Create a token at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    github.com/settings/tokens
                  </a>{" "}
                  with repo permissions
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-name">Repository Name *</Label>
                <Input
                  id="repo-name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-crm"
                  disabled={isDeploying}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="private-repo"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  disabled={isDeploying}
                  className="rounded"
                />
                <Label htmlFor="private-repo" className="cursor-pointer">
                  Private repository
                </Label>
              </div>
            </div>

            {/* Vercel Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                Vercel Configuration
              </h3>

              <div className="space-y-2">
                <Label htmlFor="vercel-token">Vercel Token *</Label>
                <Input
                  id="vercel-token"
                  type="password"
                  value={vercelToken}
                  onChange={(e) => setVercelToken(e.target.value)}
                  placeholder="xxxxxxxxxx"
                  disabled={isDeploying}
                />
                <p className="text-xs text-gray-500">
                  Create a token at{" "}
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    vercel.com/account/tokens
                  </a>
                </p>
              </div>
            </div>

            {/* Supabase Configuration */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm">Supabase Configuration</h3>

              <div className="space-y-2">
                <Label htmlFor="supabase-url">Supabase URL *</Label>
                <Input
                  id="supabase-url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxxxx.supabase.co"
                  disabled={isDeploying}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-anon">Supabase Anon Key *</Label>
                <Input
                  id="supabase-anon"
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  disabled={isDeploying}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supabase-service">
                  Supabase Service Role Key (Optional)
                </Label>
                <Input
                  id="supabase-service"
                  type="password"
                  value={supabaseServiceKey}
                  onChange={(e) => setSupabaseServiceKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  disabled={isDeploying}
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Progress Display */}
            {progress && progress.status !== "error" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  <span className="font-semibold text-blue-900">
                    {progress.message}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Deploy Button */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="flex-1"
                size="lg"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Deploy Now
                  </>
                )}
              </Button>
              <Button
                onClick={() => setOpen(false)}
                variant="outline"
                disabled={isDeploying}
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Success State
          <div className="space-y-6 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Deployment Successful!
              </h3>
              <p className="text-green-700 mb-4">
                Your CRM is now live and ready to use
              </p>

              <div className="space-y-3">
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                    Visit Your CRM
                  </a>
                )}

                {result.github_url && (
                  <a
                    href={result.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Github className="h-5 w-5" />
                    View on GitHub
                  </a>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                Deploy Another
              </Button>
              <Button onClick={() => setOpen(false)} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
