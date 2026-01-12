/**
 * @fileoverview Dynamic Form Component
 * 
 * Reasoning:
 * - Renders create/edit forms dynamically from schema
 * - Uses react-hook-form with validation
 * - Handles both create and edit modes
 */

"use client";

import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { resourceRegistry } from "@/lib/resources/registry";
import { DynamicField } from "@/lib/resources/dynamic-field";
import type { Resource, Field } from "@/lib/code-generator/schemas";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface DynamicFormProps {
  resourceName: string;
  mode: "create" | "edit";
}

export function DynamicForm({ resourceName, mode }: DynamicFormProps) {
  const resource = resourceRegistry.get(resourceName);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(mode === "edit");
  const [initialData, setInitialData] = useState<Record<string, unknown>>({});

  if (!resource) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Resource "{resourceName}" not found
        </CardContent>
      </Card>
    );
  }

  const formFields = resourceRegistry.getFormFields(resourceName);
  const recordId = mode === "edit" ? params.id as string : undefined;

  // Fetch existing data for edit mode
  useEffect(() => {
    if (mode === "edit" && recordId) {
      const fetchData = async () => {
        try {
          const { data, error } = await supabase
            .from(resource.plural_name)
            .select("*")
            .eq("id", recordId)
            .single();

          if (error) throw error;
          if (data) {
            setInitialData(data);
          }
        } catch (err) {
          console.error("Error fetching record:", err);
        } finally {
          setIsFetching(false);
        }
      };
      fetchData();
    }
  }, [mode, recordId, resource.plural_name, supabase]);

  const form = useForm({
    defaultValues: formFields.reduce((acc, field) => {
      acc[field.name] = "";
      return acc;
    }, {} as Record<string, string>),
    values: Object.keys(initialData).length > 0 
      ? formFields.reduce((acc, field) => {
          if (field.name in initialData) {
            acc[field.name] = initialData[field.name] as string;
          }
          return acc;
        }, {} as Record<string, string>)
      : undefined,
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      if (mode === "create") {
        const { error } = await supabase
          .from(resource.plural_name)
          .insert(data);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(resource.plural_name)
          .update(data)
          .eq("id", recordId);

        if (error) throw error;
      }

      router.push(`/${resource.plural_name}`);
      router.refresh();
    } catch (err: any) {
      console.error("Error saving:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/${resource.plural_name}`}>
          <Button variant="ghost" size="sm" className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {resource.plural_label}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? `Create ${resource.singular_label}` : `Edit ${resource.singular_label}`}
        </h1>
        <p className="text-muted-foreground">
          {mode === "create" 
            ? `Add a new ${resource.singular_label.toLowerCase()} to your CRM`
            : `Update ${resource.singular_label.toLowerCase()} information`
          }
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {formFields.map((field) => (
                  <DynamicField
                    key={field.name}
                    field={field}
                    resourceName={resourceName}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? "Saving..." 
                : mode === "create" 
                  ? `Create ${resource.singular_label}` 
                  : "Save Changes"
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
