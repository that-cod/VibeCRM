/**
 * @fileoverview Project card component with glassmorphism design.
 * 
 * Reasoning:
 * - Displays project information in visually appealing card
 * - Quick actions for edit, delete, view schema
 * - Responsive design with hover effects
 * - Matches homepage glassmorphism aesthetic
 * 
 * Dependencies:
 * - lib/api/client for project operations
 * - components/ui for shadcn components
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Eye, Calendar, Loader2 } from "lucide-react"
import { deleteProject, type Project } from "@/lib/api/client"
import { formatDistanceToNow } from "date-fns"

interface ProjectCardProps {
    project: Project
    onDeleted: () => void
    onUpdated: () => void
}

export function ProjectCard({ project, onDeleted, onUpdated }: ProjectCardProps) {
    const router = useRouter()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleDelete = async () => {
        try {
            setIsDeleting(true)
            setError(null)
            await deleteProject(project.id)
            onDeleted()
            setShowDeleteDialog(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete project")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleView = () => {
        router.push(`/dashboard?project=${project.id}`)
    }

    const updatedAgo = formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })

    return (
        <>
            <Card className="glass-container hover:border-purple-500/30 transition-all duration-300 group cursor-pointer">
                <CardHeader onClick={handleView}>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-xl mb-1 group-hover:text-blue-400 transition-colors">
                                {project.name}
                            </CardTitle>
                            {project.active_schema_version && (
                                <Badge variant="outline" className="text-xs">
                                    v{project.active_schema_version}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {project.description && (
                        <CardDescription className="text-muted-foreground mt-2">
                            {project.description}
                        </CardDescription>
                    )}
                </CardHeader>

                <CardContent onClick={handleView}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Updated {updatedAgo}</span>
                    </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleView}
                        className="flex-1"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowDeleteDialog(true)
                        }}
                        className="hover:text-red-400"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="glass-dialog">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This will permanently delete <strong>{project.name}</strong> and all associated schemas and data.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDelete()
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Project"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
