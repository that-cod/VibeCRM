/**
 * @fileoverview Dynamic Resource Show/Detail Page
 */

"use client";

import { DynamicShow } from "@/lib/resources/dynamic-show";
import { useParams } from "next/navigation";

export default function DynamicShowPage() {
  const params = useParams();
  const resourceName = params.resource as string;

  return <DynamicShow resourceName={resourceName} />;
}
