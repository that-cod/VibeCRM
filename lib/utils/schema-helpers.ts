/**
 * @fileoverview Schema parsing and helper utilities.
 * 
 * Reasoning:
 * - Common schema operations used across components
 * - Type guards and validators
 * - Column prioritization logic
 * 
 * Dependencies:
 * - types/schema for type definitions
 */

import type { TableDefinition, ColumnDefinition } from "@/types/schema"

/**
 * Get display name for a column
 */
export function getColumnDisplayName(column: ColumnDefinition): string {
    return column.ui_hints?.display_name || column.name
}

/**
 * Get primary display field for a table (used for card titles, etc.)
 */
export function getPrimaryDisplayField(table: TableDefinition): string | null {
    // Look for name-like fields first
    const nameFields = ['name', 'title', 'label', 'display_name']
    for (const fieldName of nameFields) {
        const found = table.columns.find(col => col.name === fieldName)
        if (found) return fieldName
    }

    // Fall back to first non-system TEXT field
    const textColumn = table.columns.find(
        col => col.type === 'TEXT' &&
            !['id', 'user_id', 'created_at', 'updated_at'].includes(col.name)
    )

    return textColumn?.name || null
}

/**
 * Get columns sorted by mobile priority
 */
export function getColumnsByPriority(table: TableDefinition): ColumnDefinition[] {
    return [...table.columns].sort((a, b) => {
        const priorityA = a.ui_hints?.mobile_priority || 999
        const priorityB = b.ui_hints?.mobile_priority || 999
        return priorityA - priorityB
    })
}

/**
 * Get only high-priority columns for mobile view
 */
export function getHighPriorityColumns(table: TableDefinition): ColumnDefinition[] {
    return table.columns.filter(col => {
        const priority = col.ui_hints?.mobile_priority || 999
        return priority <= 2 && !['id', 'user_id', 'created_at', 'updated_at'].includes(col.name)
    })
}

/**
 * Check if column is a foreign key
 */
export function isForeignKey(column: ColumnDefinition): boolean {
    return !!column.references && column.type === 'UUID'
}

/**
 * Check if column is required
 */
export function isRequired(column: ColumnDefinition): boolean {
    return !column.nullable
}

/**
 * Get columns that should be shown in table views (exclude system fields)
 */
export function getDisplayColumns(table: TableDefinition): ColumnDefinition[] {
    return table.columns.filter(
        col => !['id', 'user_id', 'created_at', 'updated_at'].includes(col.name)
    )
}

/**
 * Get columns that can be edited in forms (exclude system + primary key)
 */
export function getEditableColumns(table: TableDefinition): ColumnDefinition[] {
    return table.columns.filter(
        col => !['id', 'user_id', 'created_at', 'updated_at'].includes(col.name)
    )
}

/**
 * Find table in schema by name
 */
export function findTableByName(tables: TableDefinition[], name: string): TableDefinition | undefined {
    return tables.find(t => t.name === name)
}

/**
 * Get input type for HTML input based on column
 */
export function getInputType(column: ColumnDefinition): string {
    // Check UI hints first
    if (column.ui_hints?.type) {
        const type = column.ui_hints.type
        if (['email', 'url', 'tel', 'textarea'].includes(type)) {
            return type
        }
    }

    // Map column types to input types
    switch (column.type) {
        case 'INTEGER':
        case 'NUMERIC':
            return 'number'
        case 'BOOLEAN':
            return 'checkbox'
        case 'DATE':
            return 'date'
        case 'TIMESTAMPTZ':
            return 'datetime-local'
        default:
            return 'text'
    }
}
