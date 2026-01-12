/**
 * @fileoverview Hook for managing table data with CRUD operations, pagination, sorting, and filtering.
 * 
 * Reasoning:
 * - Centralized data management for any table
 * - Handles Supabase queries with RLS auto-applied
 * - Supports pagination, sorting, filtering, search
 * - Optimistic updates for better UX
 * 
 * Dependencies:
 * - lib/supabase/client for database operations
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Filter {
    column: string
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in'
    value: any
}

export interface Sorting {
    column: string
    direction: 'asc' | 'desc'
}

export interface Pagination {
    page: number
    pageSize: number
    total: number
}

interface UseTableDataOptions {
    initialPageSize?: number
    autoLoad?: boolean
}

export function useTableData(
    tableName: string,
    options: UseTableDataOptions = {}
) {
    const { initialPageSize = 20, autoLoad = true } = options

    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: initialPageSize,
        total: 0,
    })

    const [sorting, setSorting] = useState<Sorting | null>(null)
    const [filters, setFilters] = useState<Filter[]>([])
    const [searchQuery, setSearchQuery] = useState<string>("")

    const supabase = createClient()

    // Fetch data with current filters, sorting, and pagination
    const fetchData = useCallback(async () => {
        if (!tableName) return

        try {
            setIsLoading(true)
            setError(null)

            // Build query
            let query = supabase.from(tableName).select("*", { count: "exact" })

            // Apply filters
            filters.forEach(filter => {
                switch (filter.operator) {
                    case 'eq':
                        query = query.eq(filter.column, filter.value)
                        break
                    case 'neq':
                        query = query.neq(filter.column, filter.value)
                        break
                    case 'gt':
                        query = query.gt(filter.column, filter.value)
                        break
                    case 'gte':
                        query = query.gte(filter.column, filter.value)
                        break
                    case 'lt':
                        query = query.lt(filter.column, filter.value)
                        break
                    case 'lte':
                        query = query.lte(filter.column, filter.value)
                        break
                    case 'like':
                        query = query.like(filter.column, filter.value)
                        break
                    case 'ilike':
                        query = query.ilike(filter.column, `%${filter.value}%`)
                        break
                    case 'in':
                        query = query.in(filter.column, filter.value)
                        break
                }
            })

            // Apply sorting
            if (sorting) {
                query = query.order(sorting.column, { ascending: sorting.direction === 'asc' })
            } else {
                // Default sort by created_at descending
                query = query.order('created_at', { ascending: false })
            }

            // Apply pagination
            const from = (pagination.page - 1) * pagination.pageSize
            const to = from + pagination.pageSize - 1
            query = query.range(from, to)

            const { data: fetchedData, error: fetchError, count } = await query

            if (fetchError) {
                throw fetchError
            }

            setData(fetchedData || [])
            setPagination(prev => ({ ...prev, total: count || 0 }))
        } catch (err) {
            console.error("Failed to fetch data:", err)
            setError(err instanceof Error ? err : new Error("Failed to fetch data"))
            setData([])
        } finally {
            setIsLoading(false)
        }
    }, [tableName, filters, sorting, pagination.page, pagination.pageSize])

    // Create record
    const createRecord = async (recordData: any) => {
        try {
            setError(null)

            const { data: newRecord, error: insertError } = await supabase
                .from(tableName)
                .insert(recordData)
                .select()
                .single()

            if (insertError) {
                throw insertError
            }

            // Refresh data
            await fetchData()

            return newRecord
        } catch (err) {
            console.error("Failed to create record:", err)
            throw err
        }
    }

    // Update record
    const updateRecord = async (id: string, updates: any) => {
        try {
            setError(null)

            const { data: updatedRecord, error: updateError } = await supabase
                .from(tableName)
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (updateError) {
                throw updateError
            }

            // Optimistic update
            setData(prev => prev.map(row => row.id === id ? updatedRecord : row))

            return updatedRecord
        } catch (err) {
            console.error("Failed to update record:", err)
            // Revert on error
            await fetchData()
            throw err
        }
    }

    // Delete record
    const deleteRecord = async (id: string) => {
        try {
            setError(null)

            const { error: deleteError } = await supabase
                .from(tableName)
                .delete()
                .eq('id', id)

            if (deleteError) {
                throw deleteError
            }

            // Optimistic update
            setData(prev => prev.filter(row => row.id !== id))
            setPagination(prev => ({ ...prev, total: prev.total - 1 }))
        } catch (err) {
            console.error("Failed to delete record:", err)
            // Revert on error
            await fetchData()
            throw err
        }
    }

    // Pagination controls
    const nextPage = () => {
        const maxPage = Math.ceil(pagination.total / pagination.pageSize)
        if (pagination.page < maxPage) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }))
        }
    }

    const prevPage = () => {
        if (pagination.page > 1) {
            setPagination(prev => ({ ...prev, page: prev.page - 1 }))
        }
    }

    const goToPage = (page: number) => {
        const maxPage = Math.ceil(pagination.total / pagination.pageSize)
        if (page >= 1 && page <= maxPage) {
            setPagination(prev => ({ ...prev, page }))
        }
    }

    // Auto-fetch on mount and when dependencies change
    useEffect(() => {
        if (autoLoad) {
            fetchData()
        }
    }, [fetchData, autoLoad])

    return {
        // Data
        data,
        isLoading,
        error,

        // Pagination
        pagination,
        nextPage,
        prevPage,
        goToPage,

        // Sorting
        sorting,
        setSorting,

        // Filtering
        filters,
        setFilters,
        searchQuery,
        setSearch: setSearchQuery,

        // Operations
        fetchData,
        createRecord,
        updateRecord,
        deleteRecord,

        // Utilities
        refresh: fetchData,
    }
}
