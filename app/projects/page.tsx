/**
 * @fileoverview Projects list page with create/manage functionality.
 * 
 * Reasoning:
 * - Central hub for managing user's CRM projects
 * - Glassmorphism design matching homepage aesthetic
 * - Responsive grid layout for project cards
 * - Quick access to project actions
 * 
 * Dependencies:
 * - lib/api/client for projects API calls
 * - components/create-project-dialog for project creation
 * - components/project-card for individual project display
 */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FluidBackground } from "@/components/fluid-background"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { getProjects, type Project } from "@/lib/api/client"
import { ProjectCard } from "@/components/project-card"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export default function ProjectsPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const data = await getProjects()
            setProjects(data.projects)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load projects")
        } finally {
            setIsLoading(false)
        }
    }

    const handleProjectCreated = (newProject: Project) => {
        setProjects(prev => [newProject, ...prev])
        setShowCreateDialog(false)
    }

    const handleProjectDeleted = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId))
    }

    return (
        <main className="min-h-screen relative font-sans text-white">
            <FluidBackground />

            <div className="relative z-10 container mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">Your Projects</h1>
                        <p className="text-muted-foreground text-lg">
                            Manage your CRM projects and schemas
                        </p>
                    </div>
                    <Button
                        size="lg"
                        onClick={() => setShowCreateDialog(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 w-full md:w-auto"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        New Project
                    </Button>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="glass-container p-8 text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading your projects...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="glass-container p-8 border-red-500/20 bg-red-500/5">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Button variant="outline" onClick={loadProjects}>
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && projects.length === 0 && (
                    <div className="glass-container p-12 text-center max-w-2xl mx-auto">
                        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
                        <p className="text-muted-foreground mb-6">
                            Create your first project to start building your CRM
                        </p>
                        <Button
                            size="lg"
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                        >
                            <Plus className="mr-2 h-5 w-5" />
                            Create Project
                        </Button>
                    </div>
                )}

                {/* Projects Grid */}
                {!isLoading && !error && projects.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onDeleted={() => handleProjectDeleted(project.id)}
                                onUpdated={loadProjects}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Project Dialog */}
            <CreateProjectDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onProjectCreated={handleProjectCreated}
            />
        </main>
    )
}
