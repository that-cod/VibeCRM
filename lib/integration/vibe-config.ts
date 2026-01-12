/**
 * @fileoverview Vibe Config Storage
 * 
 * Reasoning:
 * - Stores generated schemas in Supabase for persistence
 * - Retrieves schemas by user or project
 * - Manages active schema versions
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ProjectPlan } from "@/lib/code-generator/schemas";

export interface VibeConfigRecord {
  id: string;
  project_id: string | null;
  user_id: string;
  schema_version: string;
  schema_json: ProjectPlan;
  is_active: boolean;
  created_at: string;
}

export interface SaveConfigOptions {
  userId: string;
  projectId?: string;
  schema: ProjectPlan;
  isActive?: boolean;
}

export async function saveVibeConfig(options: SaveConfigOptions): Promise<VibeConfigRecord | null> {
  const { userId, projectId, schema, isActive = true } = options;

  try {
    const { data, error } = await supabaseAdmin
      .from("vibe_configs")
      .insert({
        project_id: projectId || null,
        user_id: userId,
        schema_version: schema.version || "1.0.0",
        schema_json: schema,
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save vibe config:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error saving vibe config:", err);
    return null;
  }
}

export async function getActiveConfigByUser(userId: string): Promise<VibeConfigRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("vibe_configs")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Failed to get active config:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error getting active config:", err);
    return null;
  }
}

export async function getConfigById(configId: string): Promise<VibeConfigRecord | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("vibe_configs")
      .select("*")
      .eq("id", configId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function getConfigsByUser(userId: string, limit = 20): Promise<VibeConfigRecord[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("vibe_configs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get configs:", error);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

export async function deactivateConfigsByUser(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("vibe_configs")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteConfig(configId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("vibe_configs")
      .delete()
      .eq("id", configId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Extract resources from a config's schema_json
 */
export function extractResourcesFromConfig(config: VibeConfigRecord): Array<{
  name: string;
  plural_name: string;
  singular_label: string;
  plural_label: string;
  description: string;
  icon: string;
  fields_count: number;
}> {
  const schema = config.schema_json as ProjectPlan;
  if (!schema?.resources) {
    return [];
  }

  return schema.resources.map(resource => ({
    name: resource.name,
    plural_name: resource.plural_name,
    singular_label: resource.singular_label,
    plural_label: resource.plural_label,
    description: resource.description,
    icon: resource.icon,
    fields_count: resource.fields.length,
  }));
}

/**
 * Get all resources from user's active config
 */
export async function getActiveResources(userId: string) {
  const config = await getActiveConfigByUser(userId);
  if (!config) {
    return [];
  }
  return extractResourcesFromConfig(config);
}
