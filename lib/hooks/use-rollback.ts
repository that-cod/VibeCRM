/**
 * @fileoverview Rollback API Hook
 *
 * Reasoning:
 * - Manages rollback functionality from UI
 * - Fetches rollback confirmation before executing
 * - Provides loading/error states
 */

"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface RollbackResult {
  success: boolean;
  message: string;
  new_version: string;
  rolled_back_from: string;
}

export function useRollback(projectId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RollbackResult | null>(null);
  const supabase = createClient();

  const rollback = useCallback(
    async (targetVersion: string, reason?: string): Promise<RollbackResult | null> => {
      if (!projectId) {
        setError("No project selected");
        return null;
      }

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch(`/api/v1/rollback/${projectId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ targetVersion, reason }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Rollback failed");
        }

        const data = await response.json();
        setResult(data);
        return data;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, supabase]
  );

  const getVersion = useCallback(
    async (version: string) => {
      if (!projectId) return null;

      try {
        const response = await fetch(`/api/v1/rollback/${projectId}?version=${version}`, {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!response.ok) {
          return null;
        }

        return await response.json();
      } catch {
        return null;
      }
    },
    [projectId, supabase]
  );

  return {
    rollback,
    getVersion,
    isLoading,
    error,
    result,
  };
}

export function useSchemaVersion(projectId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const getVersion = useCallback(
    async (version: string) => {
      if (!projectId) return null;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/rollback/${projectId}?version=${version}`, {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Version not found");
        }

        return await response.json();
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, supabase]
  );

  return { getVersion, isLoading, error };
}
