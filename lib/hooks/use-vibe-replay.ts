/**
 * @fileoverview Vibe Replay Hook
 *
 * Reasoning:
 * - Manages fetching and displaying AI decision history
 * - Provides timeline view of schema evolution
 * - Supports schema version comparison
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface DecisionTrace {
  id: string;
  project_id: string;
  user_id: string;
  intent: string;
  action: string;
  precedent?: string;
  version: string;
  timestamp: string;
  schema_before?: Record<string, unknown>;
  schema_after?: Record<string, unknown>;
}

export interface SchemaVersion {
  schema_version: string;
  created_at: string;
  is_active: boolean;
}

export interface VibeReplayData {
  traces: DecisionTrace[];
  schema_versions: SchemaVersion[];
  current_schema: Record<string, unknown> | null;
}

export function useVibeReplay(projectId: string | null) {
  const supabase = createClient();
  const [data, setData] = useState<VibeReplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVibeReplay = useCallback(async () => {
    if (!projectId) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/vibe-replay/${projectId}`, {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch Vibe Replay data");
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
      console.error("Vibe Replay fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => {
    fetchVibeReplay();
  }, [fetchVibeReplay]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchVibeReplay,
  };
}
