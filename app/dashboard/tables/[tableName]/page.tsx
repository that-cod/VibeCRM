/**
 * @fileoverview Dynamic table view page that displays data for any schema table.
 * 
 * Reasoning:
 * - Works with any table from the active schema
 * - Fetches table definition from schema
 * - Passes to data table component for rendering
 * 
 * Dependencies:
 * - lib/hooks/use-project for schema access
 * - components/simple-data-table for data display
 */

"use client"

import { useProject } from "@/lib/hooks/use-project"
import { SimpleDataTable } from "@/components/simple-data-table"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface TablePageProps {
    params: Promise<{ tableName: string }>
}

export default function TablePage({ params }: TablePageProps) {
    const [tableName, setTableName] = React.useState<string | null>(null)
    const { activeSchema, isLoading, error } = useProject()

    // Unwrap params (Next.js 15 async params)
    React.useEffect(() => {
        params.then(p => setTableName(p.tableName))
    }, [params])

    if (isLoading || !tableName) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Error
                        </CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Find table definition in schema
    const tableSchema = activeSchema?.tables.find(t => t.name === tableName)

    if (!tableSchema) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Table Not Found</CardTitle>
                        <CardDescription>
                            The table "{tableName}" does not exist in your active schema.
                        </CardDescription>
                        <div className="mt-4">
                            <Link href="/dashboard">
                                <Button>Back to Dashboard</Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">
                    {tableSchema.ui_hints?.label || tableName}
                </h1>
                {tableSchema.ui_hints?.description && (
                    <p className="text-muted-foreground mt-1">
                        {tableSchema.ui_hints.description}
                    </p>
                )}
            </div>

            {/* Data Table */}
            <SimpleDataTable tableSchema={tableSchema} />
        </div>
    )
}

// Add React import at top
import * as React from "react"
