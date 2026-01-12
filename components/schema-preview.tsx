/**
 * @fileoverview Schema preview component with table/column visualization.
 * 
 * Reasoning:
 * - Shows AI-generated schema before provisioning
 * - Expandable table cards with column details
 * - Mobile-responsive accordion pattern
 * - Confirms/edits before database creation
 * 
 * Dependencies:
 * - components/ui/card for table display
 * - types/schema for CRM schema types
 */

"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Database, Key, Link as LinkIcon } from "lucide-react"
import type { CRMSchema, TableDefinition } from "@/types/schema"
import { cn } from "@/lib/utils"

interface SchemaPreviewProps {
    schema: CRMSchema
    onConfirm: () => void
    onCancel: () => void
    isProvisioning?: boolean
}

export function SchemaPreview({ schema, onConfirm, onCancel, isProvisioning }: SchemaPreviewProps) {
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

    const toggleTable = (tableName: string) => {
        const newExpanded = new Set(expandedTables)
        if (newExpanded.has(tableName)) {
            newExpanded.delete(tableName)
        } else {
            newExpanded.add(tableName)
        }
        setExpandedTables(newExpanded)
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Your AI-Generated CRM Schema
                </h2>
                <p className="text-muted-foreground">
                    {schema.tables.length} table{schema.tables.length !== 1 ? "s" : ""} ready to provision
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {schema.tables.map((table) => (
                    <TableCard
                        key={table.name}
                        table={table}
                        isExpanded={expandedTables.has(table.name)}
                        onToggle={() => toggleTable(table.name)}
                    />
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={onCancel}
                    disabled={isProvisioning}
                    className="w-full sm:w-auto"
                >
                    Cancel
                </Button>
                <Button
                    size="lg"
                    onClick={onConfirm}
                    disabled={isProvisioning}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
                >
                    {isProvisioning ? (
                        <>
                            <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            Provisioning...
                        </>
                    ) : (
                        <>
                            <Database className="mr-2 h-4 w-4" />
                            Provision to Database
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

interface TableCardProps {
    table: TableDefinition
    isExpanded: boolean
    onToggle: () => void
}

function TableCard({ table, isExpanded, onToggle }: TableCardProps) {
    const primaryKey = table.columns.find(col => col.name === "id")
    const foreignKeys = table.columns.filter(col => col.references)
    const regularColumns = table.columns.filter(col =>
        col.name !== "id" &&
        col.name !== "user_id" &&
        col.name !== "created_at" &&
        col.name !== "updated_at" &&
        !col.references
    )

    return (
        <Card className="border-white/10 bg-black/40 backdrop-blur-md hover:border-purple-500/30 transition-colors">
            <CardHeader
                className="cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                            <CardTitle className="text-lg">{table.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                                {table.columns.length} columns · {foreignKeys.length} relationship{foreignKeys.length !== 1 ? "s" : ""}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="hidden sm:inline-flex">
                        Table
                    </Badge>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                    {/* Primary Key */}
                    {primaryKey && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Key className="h-4 w-4 text-yellow-400" />
                                Primary Key
                            </h4>
                            <ColumnRow column={primaryKey} />
                        </div>
                    )}

                    {/* Foreign Keys / Relationships */}
                    {foreignKeys.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-blue-400" />
                                Relationships
                            </h4>
                            <div className="space-y-2">
                                {foreignKeys.map(col => (
                                    <ColumnRow key={col.name} column={col} showReference />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Regular Columns */}
                    {regularColumns.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Columns</h4>
                            <div className="space-y-2">
                                {regularColumns.map(col => (
                                    <ColumnRow key={col.name} column={col} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Auto-managed columns */}
                    <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Auto-Managed</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <div>• user_id (UUID) - Multi-tenancy isolation</div>
                            <div>• created_at (TIMESTAMPTZ) - Record creation</div>
                            <div>• updated_at (TIMESTAMPTZ) - Last modification</div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}

interface ColumnRowProps {
    column: any
    showReference?: boolean
}

function ColumnRow({ column, showReference }: ColumnRowProps) {
    return (
        <div className="flex items-center justify-between py-2 px-3 rounded-md bg-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="font-mono text-sm text-white truncate">
                    {column.name}
                </span>
                <Badge variant="secondary" className="text-xs shrink-0">
                    {column.type}
                </Badge>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {!column.nullable && (
                    <Badge variant="outline" className="text-xs">
                        Required
                    </Badge>
                )}
                {showReference && column.references && (
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                        → {column.references.table}.{column.references.column}
                    </span>
                )}
            </div>
        </div>
    )
}
