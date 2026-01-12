/**
 * @fileoverview Mobile-responsive data table with card/table views.
 * 
 * Reasoning:
 * - Mobile: Card-based list view
 * - Tablet: Horizontal scroll table
 * - Desktop: Full table with all columns
 * - Follows MOBILE_RESPONSIVE_SPEC.md patterns
 * 
 * Dependencies:
 * - components/ui for shadcn components
 * - framer-motion for animations
 */

"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { motion } from "framer-motion"

interface Column {
    key: string
    label: string
    type?: "text" | "number" | "date" | "badge"
}

interface ResponsiveTableProps {
    data: Record<string, any>[]
    columns: Column[]
    onEdit?: (row: any) => void
    onDelete?: (row: any) => void
}

export function ResponsiveTable({ data, columns, onEdit, onDelete }: ResponsiveTableProps) {
    return (
        <>
            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4">
                {data.map((row, index) => (
                    <MobileDataCard
                        key={row.id || index}
                        row={row}
                        columns={columns}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="text-left px-4 py-3 text-sm font-semibold text-gray-300"
                                >
                                    {col.label}
                                </th>
                            ))}
                            {(onEdit || onDelete) && (
                                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-300">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr
                                key={row.id || index}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3 text-sm text-gray-200">
                                        {renderCellValue(row[col.key], col.type)}
                                    </td>
                                ))}
                                {(onEdit || onDelete) && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {onEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(row)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDelete(row)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    )
}

function MobileDataCard({
    row,
    columns,
    onEdit,
    onDelete,
}: {
    row: Record<string, any>
    columns: Column[]
    onEdit?: (row: any) => void
    onDelete?: (row: any) => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
        >
            <Card className="border-white/10 bg-black/40 backdrop-blur-md">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-base text-white">
                            {row[columns[0]?.key] || "Untitled"}
                        </CardTitle>
                        {(onEdit || onDelete) && (
                            <div className="flex gap-1">
                                {onEdit && (
                                    <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDelete(row)}
                                        className="text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                    {columns.slice(1).map((col) => (
                        <div key={col.key} className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">{col.label}</span>
                            <span className="text-gray-200 font-medium">
                                {renderCellValue(row[col.key], col.type)}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    )
}

function renderCellValue(value: any, type?: string) {
    if (value === null || value === undefined) {
        return <span className="text-gray-500">—</span>
    }

    switch (type) {
        case "badge":
            return <Badge variant="outline">{value}</Badge>
        case "date":
            return new Date(value).toLocaleDateString()
        case "number":
            return typeof value === "number" ? value.toLocaleString() : value
        default:
            return value
    }
}
