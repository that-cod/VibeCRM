/**
 * @fileoverview Resources Dashboard Page
 * 
 * Reasoning:
 * - Main page for managing generated resources
 * - Shows all registered resources with status
 * - Provides quick access to CRUD operations
 */

import { ResourceDashboard } from "@/components/integration/resource-dashboard";

export default function ResourcesPage() {
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your CRM Resources</h1>
        <p className="text-muted-foreground">
          Manage and view all your dynamically generated CRM resources
        </p>
      </div>

      <ResourceDashboard />
    </div>
  );
}
