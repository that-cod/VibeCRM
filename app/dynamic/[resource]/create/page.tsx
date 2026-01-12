/**
 * @fileoverview Dynamic Resource Create Page
 */

"use client";

import { DynamicForm } from "@/lib/resources/dynamic-form";
import { useParams } from "next/navigation";

export default function DynamicCreatePage() {
  const params = useParams();
  const resourceName = params.resource as string;

  return <DynamicForm resourceName={resourceName} mode="create" />;
}
