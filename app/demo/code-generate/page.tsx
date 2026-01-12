"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GeneratedCodeViewer } from "@/components/generated-code-viewer";
import { Loader2, Sparkles } from "lucide-react";
import type { ProjectPlan, CodeFile } from "@/lib/code-generator/schemas";

export default function CodeGenerateDemo() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    projectPlan: ProjectPlan;
    codeFiles: CodeFile[];
    databaseSchema: string;
    dependencies: string[];
  } | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/v1/code-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate code");
      }

      setResult({
        projectPlan: data.project_plan,
        codeFiles: data.code_files,
        databaseSchema: data.database_schema,
        dependencies: data.dependencies,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          VibeCRM Code Generator
        </h1>
        <p className="text-muted-foreground">Describe your CRM in plain English and get a complete React application</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Describe Your CRM</CardTitle>
          <CardDescription>            Example: &quot;Build a sales CRM to track deals, companies, and contacts&quot;</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe what you want to track in your CRM..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
          />
          <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate CRM Application
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Generated Application</h2>
            <Badge variant="secondary">{result.codeFiles.length} files</Badge>
          </div>
          <GeneratedCodeViewer
            projectPlan={result.projectPlan}
            codeFiles={result.codeFiles}
            databaseSchema={result.databaseSchema}
            dependencies={result.dependencies}
          />
        </div>
      )}
    </div>
  );
}
