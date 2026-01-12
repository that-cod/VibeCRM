/**
 * @fileoverview Dynamic Show/Detail Component
 * 
 * Reasoning:
 * - Renders detail view for any resource
 * - Shows all fields in read-only mode
 * - Provides edit and delete actions
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resourceRegistry } from "@/lib/resources/registry";
import { DynamicFieldValue } from "@/lib/resources/dynamic-field";
import type { Resource } from "@/lib/code-generator/schemas";

interface DynamicShowProps {
  resourceName: string;
}

export function DynamicShow({ resourceName }: DynamicShowProps) {
  const resource = resourceRegistry.get(resourceName);
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordId = params.id as string;

  useEffect(() => {
    if (!resource || !recordId) return;

    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from(resource.plural_name)
          .select("*")
          .eq("id", recordId)
          .single();

        if (error) throw error;
        setRecord(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resource, recordId, supabase]);

  const handleDelete = async () => {
    if (!resource || !recordId) return;
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase
        .from(resource.plural_name)
        .delete()
        .eq("id", recordId);

      if (error) throw error;
      router.push(`/${resource.plural_name}`);
    } catch (err: any) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  if (!resource) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Resource &quot;{resourceName}&quot; not found
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Loading...</CardContent>
      </Card>
    );
  }

  if (error || !record) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-500">
          {error || "Record not found"}
        </CardContent>
      </Card>
    );
  }

  const listFields = resourceRegistry.getListFields(resourceName);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${resource.plural_name}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{resource.singular_label}</h1>
            <p className="text-muted-foreground">{resource.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${resource.plural_name}/${recordId}/edit`}>
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

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>{resource.singular_label} Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listFields.map((field) => (
              <div key={field.name}>
                <dt className="text-sm font-medium text-muted-foreground">
                  {field.display_name}
                </dt>
                <dd className="mt-1">
                  <DynamicFieldValue field={field} value={record[field.name]} />
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created</dt>
              <dd className="mt-1">
                {record.created_at 
                  ? new Date(record.created_at as string).toLocaleString() 
                  : "—"
                }
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="mt-1">
                {record.updated_at 
                  ? new Date(record.updated_at as string).toLocaleString() 
                  : "—"
                }
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
