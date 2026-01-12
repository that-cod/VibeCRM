import { useState } from "react";

interface ExportOptions {
  projectPlan: any;
  codeFiles: any[];
  databaseSchema: string;
}

interface UseExportReturn {
  isExporting: boolean;
  exportError: string | null;
  exportToZip: (options: ExportOptions) => Promise<boolean>;
  exportToGitHub: (options: ExportOptions, githubConfig: any) => Promise<string | null>;
}

export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportToZip = async (options: ExportOptions): Promise<boolean> => {
    setIsExporting(true);
    setExportError(null);
    try {
      const response = await fetch("/api/v1/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          export_format: "zip",
          ...options,
        }),
      });
      const data = await response.json();
      if (data.success) {
        return true;
      } else {
        setExportError(data.error);
        return false;
      }
    } catch (err: any) {
      setExportError(err.message);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToGitHub = async (options: ExportOptions, githubConfig: any): Promise<string | null> => {
    setIsExporting(true);
    setExportError(null);
    try {
      const response = await fetch("/api/v1/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          export_format: "github",
          ...options,
          github_config: githubConfig,
        }),
      });
      const data = await response.json();
      if (data.success) {
        return data.repoUrl;
      } else {
        setExportError(data.error);
        return null;
      }
    } catch (err: any) {
      setExportError(err.message);
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportError,
    exportToZip,
    exportToGitHub,
  };
}
