"use client";

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
import { Download, Github, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ExportCodeDialogProps {
  projectId: string;
  projectName: string;
}

export function ExportCodeDialog({ projectId, projectName }: ExportCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportType, setExportType] = useState<"zip" | "github">("zip");
  const [isExporting, setIsExporting] = useState(false);
  const [githubToken, setGithubToken] = useState("");
  const [repoName, setRepoName] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleExport() {
    setIsExporting(true);
    setError("");

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const body: any = {
        project_id: projectId,
        export_type: exportType,
        project_name: projectName,
      };

      if (exportType === "github") {
        if (!githubToken || !repoName) {
          setError("GitHub token and repository name are required");
          return;
        }
        body.github_token = githubToken;
        body.repo_name = repoName;
      }

      const response = await fetch("/api/v1/export-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      if (exportType === "zip") {
        // Download ZIP file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, "-")}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setIsOpen(false);
      } else if (exportType === "github") {
        const data = await response.json();
        alert(`Success! Code pushed to ${data.repository_url}`);
        setIsOpen(false);
      }
    } catch (err: any) {
      console.error("Export error:", err);
      setError(err.message || "Failed to export code");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export CRM Code</DialogTitle>
          <DialogDescription>
            Download your complete Next.js application or push it to GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label>Export Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType("zip")}
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                  exportType === "zip"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Download className="h-6 w-6" />
                <div className="text-sm font-medium">Download ZIP</div>
                <div className="text-xs text-muted-foreground text-center">
                  Get complete project as ZIP file
                </div>
              </button>

              <button
                onClick={() => setExportType("github")}
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                  exportType === "github"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Github className="h-6 w-6" />
                <div className="text-sm font-medium">Push to GitHub</div>
                <div className="text-xs text-muted-foreground text-center">
                  Push code to your repository
                </div>
              </button>
            </div>
          </div>

          {/* GitHub Options */}
          {exportType === "github" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token">
                  GitHub Personal Access Token
                </Label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Create a token at{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    github.com/settings/tokens
                  </a>{" "}
                  with <code>repo</code> scope
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo-name">Repository Name</Label>
                <Input
                  id="repo-name"
                  placeholder="username/my-crm"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: username/repository-name
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Export Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="text-sm font-medium">What's included:</div>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Complete Next.js 14 application</li>
              <li>All CRUD pages for your tables</li>
              <li>TypeScript types and interfaces</li>
              <li>Supabase client configuration</li>
              <li>Tailwind CSS styling</li>
              <li>Production-ready code</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : exportType === "zip" ? (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download ZIP
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Push to GitHub
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
