/**
 * @fileoverview API client utilities for frontend-backend communication.
 * 
 * Reasoning:
 * - Centralized API calls with error handling
 * - Type-safe request/response interfaces
 * - Consistent error format across all API routes
 * 
 * Dependencies:
 * - types/schema for CRM schema types
 */

import type { CRMSchema } from "@/types/schema"

export interface GenerateSchemaRequest {
    prompt: string
    project_id?: string
}

export interface GenerateSchemaResponse {
    schema: CRMSchema
    decision_trace_id: string
    validation_warnings: string[]
    message: string
}

export interface ProvisionSchemaRequest {
    schema_json: CRMSchema
    project_id: string
}

export interface ProvisionSchemaResponse {
    success: boolean
    migration_applied: boolean
    tables_created: string[]
    rls_policies_created: number
    vibe_config_id: string
    message: string
}

export interface APIError {
    error: string
    details?: any
}

/**
 * Generate CRM schema from natural language prompt
 */
export async function generateSchema(
    prompt: string,
    projectId?: string
): Promise<GenerateSchemaResponse> {
    const response = await fetch("/api/v1/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            prompt,
            project_id: projectId,
        } as GenerateSchemaRequest),
    })

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to generate schema")
    }

    return response.json()
}

/**
 * Provision validated schema to database
 */
export async function provisionSchema(
    schema: CRMSchema,
    projectId: string
): Promise<ProvisionSchemaResponse> {
    const response = await fetch("/api/v1/provision", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            schema_json: schema,
            project_id: projectId,
        } as ProvisionSchemaRequest),
    })

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to provision schema")
    }

    return response.json()
}

/**
 * Fetch AI decision history for a project
 */
export async function getVibeReplay(projectId: string) {
    const response = await fetch(`/api/v1/vibe-replay/${projectId}`)

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to fetch vibe replay")
    }

    return response.json()
}

// ============================================================================
// PROJECTS API
// ============================================================================

export interface Project {
    id: string
    name: string
    description?: string
    created_at: string
    updated_at: string
    active_schema_version?: string | null
    schema_count?: number
}

export interface CreateProjectRequest {
    name: string
    description?: string
}

export interface UpdateProjectRequest {
    name?: string
    description?: string
}

/**
 * Get all user projects
 */
export async function getProjects(): Promise<{ projects: Project[]; total: number }> {
    const response = await fetch("/api/v1/projects")

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to fetch projects")
    }

    return response.json()
}

/**
 * Get single project by ID
 */
export async function getProject(id: string): Promise<{ project: Project }> {
    const response = await fetch(`/api/v1/projects/${id}`)

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to fetch project")
    }

    return response.json()
}

/**
 * Create new project
 */
export async function createProject(
    data: CreateProjectRequest
): Promise<{ project: Project; message: string }> {
    const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to create project")
    }

    return response.json()
}

/**
 * Update existing project
 */
export async function updateProject(
    id: string,
    data: UpdateProjectRequest
): Promise<{ project: Project; message: string }> {
    const response = await fetch(`/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to update project")
    }

    return response.json()
}

/**
 * Delete project
 */
export async function deleteProject(id: string): Promise<{
    success: boolean
    message: string
    deleted_tables: string[]
}> {
    const response = await fetch(`/api/v1/projects/${id}`, {
        method: "DELETE",
    })

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to delete project")
    }

    return response.json()
}

// ============================================================================
// SCHEMA LOCK API
// ============================================================================

export interface LockResponse {
    lock_acquired: boolean
    lock_extended?: boolean
    lock_id?: string
    expires_at: string
    locked_by: string
    message?: string
}

export interface LockStatus {
    is_locked: boolean
    locked_by?: string
    is_own_lock?: boolean
    expires_at?: string
    locked_at?: string
    message?: string
}

/**
 * Acquire schema lock for editing
 */
export async function acquireSchemaLock(
    projectId: string,
    durationMinutes = 5
): Promise<LockResponse> {
    const response = await fetch(`/api/v1/schema-lock/${projectId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ duration_minutes: durationMinutes }),
    })

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to acquire schema lock")
    }

    return response.json()
}

/**
 * Release schema lock
 */
export async function releaseSchemaLock(
    projectId: string
): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/v1/schema-lock/${projectId}`, {
        method: "DELETE",
    })

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to release schema lock")
    }

    return response.json()
}

/**
 * Check schema lock status
 */
export async function checkSchemaLock(projectId: string): Promise<LockStatus> {
    const response = await fetch(`/api/v1/schema-lock/${projectId}`)

    if (!response.ok) {
        const error: APIError = await response.json()
        throw new Error(error.error || "Failed to check schema lock")
    }

    return response.json()
}

