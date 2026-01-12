/**
 * @fileoverview Foreign key select dropdown with auto-loading options.
 * 
 * Reasoning:
 * - Loads data from referenced table
 * - Shows formatted display value instead of UUID
 * - Supports search/filter
 * 
 * Dependencies:
 * - lib/supabase/client for data fetching
 * - types/schema for column definition
 */

"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { ColumnDefinition } from "@/types/schema"

interface ForeignKeySelectProps {
    column: ColumnDefinition
    value: string | null
    onChange: (value: string | null) => void
    required?: boolean
}

export function ForeignKeySelect({ column, value, onChange, required }: ForeignKeySelectProps) {
    const [options, setOptions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()
    const referencedTable = column.references?.table

    useEffect(() => {
        async function loadOptions() {
            if (!referencedTable) return

            try {
                setIsLoading(true)
                setError(null)

                const { data, error: fetchError } = await supabase
                    .from(referencedTable)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100)

                if (fetchError) throw fetchError

                setOptions(data || [])
            } catch (err) {
                console.error('Failed to load foreign key options:', err)
                setError(err instanceof Error ? err.message : 'Failed to load options')
            } finally {
                setIsLoading(false)
            }
        }

        loadOptions()
    }, [referencedTable])

    // Get display value for an option (try common name fields)
    const getDisplayValue = (option: any): string => {
        if (!option) return 'Unknown'

        // Try common display fields
        const displayFields = ['name', 'title', 'label', 'display_name', 'first_name', 'email']
        for (const field of displayFields) {
            if (option[field]) {
                // For names, combine first_name and last_name if both exist
                if (field === 'first_name' && option.last_name) {
                    return `${option.first_name} ${option.last_name}`
                }
                return String(option[field])
            }
        }

        // Fall back to ID
        return option.id?.substring(0, 8) || 'Unknown'
    }

    const displayName = column.ui_hints?.display_name || column.name

    if (error) {
        return (
            <div className="space-y-2">
                <Label>{displayName}</Label>
                <p className="text-sm text-red-400">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <Label htmlFor={`fk-${column.name}`}>
                {displayName}
                {required && <span className="text-red-400 ml-1">*</span>}
            </Label>
            <select
                id={`fk-${column.name}`}
                value={value || ''}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={isLoading}
                required={required}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <option value="">
                    {isLoading ? 'Loading...' : '-- Select --'}
                </option>
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {getDisplayValue(option)}
                    </option>
                ))}
            </select>
            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading {referencedTable}...
                </div>
            )}
        </div>
    )
}
