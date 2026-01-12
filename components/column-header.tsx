/**
 * @fileoverview Sortable column header with sort indicators.
 * 
 * Reasoning:
 * - Click to toggle sort direction
 * - Shows visual indicators for current sort state
 * - Accessible and keyboard-friendly
 * 
 * Dependencies:
 * - types/schema for column definition
 */

"use client"

import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ColumnDefinition } from "@/types/schema"
import type { Sorting } from "@/lib/hooks/use-table-data"

interface ColumnHeaderProps {
    column: ColumnDefinition
    sorting: Sorting | null
    onSort: () => void
    className?: string
}

export function ColumnHeader({ column, sorting, onSort, className }: ColumnHeaderProps) {
    const displayName = column.ui_hints?.display_name || column.name
    const isSorted = sorting?.column === column.name
    const direction = isSorted ? sorting.direction : null

    return (
        <button
            onClick={onSort}
            className={cn(
                "flex items-center gap-2 font-medium text-left hover:text-foreground transition-colors",
                className
            )}
        >
            <span>{displayName}</span>
            {isSorted ? (
                direction === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                ) : (
                    <ArrowDown className="h-4 w-4" />
                )
            ) : (
                <ArrowUpDown className="h-4 w-4 opacity-50" />
            )}
        </button>
    )
}
