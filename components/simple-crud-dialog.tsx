/**
 * @fileoverview Simple CRUD dialog for creating and editing records.
 * 
 * Reasoning:
 * - Auto-generates form fields from table schema
 * - Handles both create and edit modes
 * - React Hook Form for validation
 * - Submits to Supabase via useTableData hook
 * 
 * Dependencies:
 * - react-hook-form for form management
 * - lib/hooks/use-table-data for data operations
 */

"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTableData } from "@/lib/hooks/use-table-data"
import { ForeignKeySelect } from "@/components/foreign-key-select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { TableDefinition, ColumnDefinition } from "@/types/schema"

interface SimpleCrudDialogProps {
    mode: 'create' | 'edit'
    open: boolean
    onOpenChange: (open: boolean) => void
    tableSchema: TableDefinition
    record?: Record<string, unknown>
}

export function SimpleCrudDialog({
    mode,
    open,
    onOpenChange,
    tableSchema,
    record,
}: SimpleCrudDialogProps) {
    const { createRecord, updateRecord } = useTableData(tableSchema.name, { autoLoad: false })
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

    // Reset form when dialog opens with record data
    useEffect(() => {
        if (open && mode === 'edit' && record) {
            reset(record)
        } else if (open && mode === 'create') {
            reset({})
        }
    }, [open, mode, record, reset])

    const onSubmit = async (data: Record<string, unknown>) => {
        try {
            if (mode === 'create') {
                await createRecord(data)
                toast.success(`${tableSchema.ui_hints?.label || tableSchema.name} created successfully`)
            } else {
                await updateRecord(record!.id as string, data)
                toast.success(`${tableSchema.ui_hints?.label || tableSchema.name} updated successfully`)
            }
            onOpenChange(false)
            reset()
        } catch (err) {
            toast.error(`Failed to ${mode} record: ` + (err instanceof Error ? err.message : "Unknown error"))
        }
    }

    // Get editable columns (exclude system fields)
    const editableColumns = tableSchema.columns.filter(
        col => !['id', 'user_id', 'created_at', 'updated_at'].includes(col.name)
    )

    // Render form field based on column type
    const renderField = (column: ColumnDefinition) => {
        const fieldId = `field-${column.name}`
        const isRequired = !column.nullable

        // Foreign key select
        if (column.references && column.type === 'UUID') {
            return (
                <ForeignKeySelect
                    key={column.name}
                    column={column}
                    value={(record && record[column.name]) as string | null || null}
                    onChange={(value) => {
                        // Handle foreign key value change if needed
                    }}
                    required={isRequired}
                />
            )
        }

        // Textarea for long text
        if (column.ui_hints?.type === 'textarea') {
            return (
                <div key={column.name} className="space-y-2">
                    <Label htmlFor={fieldId}>
                        {column.ui_hints?.display_name || column.name}
                        {isRequired && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    <Textarea
                        id={fieldId}
                        {...register(column.name, { required: isRequired })}
                        placeholder={`Enter ${column.ui_hints?.display_name || column.name}`}
                    />
                </div>
            )
        }

        // Checkbox for boolean
        if (column.type === 'BOOLEAN') {
            return (
                <div key={column.name} className="flex items-center space-x-2">
                    <Checkbox
                        id={fieldId}
                        {...register(column.name)}
                    />
                    <Label htmlFor={fieldId}>
                        {column.ui_hints?.display_name || column.name}
                    </Label>
                </div>
            )
        }

        // Number input for numeric fields
        if (column.type === 'NUMERIC' || column.type === 'INTEGER') {
            return (
                <div key={column.name} className="space-y-2">
                    <Label htmlFor={fieldId}>
                        {column.ui_hints?.display_name || column.name}
                        {isRequired && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    <Input
                        id={fieldId}
                        type="number"
                        step={column.type === 'NUMERIC' ? '0.01' : '1'}
                        {...register(column.name, {
                            required: isRequired,
                            valueAsNumber: true
                        })}
                        placeholder={`Enter ${column.ui_hints?.display_name || column.name}`}
                    />
                </div>
            )
        }

        // Date input for timestamps
        if (column.type === 'TIMESTAMPTZ' || column.type === 'DATE') {
            return (
                <div key={column.name} className="space-y-2">
                    <Label htmlFor={fieldId}>
                        {column.ui_hints?.display_name || column.name}
                        {isRequired && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    <Input
                        id={fieldId}
                        type="datetime-local"
                        {...register(column.name, { required: isRequired })}
                    />
                </div>
            )
        }

        // Default text input
        return (
            <div key={column.name} className="space-y-2">
                <Label htmlFor={fieldId}>
                    {column.ui_hints?.display_name || column.name}
                    {isRequired && <span className="text-red-400 ml-1">*</span>}
                </Label>
                <Input
                    id={fieldId}
                    type={column.ui_hints?.type === 'email' ? 'email' :
                        column.ui_hints?.type === 'url' ? 'url' :
                            column.ui_hints?.type === 'phone' ? 'tel' : 'text'}
                    {...register(column.name, { required: isRequired })}
                    placeholder={`Enter ${column.ui_hints?.display_name || column.name}`}
                />
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Create' : 'Edit'} {tableSchema.ui_hints?.label || tableSchema.name}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? `Add a new record to ${tableSchema.ui_hints?.label || tableSchema.name}`
                            : `Update the selected record`
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {editableColumns.map(renderField)}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                                </>
                            ) : (
                                mode === 'create' ? 'Create' : 'Update'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
