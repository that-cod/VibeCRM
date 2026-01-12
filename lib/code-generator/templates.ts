import type { Field, Resource } from "./schemas";

export function generateTypesTemplate(resource: Resource): string {
  const fields = resource.fields.filter(f => !["id", "user_id", "created_at", "updated_at"].includes(f.name));
  const fieldsStr = fields.map(f => `  ${f.name}: string;`).join("\n");
  
  return `export interface ${capitalize(resource.name)} {
  id: string;
${fieldsStr}
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type Create${capitalize(resource.name)}Input = Omit<${capitalize(resource.name)}, "id" | "created_at" | "updated_at" | "user_id">;
`;
}

export function generateColumnsTemplate(resource: Resource): string {
  const visibleFields = resource.fields.filter(f => !["id", "user_id", "created_at", "updated_at"].includes(f.name));
  const cols = visibleFields.map((f, i) => `  { accessorKey: "${f.name}", header: "${f.display_name}" }`).join(",\n");
  
  return `"use client";

import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<any>[] = [\n${cols}\n];`;
}

export function generateListTemplate(resource: Resource): string {
  return `"use client";

import { useTable } from "@refinedev/core";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function ${capitalize(resource.name)}List() {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });
  
  const { tableQueryResult, isLoading, error } = useTable({
    resource: "${resource.plural_name}",
    pagination: { current: pagination.current, pageSize: pagination.pageSize },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });

  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  
  const data = tableQueryResult?.data?.data ?? [];
  const total = tableQueryResult?.data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading title="${resource.plural_label}" description="${resource.description}" />
        <Link href="/${resource.plural_name}/create">
          <Button><Plus className="mr-2 h-4 w-4" />Add ${resource.singular_label}</Button>
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        pageCount={Math.ceil(total / pagination.pageSize)}
        pageIndex={pagination.current - 1}
        pageSize={pagination.pageSize}
        onPaginationChange={(pi, ps) => setPagination({ current: pi + 1, pageSize: ps })}
        rowKey="id"
      />
    </div>
  );
}
`;
}

export function generateCreateTemplate(resource: Resource): string {
  const formFields = resource.fields.filter(f => !["id", "user_id", "created_at", "updated_at"].includes(f.name));
  const formHtml = formFields.map(f => getFormFieldHTML(f)).join("\n\n          ");
  
  return `"use client";

import { useForm } from "@refinedev/react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@refinedev/core";
import { useRouter } from "next/navigation";

export function ${capitalize(resource.name)}Create() {
  const { open } = useNotification();
  const router = useRouter();

  const form = useForm({
    refineCoreProps: {
      resource: "${resource.plural_name}",
      action: "create",
      onSuccess: () => {
        open?.({ type: "success", message: "${resource.singular_label} created" });
        router.push("/${resource.plural_name}");
      },
    },
  });

  const { handleSubmit, control, formState: { isSubmitting } } = form;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create ${resource.singular_label}</h1>
      <Form {...form}>
        <form onSubmit={handleSubmit(form.refineCoreForm.handleSubmit)} className="space-y-6">
          ${formHtml}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
`;
}

export function generateEditTemplate(resource: Resource): string {
  const formFields = resource.fields.filter(f => !["id", "user_id", "created_at", "updated_at"].includes(f.name));
  const formHtml = formFields.map(f => getFormFieldHTML(f)).join("\n\n          ");
  
  return `"use client";

import { useForm } from "@refinedev/react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNotification } from "@refinedev/core";
import { useRouter, useParams } from "next/navigation";

export function ${capitalize(resource.name)}Edit() {
  const { id } = useParams<{ id: string }>();
  const { open } = useNotification();
  const router = useRouter();

  const form = useForm({
    refineCoreProps: {
      resource: "${resource.plural_name}",
      action: "edit",
      id: id,
      onSuccess: () => {
        open?.({ type: "success", message: "${resource.singular_label} updated" });
        router.push("/${resource.plural_name}");
      },
    },
  });

  const { handleSubmit, control, formState: { isSubmitting } } = form;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit ${resource.singular_label}</h1>
      <Form {...form}>
        <form onSubmit={handleSubmit(form.refineCoreForm.handleSubmit)} className="space-y-6">
          ${formHtml}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
`;
}

