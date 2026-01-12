/**
 * @fileoverview Dynamic Field Renderer
 * 
 * Reasoning:
 * - Renders the appropriate UI component based on field type
 * - Handles form field rendering with react-hook-form integration
 * - Supports all field types from the schema
 */

"use client";

import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Field } from "@/lib/code-generator/schemas";

interface DynamicFieldProps {
  field: Field;
  resourceName: string;
  disabled?: boolean;
}

/**
 * Render a single form field based on its type
 */
export function DynamicField({ field, resourceName, disabled }: DynamicFieldProps) {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[field.name]?.message as string | undefined;
  const required = field.required;

  switch (field.type) {
    case "textarea":
      return (
        <Controller
          control={control}
          name={field.name}
          rules={{ required: required ? `${field.display_name} is required` : false }}
          render={({ field: fieldProps }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {field.display_name}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Textarea
                placeholder={`Enter ${field.display_name.toLowerCase()}`}
                {...fieldProps}
                disabled={disabled}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        />
      );

    case "boolean":
      return (
        <Controller
          control={control}
          name={field.name}
          render={({ field: fieldProps }) => (
            <div className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id={field.name}
                checked={fieldProps.value}
                onCheckedChange={fieldProps.onChange}
                disabled={disabled}
              />
              <div className="space-y-1 leading-none">
                <label
                  htmlFor={field.name}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {field.display_name}
                </label>
              </div>
            </div>
          )}
        />
      );

    case "select":
    case "status":
      const options = field.select_options || [];
      return (
        <Controller
          control={control}
          name={field.name}
          rules={{ required: required ? `${field.display_name} is required` : false }}
          render={({ field: fieldProps }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {field.display_name}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Select
                value={fieldProps.value}
                onValueChange={fieldProps.onChange}
                disabled={disabled}
              >
                <SelectTrigger className={error ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        />
      );

    case "number":
    case "currency":
      return (
        <Controller
          control={control}
          name={field.name}
          rules={{
            required: required ? `${field.display_name} is required` : false,
          }}
          render={({ field: fieldProps }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {field.display_name}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Input
                type="number"
                placeholder={`Enter ${field.display_name.toLowerCase()}`}
                {...fieldProps}
                value={fieldProps.value ?? ""}
                onChange={(e) => fieldProps.onChange(e.target.value ? Number(e.target.value) : undefined)}
                disabled={disabled}
                className={error ? "border-red-500" : ""}
                step={field.type === "currency" ? "0.01" : "1"}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        />
      );

    case "date":
      return (
        <Controller
          control={control}
          name={field.name}
          rules={{ required: required ? `${field.display_name} is required` : false }}
          render={({ field: fieldProps }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {field.display_name}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Input
                type="date"
                {...fieldProps}
                value={fieldProps.value ? String(fieldProps.value).split("T")[0] : ""}
                onChange={(e) => fieldProps.onChange(e.target.value)}
                disabled={disabled}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        />
      );

    case "email":
      return (
        <Controller
          control={control}
          name={field.name}
          rules={{
            required: required ? `${field.display_name} is required` : false,
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          }}
          render={({ field: fieldProps }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {field.display_name}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Input
                type="email"
                placeholder={`Enter ${field.display_name.toLowerCase()}`}
                {...fieldProps}
                disabled={disabled}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        />
      );

    default:
      return (
        <Controller
          control={control}
          name={field.name}
          rules={{ required: required ? `${field.display_name} is required` : false }}
          render={({ field: fieldProps }) => (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {field.display_name}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <Input
                type="text"
                placeholder={`Enter ${field.display_name.toLowerCase()}`}
                {...fieldProps}
                disabled={disabled}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        />
      );
  }
}

/**
 * Render read-only field value
 */
export function DynamicFieldValue({ field, value }: { field: Field; value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }

  switch (field.type) {
    case "currency":
      if (typeof value === "number") {
        return (
          <span className="font-mono">
            ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
      return <span>{String(value)}</span>;

    case "number":
      if (typeof value === "number") {
        return <span className="font-mono">{value.toLocaleString()}</span>;
      }
      return <span>{String(value)}</span>;

    case "boolean":
      return (
        <span className={value ? "text-green-600" : "text-gray-500"}>
          {value ? "Yes" : "No"}
        </span>
      );

    case "date":
      if (typeof value === "string") {
        try {
          const date = new Date(value);
          return <span>{date.toLocaleDateString()}</span>;
        } catch {
          return <span>{String(value)}</span>;
        }
      }
      return <span>{String(value)}</span>;

    case "select":
    case "status":
      const option = field.select_options?.find((o) => o.value === value);
      if (option) {
        return <span>{option.label}</span>;
      }
      return <span>{String(value)}</span>;

    default:
      return <span>{String(value)}</span>;
  }
}
