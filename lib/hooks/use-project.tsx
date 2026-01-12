/**
 * @fileoverview Project context provider for managing active project and schema.
 * 
 * Reasoning:
 * - Global state for current project across dashboard
 * - Auto-loads active schema from vibe_configs
 * - Caches to avoid repeated database queries
 * - Provides project switching functionality
 * 
 * Dependencies:
 * - lib/api/client for project operations
 * - lib/supabase/client for schema fetching
 */

"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { getProjects, type Project } from "@/lib/api/client"
import type { CRMSchema } from "@/types/schema"

interface ProjectContextValue {
    currentProject: Project | null
    activeSchema: CRMSchema | null
    projects: Project[]
    isLoading: boolean
    error: string | null
    switchProject: (projectId: string) => Promise<void>
    refreshSchema: () => Promise<void>
    refreshProjects: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [currentProject, setCurrentProject] = useState<Project | null>(null)
    const [activeSchema, setActiveSchema] = useState<CRMSchema | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // Load projects and set default current project
    const loadProjects = async () => {
        try {
            const { projects: allProjects } = await getProjects()
            setProjects(allProjects)

            // Set first project as current if none selected
            if (!currentProject && allProjects.length > 0) {
                await switchProject(allProjects[0].id)
            }
        } catch (err) {
            console.error("Failed to load projects:", err)
            setError(err instanceof Error ? err.message : "Failed to load projects")
        }
    }

    // Load active schema for current project
    const loadActiveSchema = async (projectId: string) => {
        try {
            setIsLoading(true)
            setError(null)

            const { data: config, error: configError } = await supabase
                .from("vibe_configs")
                .select("schema_json")
                .eq("project_id", projectId)
                .eq("is_active", true)
                .single()

            if (configError) {
                throw new Error("No active schema found for this project")
            }

            setActiveSchema(config.schema_json as CRMSchema)
        } catch (err) {
            console.error("Failed to load schema:", err)
            setError(err instanceof Error ? err.message : "Failed to load schema")
            setActiveSchema(null)
        } finally {
            setIsLoading(false)
        }
    }

    // Switch to a different project
    const switchProject = async (projectId: string) => {
        const project = projects.find(p => p.id === projectId)
        if (!project) {
            setError("Project not found")
            return
        }

        setCurrentProject(project)
        await loadActiveSchema(projectId)
    }

    // Refresh active schema
    const refreshSchema = async () => {
        if (currentProject) {
            await loadActiveSchema(currentProject.id)
        }
    }

    // Refresh projects list
    const refreshProjects = async () => {
        await loadProjects()
    }

    // Initial load
    useEffect(() => {
        loadProjects()
    }, [])

    const value: ProjectContextValue = {
        currentProject,
        activeSchema,
        projects,
        isLoading,
        error,
        switchProject,
        refreshSchema,
        refreshProjects,
    }

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProject() {
    const context = useContext(ProjectContext)
    if (context === undefined) {
        throw new Error("useProject must be used within a ProjectProvider")
    }
    return context
}
