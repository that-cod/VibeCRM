/**
 * @fileoverview Schema Diff Viewer Component
 *
 * Reasoning:
 * - Visualizes changes between schema versions
 * - Shows added/removed/modified tables and columns
 * - Uses diff algorithm for accurate comparison
 */

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  ArrowRight,
  Table2,
  GitCompare,
  RotateCcw,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CRMSchema, TableDefinition, ColumnDefinition } from "@/types/schema";

interface SchemaDiffProps {
  schemaBefore: CRMSchema | null | undefined;
  schemaAfter: CRMSchema | null | undefined;
  onRollback?: (version: string) => void;
  latestVersion?: string;
}

interface DiffResult {
  added: TableDiff[];
  removed: TableDiff[];
  modified: TableDiff[];
  unchanged: string[];
}

interface TableDiff {
  name: string;
  addedColumns: ColumnDefinition[];
  removedColumns: ColumnDefinition[];
  modifiedColumns: ColumnDiff[];
}

interface ColumnDiff {
  name: string;
  before: ColumnDefinition | null;
  after: ColumnDefinition | null;
}

export function SchemaDiff({
  schemaBefore,
  schemaAfter,
  onRollback,
  latestVersion,
}: SchemaDiffProps) {
  const diff = useMemo(() => computeDiff(schemaBefore, schemaAfter), [schemaBefore, schemaAfter]);

  const totalChanges =
    diff.added.length +
    diff.removed.length +
    diff.modified.reduce((acc, t) => acc + t.addedColumns.length + t.removedColumns.length, 0);

  if (!schemaBefore && !schemaAfter) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No schema data available for comparison
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Schema Changes</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{totalChanges} change{totalChanges !== 1 ? "s" : ""}</Badge>
          {diff.added.length > 0 && (
            <Badge className="bg-green-500/10 text-green-600 border-green-500">
              <Plus className="h-3 w-3 mr-1" />
              {diff.added.length} added
            </Badge>
          )}
          {diff.removed.length > 0 && (
            <Badge className="bg-red-500/10 text-red-600 border-red-500">
              <Minus className="h-3 w-3 mr-1" />
              {diff.removed.length} removed
            </Badge>
          )}
        </div>
      </div>

      {/* Added Tables */}
      {diff.added.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4 text-green-500" />
            Tables Added
          </h4>
          {diff.added.map((table) => (
            <Card key={table.name} className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Table2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{table.name}</span>
                </div>
                <div className="pl-6 space-y-1">
                  {table.addedColumns.map((col) => (
                    <div key={col.name} className="flex items-center gap-2 text-sm">
                      <Plus className="h-3 w-3 text-green-500" />
                      <span className="font-mono">{col.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {col.type}
                      </Badge>
                      {!col.nullable && (
                        <Badge variant="outline" className="text-xs">
                          NOT NULL
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Removed Tables */}
      {diff.removed.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Minus className="h-4 w-4 text-red-500" />
            Tables Removed
          </h4>
          {diff.removed.map((table) => (
            <Card key={table.name} className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Table2 className="h-4 w-4 text-red-600" />
                  <span className="font-medium">{table.name}</span>
                </div>
                <div className="pl-6 space-y-1">
                  {table.removedColumns.map((col) => (
                    <div key={col.name} className="flex items-center gap-2 text-sm text-red-600">
                      <Minus className="h-3 w-3" />
                      <span className="font-mono">{col.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {col.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modified Tables */}
      {diff.modified.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-blue-500" />
            Tables Modified
          </h4>
          {diff.modified.map((table) => (
            <Card key={table.name}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Table2 className="h-4 w-4" />
                  <span className="font-medium">{table.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Added Columns */}
                  {table.addedColumns.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Added Columns</span>
                      {table.addedColumns.map((col) => (
                        <div key={col.name} className="flex items-center gap-2 text-sm">
                          <Plus className="h-3 w-3 text-green-500" />
                          <span className="font-mono">{col.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {col.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Removed Columns */}
                  {table.removedColumns.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Removed Columns</span>
                      {table.removedColumns.map((col) => (
                        <div key={col.name} className="flex items-center gap-2 text-sm text-red-600">
                          <Minus className="h-3 w-3" />
                          <span className="font-mono">{col.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {col.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Modified Columns */}
                  {table.modifiedColumns.length > 0 && (
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-xs text-muted-foreground">Modified Columns</span>
                      {table.modifiedColumns.map((col) => (
                        <div key={col.name} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-3 w-3 text-blue-500" />
                          <span className="font-mono">{col.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {col.before?.type} → {col.after?.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Changes */}
      {totalChanges === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium">No Changes</p>
            <p className="text-sm text-muted-foreground">The schemas are identical</p>
          </CardContent>
        </Card>
      )}

      {/* Rollback Button */}
      {onRollback && latestVersion && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Want to revert to this version?
          </div>
          <Button onClick={() => onRollback(latestVersion)} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Rollback to v{latestVersion}
          </Button>
        </div>
      )}
    </div>
  );
}

function computeDiff(
  before: CRMSchema | null | undefined,
  after: CRMSchema | null | undefined
): DiffResult {
  const beforeTables = before?.tables || [];
  const afterTables = after?.tables || [];

  const beforeTableNames = new Set(beforeTables.map((t) => t.name));
  const afterTableNames = new Set(afterTables.map((t) => t.name));

  const added: TableDiff[] = [];
  const removed: TableDiff[] = [];
  const modified: TableDiff[] = [];
  const unchanged: string[] = [];

  // Find added tables
  for (const table of afterTables) {
    if (!beforeTableNames.has(table.name)) {
      added.push({
        name: table.name,
        addedColumns: table.columns,
        removedColumns: [],
        modifiedColumns: [],
      });
    }
  }

  // Find removed tables
  for (const table of beforeTables) {
    if (!afterTableNames.has(table.name)) {
      removed.push({
        name: table.name,
        addedColumns: [],
        removedColumns: table.columns,
        modifiedColumns: [],
      });
    }
  }

  // Find modified and unchanged tables
  for (const afterTable of afterTables) {
    if (beforeTableNames.has(afterTable.name)) {
      const beforeTable = beforeTables.find((t) => t.name === afterTable.name)!;
      const tableDiff = computeTableDiff(beforeTable, afterTable);

      if (
        tableDiff.addedColumns.length === 0 &&
        tableDiff.removedColumns.length === 0 &&
        tableDiff.modifiedColumns.length === 0
      ) {
        unchanged.push(afterTable.name);
      } else {
        modified.push(tableDiff);
      }
    }
  }

  return { added, removed, modified, unchanged };
}

function computeTableDiff(
  before: TableDefinition,
  after: TableDefinition
): TableDiff {
  const beforeColumns = new Map(before.columns.map((c) => [c.name, c]));
  const afterColumns = new Map(after.columns.map((c) => [c.name, c]));

  const addedColumns: ColumnDefinition[] = [];
  const removedColumns: ColumnDefinition[] = [];
  const modifiedColumns: ColumnDiff[] = [];

  // Find added columns
  for (const col of after.columns) {
    if (!beforeColumns.has(col.name)) {
      addedColumns.push(col);
    }
  }

  // Find removed columns
  for (const col of before.columns) {
    if (!afterColumns.has(col.name)) {
      removedColumns.push(col);
    }
  }

  // Find modified columns
  for (const col of after.columns) {
    const beforeCol = beforeColumns.get(col.name);
    if (beforeCol && JSON.stringify(beforeCol) !== JSON.stringify(col)) {
      modifiedColumns.push({
        name: col.name,
        before: beforeCol,
        after: col,
      });
    }
  }

  return {
    name: before.name,
    addedColumns,
    removedColumns,
    modifiedColumns,
  };
}

export function SimplifiedSchemaDiff({
  before,
  after,
}: {
  before?: CRMSchema;
  after?: CRMSchema;
}) {
  const diff = useMemo(() => computeDiff(before, after), [before, after]);

  const summary = {
    tablesAdded: diff.added.length,
    tablesRemoved: diff.removed.length,
    tablesModified: diff.modified.length,
  };

  return (
    <div className="space-y-2 text-sm">
      {summary.tablesAdded > 0 && (
        <div className="flex items-center gap-2 text-green-600">
          <Plus className="h-4 w-4" />
          <span>+{summary.tablesAdded} table(s)</span>
        </div>
      )}
      {summary.tablesRemoved > 0 && (
        <div className="flex items-center gap-2 text-red-600">
          <Minus className="h-4 w-4" />
          <span>-{summary.tablesRemoved} table(s)</span>
        </div>
      )}
      {summary.tablesModified > 0 && (
        <div className="flex items-center gap-2 text-blue-600">
          <ArrowRight className="h-4 w-4" />
          <span>~{summary.tablesModified} table(s) modified</span>
        </div>
      )}
      {summary.tablesAdded === 0 &&
        summary.tablesRemoved === 0 &&
        summary.tablesModified === 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Check className="h-4 w-4" />
            <span>No changes</span>
          </div>
        )}
    </div>
  );
}
