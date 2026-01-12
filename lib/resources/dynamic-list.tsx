/**
 * @fileoverview Dynamic List Component
 * 
 * Reasoning:
 * - Renders a list view for any resource using useTableData
 * - Dynamically generates columns from schema
 * - Handles pagination, sorting, and filtering
 */

"use client";

import { useTableData } from "@/lib/hooks/use-table-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { resourceRegistry } from "@/lib/resources/registry";
import { DynamicFieldValue } from "@/lib/resources/dynamic-field";
import type { Resource } from "@/lib/code-generator/schemas";

interface DynamicListProps {
  resourceName: string;
}

export function DynamicList({ resourceName }: DynamicListProps) {
  const resource = resourceRegistry.get(resourceName);
  
  if (!resource) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Resource "{resourceName}" not found
        </CardContent>
      </Card>
    );
  }

  const listFields = resourceRegistry.getListFields(resourceName);
  const [search, setSearch] = useState("");
  
  const {
    data,
    isLoading,
    error,
    pagination,
    nextPage,
    prevPage,
    setSorting,
    setFilters,
    setSearch: setTableSearch,
  } = useTableData(resource.plural_name);

  const handleSearch = (value: string) => {
    setSearch(value);
    setTableSearch(value);
    setFilters([]);
  };

  const handleSort = (columnName: string) => {
    const currentSort = { column: columnName, direction: "asc" as const };
    setSorting(currentSort);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{resource.plural_label}</h1>
          <p className="text-muted-foreground">{resource.description}</p>
        </div>
        <Link href={`/${resource.plural_name}/create`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add {resource.singular_label}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${resource.plural_label.toLowerCase()}...`}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {pagination.total} record{pagination.total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {listFields.map((field) => (
                <TableHead key={field.name} className="cursor-pointer" onClick={() => handleSort(field.name)}>
                  {field.display_name}
                </TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={listFields.length + 1} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={listFields.length + 1} className="text-center py-8 text-muted-foreground">
                  No records yet
                </TableCell>
              </TableRow>
            ) : (
              data.map((record: any) => (
                <TableRow key={record.id}>
                  {listFields.map((field) => (
                    <TableCell key={field.name}>
                      <DynamicFieldValue field={field} value={record[field.name]} />
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/${resource.plural_name}/${record.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Link href={`/${resource.plural_name}/${record.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
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
          <select
            value={pagination.pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              // Would need to update pageSize in the hook
            }}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      )}
    </div>
  );
}
