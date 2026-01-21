/**
 * @fileoverview Dashboard homepage showing project overview and dynamic tables.
 * 
 * Reasoning:
 * - Landing page after accessing dashboard
 * - Shows active project info from ProjectProvider
 * - Dynamically lists tables from active schema
 * - Links to dynamic table views
 * 
 * Dependencies:
 * - lib/hooks/use-project for project data
 */

"use client"

import { useProject } from "@/lib/hooks/use-project"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Loader2, Database, Table as TableIcon } from "lucide-react"
import Link from "next/link"
import { ExportCodeDialog } from "@/components/export-code-dialog";

export default function DashboardPage() {
    const { currentProject, activeSchema, isLoading, error } = useProject()

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-400">Error Loading Dashboard</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()}>
                            Reload Page
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!currentProject || !activeSchema) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <CardTitle>No Active Project</CardTitle>
                        <CardDescription>
                            Create a project and generate a schema to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/">
                            <Button>Generate Schema</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{currentProject.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {currentProject.description || "Manage your CRM data"}
                    </p>
                </div>
                <ExportCodeDialog 
                    projectId={currentProject.id} 
                    projectName={currentProject.name} 
                />
            </div>

            {/* Schema Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Schema</CardTitle>
                    <CardDescription>
                        Version {activeSchema.version} • {activeSchema.tables.length} tables
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Tables Grid */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Your Tables</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeSchema.tables.map((table) => {
                        const pluralName = table.name.endsWith("s") ? table.name : `${table.name}s`;
                        return (
                            <Link
                                key={table.name}
                                href={`/dynamic/${pluralName}`}
                            >
                                <Card className="hover:border-blue-500/50 transition-colors cursor-pointer">
                                    <CardHeader>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${table.ui_hints?.color || 'bg-blue-500/10'}`}>
                                                <TableIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {table.ui_hints?.label || table.name}
                                                </CardTitle>
                                                <CardDescription className="text-sm">
                                                    {table.columns.length} columns
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    )
}
