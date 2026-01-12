/**
 * @fileoverview Schema Version Manager
 * 
 * Reasoning:
 * - Track all schema changes (Vibe Replay)
 * - Enable rollback to previous versions
 * - Compare versions
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ProjectPlan } from "@/lib/code-generator/schemas";

export interface SchemaVersion {
  id: string;
  project_id: string | null;
  user_id: string;
  version: string;
  schema_snapshot: ProjectPlan;
  change_description: string;
  created_at: string;
}

export interface CreateVersionInput {
  projectId?: string;
  userId: string;
  schema: ProjectPlan;
  changeDescription?: string;
}

export async function createVersion(input: CreateVersionInput): Promise<SchemaVersion | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("schema_versions")
      .insert({
        project_id: input.projectId || null,
        user_id: input.userId,
        version: input.schema.version || generateVersionNumber(),
        schema_snapshot: input.schema,
        change_description: input.changeDescription || "Schema update",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create schema version:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error creating schema version:", err);
    return null;
  }
}

export async function getVersion(versionId: string): Promise<SchemaVersion | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("schema_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getProjectVersions(projectId: string, limit = 20): Promise<SchemaVersion[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("schema_versions")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getUserVersions(userId: string, limit = 50): Promise<SchemaVersion[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("schema_versions")
      .select("*")
      .eq("user_id", userId)
      .is("project_id", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function getLatestVersion(userId: string, projectId?: string): Promise<SchemaVersion | null> {
  try {
    let query = supabaseAdmin
      .from("schema_versions")
      .select("*")
      .eq("user_id", userId);

    if (projectId) {
      query = query.eq("project_id", projectId);
    } else {
      query = query.is("project_id", null);
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function rollbackToVersion(versionId: string): Promise<ProjectPlan | null> {
  try {
    const version = await getVersion(versionId);
    if (!version) {
      return null;
    }

    return version.schema_snapshot as ProjectPlan;
  } catch {
    return null;
  }
}

export async function compareVersions(versionId1: string, versionId2: string): Promise<{
  added: string[];
  removed: string[];
  modified: Array<{ field: string; oldType: string; newType: string }>;
} | null> {
  try {
    const [v1, v2] = await Promise.all([
      getVersion(versionId1),
      getVersion(versionId2),
    ]);

    if (!v1 || !v2) {
      return null;
    }

    const schema1 = v1.schema_snapshot as ProjectPlan;
    const schema2 = v2.schema_snapshot as ProjectPlan;

    const resources1 = new Set(schema1.resources.map(r => r.name));
    const resources2 = new Set(schema2.resources.map(r => r.name));

    const added = schema2.resources.filter(r => !resources1.has(r.name)).map(r => r.name);
    const removed = schema1.resources.filter(r => !resources2.has(r.name)).map(r => r.name);

    return { added, removed, modified: [] };
  } catch {
    return null;
  }
}

function generateVersionNumber(): string {
  const now = new Date();
  return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.${Math.floor(Date.now() / 1000) % 10000}`;
}

export async function deleteVersionsByProject(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("schema_versions")
      .delete()
      .eq("project_id", projectId);

    return !error;
  } catch {
    return false;
  }
}

export async function getVersionCount(userId: string): Promise<number> {
  try {
    const { count } = await supabaseAdmin
      .from("schema_versions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return count || 0;
  } catch {
    return 0;
  }
}
