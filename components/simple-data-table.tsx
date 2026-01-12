/**
 * @fileoverview Simple data table component for displaying and managing records.
 * 
 * Reasoning:
 * - Displays data from any table using useTableData hook
 * - Shows columns dynamically from schema
 * - Provides Add/Edit/Delete actions
 * - Basic pagination
 * 
 * Dependencies:
 * - lib/hooks/use-table-data for data operations
 * - components/simple-crud-dialog for record forms
 */

"use client"

import { useState } from "react"
import { useTableData } from "@/lib/hooks/use-table-data"
import { SimpleCrudDialog } from "@/components/simple-crud-dialog"
import { ColumnHeader } from "@/components/column-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type { TableDefinition } from "@/types/schema"

interface SimpleDataTableProps {
    tableSchema: TableDefinition
}

export function SimpleDataTable({ tableSchema }: SimpleDataTableProps) {
    const {
        data,
        isLoading,
        error,
        pagination,
        sorting,
        setSorting,
        nextPage,
        prevPage,
        deleteRecord,
    } = useTableData(tableSchema.name)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null)

    // Get visible columns (exclude audit fields)
    const visibleColumns = tableSchema.columns.filter(
        col => !['id', 'user_id', 'created_at', 'updated_at'].includes(col.name)
    )

    // Handle delete with confirmation
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return

        try {
            await deleteRecord(id)
            toast.success("Record deleted successfully")
        } catch (err) {
            toast.error("Failed to delete record: " + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    // Handle sort
    const handleSort = (columnName: string) => {
        if (sorting?.column === columnName) {
            // Toggle direction
            setSorting({
                column: columnName,
                direction: sorting.direction === 'asc' ? 'desc' : 'asc'
            })
        } else {
            // New column, default to asc
            setSorting({
                column: columnName,
                direction: 'asc'
            })
        }
    }

    // Render cell value based on column type
    const renderCellValue = (value: unknown, columnType: string) => {
        if (value === null || value === undefined) {
            return <span className="text-muted-foreground">—</span>
        }

        switch (columnType) {
            case 'BOOLEAN':
                return <span className="text-sm">{value ? '✓ Yes' : '✗ No'}</span>
            case 'TIMESTAMPTZ':
                return <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(value as string | Date), { addSuffix: true })}
                </span>
            case 'NUMERIC':
                return <span className="text-sm font-mono">{Number(value).toLocaleString()}</span>
            default:
                return <span className="text-sm">{String(value).substring(0, 50)}</span>
        }
    }

    if (error) {
        return (
            <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
                <p className="text-muted-foreground">{error.message}</p>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {pagination.total} record{pagination.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {tableSchema.ui_hints?.label || tableSchema.name}
                </Button>
            </div>

            {/* Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.map(col => (
                                <TableHead key={col.name}>
                                    <ColumnHeader
                                        column={col}
                                        sorting={sorting}
                                        onSort={() => handleSort(col.name)}
                                    />
                                </TableHead>
                            ))}
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-12">
                                    <p className="text-muted-foreground">No records yet</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setIsCreateOpen(true)}
                                        className="mt-2"
                                    >
                                        Create your first record
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((record) => (
                                <TableRow key={record.id}>
                                    {visibleColumns.map(col => (
                                        <TableCell key={col.name}>
                                            {renderCellValue(record[col.name], col.type)}
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingRecord(record)}
                                                aria-label="Edit record"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(record.id)}
                                                aria-label="Delete record"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-400" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Pagination */}
            {pagination.total > pagination.pageSize && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={prevPage}
                            disabled={pagination.page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={nextPage}
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* CRUD Dialogs */}
            <SimpleCrudDialog
                mode="create"
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                tableSchema={tableSchema}
            />

            {editingRecord && (
                <SimpleCrudDialog
                    mode="edit"
                    open={!!editingRecord}
                    onOpenChange={(open) => !open && setEditingRecord(null)}
                    tableSchema={tableSchema}
                    record={editingRecord}
                />
            )}
        </div>
    )
}