export function generateShowTemplate(resource: Resource): string {
  const visibleFields = resource.fields.filter(f => !["id", "user_id", "created_at", "updated_at"].includes(f.name));
  const detailsHtml = visibleFields.map(f => `            <div><span class="text-muted-foreground">${f.display_name}</span><p>{record.${f.name} || "—"}</p></div>`).join("\n");
  
  return `"use client";

import { useOne } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function ${capitalize(resource.name)}Show() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useOne({ resource: "${resource.plural_name}", id: id as string });

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error || !data?.data) return <div className="p-8 text-red-500">Error loading</div>;

  const record = data.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/${resource.plural_name}"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
          <div><h1 className="text-2xl font-bold">${resource.singular_label}</h1><p className="text-muted-foreground">${resource.description}</p></div>
        </div>
        <Link href="/${resource.plural_name}/[id]/edit"><Button><Edit className="h-4 w-4 mr-2" />Edit</Button></Link>
      </div>
      <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-4">${detailsHtml}</div></CardContent></Card>
    </div>
  );
}
`;
}

export function generateHookTemplate(resource: Resource): string {
  return `"use client";

import { useTable, useForm, useDelete } from "@refinedev/core";
import { useState, useCallback } from "react";

export function use${capitalize(resource.name)}(options: { pagination?: { current: number; pageSize: number } } = {}) {
  const [pagination, setPagination] = useState(options.pagination || { current: 1, pageSize: 20 });

  const { data, isLoading, error, refetch } = useTable({
    resource: "${resource.plural_name}",
    pagination: { current: pagination.current, pageSize: pagination.pageSize },
    sorters: { initial: [{ field: "created_at", order: "desc" }] },
  });

  const createRecord = useCallback(async (input: Record<string, unknown>) => {
    const { mutate } = useForm({ refineCoreProps: { resource: "${resource.plural_name}", action: "create" } });
    return mutate(input);
  }, []);

  const updateRecord = useCallback(async (id: string, input: Record<string, unknown>) => {
    const { mutate } = useForm({ refineCoreProps: { resource: "${resource.plural_name}", action: "edit", id } });
    return mutate(input);
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    const { mutate } = useDelete();
    return mutate({ resource: "${resource.plural_name}", id });
  }, []);

  return { data: data?.data ?? [], total: data?.total ?? 0, isLoading, error, pagination, setPagination, refetch, createRecord, updateRecord, deleteRecord };
}
`;
}

export function generateListPageTemplate(resource: Resource): string {
  return `import { ${capitalize(resource.name)}List } from "@/components/${resource.name}/${resource.name}-list";
export default function ${capitalize(resource.name)}ListPage() {
  return <${capitalize(resource.name)}List />;
}`;
}

export function generateCreatePageTemplate(resource: Resource): string {
  return `import { ${capitalize(resource.name)}Create } from "@/components/${resource.name}/${resource.name}-create";
export default function ${capitalize(resource.name)}CreatePage() {
  return <${capitalize(resource.name)}Create />;
}`;
}

export function generateShowPageTemplate(resource: Resource): string {
  return `import { ${capitalize(resource.name)}Show } from "@/components/${resource.name}/${resource.name}-show";
export default function ${capitalize(resource.name)}ShowPage() {
  return <${capitalize(resource.name)}Show />;
}`;
}

export function generateEditPageTemplate(resource: Resource): string {
  return `import { ${capitalize(resource.name)}Edit } from "@/components/${resource.name}/${resource.name}-edit";
export default function ${capitalize(resource.name)}EditPage() {
  return <${capitalize(resource.name)}Edit />;
}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getFormFieldHTML(field: Field): string {
  const req = field.required ? " *" : "";
  
  if (field.type === "textarea") {
    return `          <FormField control={control} name="${field.name}" render={({ field: props }) => (
              <FormItem><FormLabel>${field.display_name}${req}</FormLabel><FormControl><Textarea placeholder="Enter..." {...props} /></FormControl><FormMessage /></FormItem>
            )} />`;
  }
  
  if (field.type === "select" || field.type === "status") {
    const opts = (field.select_options || []).map(o => `<SelectItem value="${o.value}">${o.label}</SelectItem>`).join("\n                    ");
    return `          <FormField control={control} name="${field.name}" render={({ field: props }) => (
              <FormItem><FormLabel>${field.display_name}${req}</FormLabel><Select onValueChange={props.onChange} defaultValue={props.value}><FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl><SelectContent>${opts}</SelectContent></Select><FormMessage /></FormItem>
            )} />`;
  }
  
  const inpType = (field.type === "number" || field.type === "currency") ? "number" : "text";
  return `          <FormField control={control} name="${field.name}" render={({ field: props }) => (
              <FormItem><FormLabel>${field.display_name}${req}</FormLabel><FormControl><Input type="${inpType}" placeholder="Enter..." {...props} /></FormControl><FormMessage /></FormItem>
            )} />`;
}
