/**
 * @fileoverview Dynamic Resource List Page
 * 
 * Reasoning:
 * - Dynamic route that renders any resource's list view
 * - Uses the DynamicList component which reads from registry
 */

"use client";

import { DynamicList } from "@/lib/resources/dynamic-list";
import { useParams } from "next/navigation";

export default function DynamicResourcePage() {
  const params = useParams();
  const resourceName = params.resource as string;

  return <DynamicList resourceName={resourceName} />;
}
