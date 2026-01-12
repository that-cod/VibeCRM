/**
 * @fileoverview Dialog for creating new projects.
 * 
 * Reasoning:
 * - Modal form for project creation
 * - Validation and error handling
 * - Loading states during API calls
 * - Glassmorphism design matching app aesthetic
 * 
 * Dependencies:
 * - lib/api/client for project creation
 * - components/ui for shadcn components
 */

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createProject, type Project } from "@/lib/api/client"

interface CreateProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onProjectCreated: (project: Project) => void
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreated }: CreateProjectDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            setError("Project name is required")
            return
        }

        try {
            setIsCreating(true)
            setError(null)

            const { project } = await createProject({
                name: name.trim(),
                description: description.trim() || undefined,
            })

            onProjectCreated(project)

            // Reset form
            setName("")
            setDescription("")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create project")
        } finally {
            setIsCreating(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isCreating) {
            onOpenChange(newOpen)
            if (!newOpen) {
                // Reset form when closing
                setName("")
                setDescription("")
                setError(null)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="glass-dialog sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Create New Project</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Give your CRM project a name and description
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name *</Label>
                        <Input
                            id="name"
                            placeholder="My Awesome CRM"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isCreating}
                            className="bg-black/50 border-white/10"
                            maxLength={100}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="A brief description of your project..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isCreating}
                            className="bg-black/50 border-white/10 min-h-[100px]"
                            maxLength={500}
                        />
                        <p className="text-xs text-muted-foreground">
                            {description.length}/500 characters
                        </p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isCreating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isCreating || !name.trim()}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Project"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
