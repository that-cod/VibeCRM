/**
 * @fileoverview Generate production-ready React components from CRM schemas
 * 
 * Reasoning:
 * - Creates standalone Next.js components without external dependencies
 * - Uses native Supabase client and React hooks
 * - Generates type-safe, production-ready code
 * - No Refine.dev or other framework dependencies
 */

import type { Resource, Field } from "@/lib/code-generator/schemas";

/**
 * Generate TypeScript types for a resource
 */
export function generateTypeDefinitions(resource: Resource): string {
  const fields = resource.fields
    .map(f => `  ${f.name}: ${getTypeScriptType(f)};`)
    .join("\n");

  return `// Generated types for ${resource.singular_label}
export interface ${capitalize(resource.name)} {
  id: string;
${fields}
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type Create${capitalize(resource.name)}Input = Omit<
  ${capitalize(resource.name)},
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type Update${capitalize(resource.name)}Input = Partial<Create${capitalize(resource.name)}Input>;
`;
}

/**
 * Generate list page component
 */
export function generateListPage(resource: Resource): string {
  const visibleFields = resource.fields.slice(0, 5); // Show first 5 fields
  
  return `"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ${capitalize(resource.name)} } from "@/lib/types/${resource.name}";

export default function ${capitalize(resource.name)}ListPage() {
  const [data, setData] = useState<${capitalize(resource.name)}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [page, search]);

  async function loadData() {
    setIsLoading(true);
    try {
      let query = supabase
        .from("${resource.name}")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (search) {
        // Add search filter on first text field
        ${visibleFields[0] ? `query = query.ilike("${visibleFields[0].name}", \`%\${search}%\`);` : ''}
      }

      const { data: records, error } = await query;
      
      if (error) throw error;
      setData(records || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const { error } = await supabase
        .from("${resource.name}")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete item");
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">${resource.plural_label}</h1>
          <p className="text-muted-foreground">${resource.description}</p>
        </div>
        <Link href="/${resource.plural_name}/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add ${resource.singular_label}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
${visibleFields.map(f => `              <TableHead>${f.display_name}</TableHead>`).join("\n")}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={${visibleFields.length + 1}} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={${visibleFields.length + 1}} className="text-center py-8 text-muted-foreground">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              data.map((record) => (
                <TableRow key={record.id}>
${visibleFields.map(f => `                  <TableCell>{formatValue(record.${f.name})}</TableCell>`).join("\n")}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={\`/${resource.plural_name}/\${record.id}\`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                      <Link href={\`/${resource.plural_name}/\${record.id}/edit\`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          onClick={() => setPage(p => p + 1)}
          disabled={data.length < pageSize}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
`;
}

/**
 * Generate create page component
 */
export function generateCreatePage(resource: Resource): string {
  const formFields = resource.fields;
  
  return `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Create${capitalize(resource.name)}Input } from "@/lib/types/${resource.name}";

export default function Create${capitalize(resource.name)}Page() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Create${capitalize(resource.name)}Input>({
${formFields.map(f => `    ${f.name}: ${getDefaultValue(f)},`).join("\n")}
  });

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("${resource.name}")
        .insert(formData);

      if (error) throw error;

      router.push("/${resource.plural_name}");
    } catch (error) {
      console.error("Error creating record:", error);
      alert("Failed to create ${resource.singular_label}");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create ${resource.singular_label}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
${formFields.map(f => generateFormField(f, resource.name)).join("\n\n")}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

/**
 * Generate edit page component
 */
export function generateEditPage(resource: Resource): string {
  const formFields = resource.fields;
  
  return `"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ${capitalize(resource.name)}, Update${capitalize(resource.name)}Input } from "@/lib/types/${resource.name}";

export default function Edit${capitalize(resource.name)}Page() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Update${capitalize(resource.name)}Input>({});

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const { data, error } = await supabase
        .from("${resource.name}")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setFormData(data);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load ${resource.singular_label}");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("${resource.name}")
        .update(formData)
        .eq("id", id);

      if (error) throw error;

      router.push("/${resource.plural_name}");
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update ${resource.singular_label}");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit ${resource.singular_label}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
${formFields.map(f => generateFormField(f, resource.name)).join("\n\n")}

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`;
}

/**
 * Generate show/detail page component
 */
export function generateShowPage(resource: Resource): string {
  const visibleFields = resource.fields;
  
  return `"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ${capitalize(resource.name)} } from "@/lib/types/${resource.name}";

export default function ${capitalize(resource.name)}ShowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [data, setData] = useState<${capitalize(resource.name)} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const { data: record, error } = await supabase
        .from("${resource.name}")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setData(record);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const { error } = await supabase
        .from("${resource.name}")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      router.push("/${resource.plural_name}");
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete item");
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!data) {
    return <div className="container mx-auto py-8">Record not found</div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/${resource.plural_name}">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">${resource.singular_label}</h1>
            <p className="text-muted-foreground">${resource.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={\`/${resource.plural_name}/\${id}/edit\`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
${visibleFields.map(f => `            <div>
              <div className="text-sm font-medium text-muted-foreground">${f.display_name}</div>
              <div className="mt-1">{formatValue(data.${f.name})}</div>
            </div>`).join("\n")}
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created At</div>
              <div className="mt-1">{new Date(data.created_at).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Updated At</div>
              <div className="mt-1">{new Date(data.updated_at).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}
`;
}

// Helper functions

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTypeScriptType(field: Field): string {
  switch (field.type) {
    case "number":
    case "currency":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "string"; // ISO date string
    default:
      return "string";
  }
}

function getDefaultValue(field: Field): string {
  if (field.default_value) {
    return field.type === "text" || field.type === "textarea" 
      ? `"${field.default_value}"` 
      : field.default_value;
  }
  
  switch (field.type) {
    case "number":
    case "currency":
      return "0";
    case "boolean":
      return "false";
    default:
      return '""';
  }
}

function generateFormField(field: Field, resourceName: string): string {
  const required = field.required ? " *" : "";
  
  if (field.type === "textarea") {
    return `            <div className="space-y-2">
              <Label htmlFor="${field.name}">${field.display_name}${required}</Label>
              <Textarea
                id="${field.name}"
                value={formData.${field.name} || ""}
                onChange={(e) => handleChange("${field.name}", e.target.value)}
                ${field.required ? 'required' : ''}
              />
            </div>`;
  }
  
  if (field.type === "boolean") {
    return `            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="${field.name}"
                checked={formData.${field.name} || false}
                onChange={(e) => handleChange("${field.name}", e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="${field.name}">${field.display_name}</Label>
            </div>`;
  }
  
  const inputType = field.type === "number" || field.type === "currency" 
    ? "number" 
    : field.type === "date" 
    ? "date" 
    : field.type === "email"
    ? "email"
    : "text";
  
  return `            <div className="space-y-2">
              <Label htmlFor="${field.name}">${field.display_name}${required}</Label>
              <Input
                type="${inputType}"
                id="${field.name}"
                value={formData.${field.name} || ""}
                onChange={(e) => handleChange("${field.name}", ${inputType === "number" ? "Number(e.target.value)" : "e.target.value"})}
                ${field.required ? 'required' : ''}
              />
            </div>`;
}
