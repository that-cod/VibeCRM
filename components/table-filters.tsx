/**
 * @fileoverview Table filters UI for dynamic filtering.
 * 
 * Reasoning:
 * - Search across all text columns
 * - Column-specific filters
 * - Visual filter chips
 * 
 * Dependencies:
 * - lib/hooks/use-table-data for filter types
 * - types/schema for table definition
 */

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Search, Filter } from "lucide-react"
import type { TableDefinition } from "@/types/schema"
import type { Filter as FilterType } from "@/lib/hooks/use-table-data"

interface TableFiltersProps {
    tableSchema: TableDefinition
    onSearchChange: (query: string) => void
    onFiltersChange: (filters: FilterType[]) => void
}

export function TableFilters({
    tableSchema,
    onSearchChange,
    onFiltersChange,
}: TableFiltersProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [activeFilters, setActiveFilters] = useState<FilterType[]>([])
    const [showFilterBuilder, setShowFilterBuilder] = useState(false)

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        onSearchChange(value)
    }

    const handleRemoveFilter = (index: number) => {
        const newFilters = activeFilters.filter((_, i) => i !== index)
        setActiveFilters(newFilters)
        onFiltersChange(newFilters)
    }

    const handleClearAll = () => {
        setSearchQuery("")
        setActiveFilters([])
        onSearchChange("")
        onFiltersChange([])
    }

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={`Search ${tableSchema.ui_hints?.label || tableSchema.name}...`}
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setShowFilterBuilder(!showFilterBuilder)}
                >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {activeFilters.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                            {activeFilters.length}
                        </span>
                    )}
                </Button>
            </div>

            {/* Active Filter Chips */}
            {(activeFilters.length > 0 || searchQuery) && (
                <div className="flex flex-wrap gap-2 items-center">
                    {searchQuery && (
                        <Card className="inline-flex items-center gap-2 px-3 py-1.5 text-sm">
                            <Search className="h-3 w-3" />
                            <span>Search: &quot;{searchQuery}&quot;</span>
                            <button
                                onClick={() => handleSearchChange("")}
                                className="hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Card>
                    )}

                    {activeFilters.map((filter, index) => (
                        <Card key={index} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm">
                            <span className="font-medium">{filter.column}</span>
                            <span className="text-muted-foreground">{filter.operator}</span>
                            <span>&quot;{String(filter.value)}&quot;</span>
                            <button
                                onClick={() => handleRemoveFilter(index)}
                                className="hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Card>
                    ))}

                    {(activeFilters.length > 0 || searchQuery) && (
                        <Button variant="ghost" size="sm" onClick={handleClearAll}>
                            Clear all
                        </Button>
                    )}
                </div>
            )}

            {/* Filter Builder Placeholder */}
            {showFilterBuilder && (
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Advanced filter builder coming in Phase 2
                    </p>
                </Card>
            )}
        </div>
    )
}
