/**
 * @fileoverview Individual record detail page.
 * 
 * Reasoning:
 * - Shows full details of a single record
 * - Edit and delete actions
 * - Related records display (future)
 * 
 * Dependencies:
 * - lib/hooks/use-table-data for record operations
 * - lib/hooks/use-project for schema access
 */

"use client"

import * as React from "react"
import { useProject } from "@/lib/hooks/use-project"
import { useTableData } from "@/lib/hooks/use-table-data"
import { SimpleCrudDialog } from "@/components/simple-crud-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, Pencil, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { getColumnDisplayName } from "@/lib/utils/schema-helpers"

interface RecordDetailPageProps {
    params: Promise<{
        tableName: string
        recordId: string
    }>
}

export default function RecordDetailPage({ params }: RecordDetailPageProps) {
    const [routeParams, setRouteParams] = React.useState<{ tableName: string; recordId: string } | null>(null)
    const { activeSchema, isLoading: schemaLoading } = useProject()
    const router = useRouter()

    // Unwrap async params
    React.useEffect(() => {
        params.then(p => setRouteParams(p))
    }, [params])

    const tableSchema = routeParams ? activeSchema?.tables.find(t => t.name === routeParams.tableName) : null
    const { data, isLoading, deleteRecord } = useTableData(routeParams?.tableName || '', { autoLoad: false })

    const [record, setRecord] = React.useState<Record<string, unknown> | null>(null)
    const [isEditOpen, setIsEditOpen] = React.useState(false)

    // Fetch single record
    React.useEffect(() => {
        if (!routeParams || !tableSchema) return

        const fetchRecord = async () => {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()

            const { data, error } = await supabase
                .from(routeParams.tableName)
                .select('*')
                .eq('id', routeParams.recordId)
                .single()

            if (!error && data) {
                setRecord(data)
            }
        }

        fetchRecord()
    }, [routeParams, tableSchema])

    if (schemaLoading || !routeParams) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!tableSchema) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">Table not found</p>
            </div>
        )
    }

    if (!record) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this record?")) return

        try {
            await deleteRecord(record.id as string)
            toast.success("Record deleted successfully")
            router.push(`/dashboard/tables/${routeParams.tableName}`)
        } catch (err) {
            toast.error("Failed to delete record: " + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    const displayColumns = tableSchema.columns.filter(
        col => !['id', 'user_id'].includes(col.name)
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={`/dashboard/tables/${routeParams.tableName}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {tableSchema.ui_hints?.label || tableSchema.name} Detail
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </div>

            {/* Record Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayColumns.map((column) => (
                            <div key={column.name} className="space-y-1">
                                <dt className="text-sm font-medium text-muted-foreground">
                                    {getColumnDisplayName(column)}
                                </dt>
                                <dd className="text-sm">
                                    {(() => {
                                        const value = record?.[column.name];
                                        if (column.type === 'BOOLEAN') {
                                            return value ? '✓ Yes' : '✗ No';
                                        }
                                        if (column.type === 'TIMESTAMPTZ') {
                                            return value ? (
                                                <span className="text-muted-foreground">
                                                    {formatDistanceToNow(new Date(value as string | Date), { addSuffix: true })}
                                                </span>
                                            ) : <span className="text-muted-foreground">—</span>;
                                        }
                                        return value ? <>{String(value)}</> : <span className="text-muted-foreground">—</span>;
                                    })()}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            {isEditOpen && (
                <SimpleCrudDialog
                    mode="edit"
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    tableSchema={tableSchema}
                    record={record}
                />
            )}
        </div>
    )
}
