/**
 * @fileoverview Project Manager
 * 
 * Reasoning:
 * - CRUD operations for projects
 * - Link projects to users and schemas
 * - Manage project settings
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import type { ProjectPlan } from "@/lib/code-generator/schemas";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  current_schema_version: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export async function createProject(input: CreateProjectInput): Promise<Project | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .insert({
        user_id: input.userId,
        name: input.name,
        description: input.description || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create project:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Error creating project:", err);
    return null;
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getUserProjects(userId: string, limit = 20): Promise<Project[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Failed to get projects:", error);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

export async function updateProject(projectId: string, input: UpdateProjectInput): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("projects")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return !error;
  } catch {
    return false;
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", projectId);

    return !error;
  } catch {
    return false;
  }
}

export async function getProjectStats(userId: string): Promise<{
  total_projects: number;
  active_projects: number;
  total_resources: number;
}> {
  try {
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("id, is_active")
      .eq("user_id", userId);

    if (!projects) {
      return { total_projects: 0, active_projects: 0, total_resources: 0 };
    }

    // Get vibe configs count for this user
    const { count: configsCount } = await supabaseAdmin
      .from("vibe_configs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return {
      total_projects: projects.length,
      active_projects: projects.filter(p => p.is_active).length,
      total_resources: configsCount || 0,
    };
  } catch {
    return { total_projects: 0, active_projects: 0, total_resources: 0 };
  }
}

export async function activateProject(projectId: string, userId: string): Promise<boolean> {
  try {
    // First deactivate all user's projects
    await supabaseAdmin
      .from("projects")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("is_active", true);

    // Then activate the specified project
    const { error } = await supabaseAdmin
      .from("projects")
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    return !error;
  } catch {
    return false;
  }
}
