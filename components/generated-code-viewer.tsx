"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code, Copy, Check, FileText, Database, Package } from "lucide-react";
import type { CodeFile, ProjectPlan } from "@/lib/code-generator/schemas";

interface GeneratedCodeViewerProps {
  projectPlan: ProjectPlan;
  codeFiles: CodeFile[];
  databaseSchema?: string;
  dependencies?: string[];
}

export function GeneratedCodeViewer({ projectPlan, codeFiles, databaseSchema, dependencies }: GeneratedCodeViewerProps) {
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(codeFiles[0] || null);
  const [view, setView] = useState<"files" | "database" | "deps">("files");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (selectedFile) {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const groupedFiles = codeFiles.reduce((acc, file) => {
    const type = file.component_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(file);
    return acc;
  }, {} as Record<string, CodeFile[]>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{projectPlan.name}</CardTitle>
          <CardDescription>{projectPlan.description}</CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            {projectPlan.resources.map(r => (
              <Badge key={r.name} variant="outline">{r.plural_label}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Resources:</span><span className="ml-2 font-medium">{projectPlan.resources.length}</span></div>
            <div><span className="text-muted-foreground">Files:</span><span className="ml-2 font-medium">{codeFiles.length}</span></div>
            <div><span className="text-muted-foreground">Total Fields:</span><span className="ml-2 font-medium">{projectPlan.resources.reduce((sum, r) => sum + r.fields.length, 0)}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant={view === "files" ? "default" : "outline"} onClick={() => setView("files")}><FileText className="h-4 w-4 mr-2" />Files</Button>
        <Button variant={view === "database" ? "default" : "outline"} onClick={() => setView("database")}><Database className="h-4 w-4 mr-2" />Database</Button>
        <Button variant={view === "deps" ? "default" : "outline"} onClick={() => setView("deps")}><Package className="h-4 w-4 mr-2" />Dependencies</Button>
      </div>

      {view === "files" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Files ({codeFiles.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                {Object.entries(groupedFiles).map(([type, files]) => (
                  <div key={type}>
                    <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span className="uppercase">{type}s</span>
                      <Badge variant="secondary" className="text-xs">{files.length}</Badge>
                    </div>
                    {files.map(file => (
                      <button key={file.path} onClick={() => setSelectedFile(file)}
                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent ${selectedFile?.path === file.path ? "bg-accent" : ""}`}>
                        <Code className="h-4 w-4 text-blue-500" />
                        <span className="truncate">{file.path.split("/").pop()}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  <CardTitle className="text-sm">{selectedFile?.path}</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {selectedFile && <CardDescription>{selectedFile.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="max-h-[450px] overflow-auto">
                <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{selectedFile?.content || "No file selected"}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === "database" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Database className="h-5 w-5" /><CardTitle>Database Schema</CardTitle></div>
              <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(databaseSchema || "")}><Copy className="h-4 w-4 mr-2" />Copy SQL</Button>
            </div>
            <CardDescription>Run in Supabase SQL Editor</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg max-h-[400px] overflow-auto"><code>{databaseSchema || "No schema"}</code></pre>
          </CardContent>
        </Card>
      )}

      {view === "deps" && (
        <Card>
          <CardHeader><div className="flex items-center gap-2"><Package className="h-5 w-5" /><CardTitle>Dependencies</CardTitle></div></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dependencies?.map(dep => (
                <div key={dep} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <code className="text-sm">{dep}</code>
                </div>
              )) || <p className="text-muted-foreground">No dependencies</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
