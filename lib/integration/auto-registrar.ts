/**
 * @fileoverview Auto Resource Registrar
 * 
 * Reasoning:
 * - Automatically registers resources from generated schema
 * - Connects Phase 1 output with Phase 2 inferencer
 * - Handles resource registration and cleanup
 */

import { resourceRegistry } from "@/lib/resources/registry";
import type { ProjectPlan, Resource } from "@/lib/code-generator/schemas";

export interface RegisterOptions {
  projectPlan: ProjectPlan;
  autoRegister?: boolean;
  clearExisting?: boolean;
}

export interface RegistrationResult {
  success: boolean;
  resources_registered: string[];
  resources_failed: string[];
  total_fields: number;
  errors: string[];
}

/**
 * Register all resources from a project plan
 */
export function registerResourcesFromPlan(options: RegisterOptions): RegistrationResult {
  const { projectPlan, autoRegister = true, clearExisting = false } = options;
  
  const resourcesRegistered: string[] = [];
  const resourcesFailed: string[] = [];
  const errors: string[] = [];
  let totalFields = 0;

  try {
    // Clear existing resources if requested
    if (clearExisting) {
      resourceRegistry.clear();
    }

    // Register each resource
    for (const resource of projectPlan.resources) {
      try {
        registerResource(resource);
        resourcesRegistered.push(resource.name);
        totalFields += resource.fields.length;
      } catch (err: any) {
        resourcesFailed.push(resource.name);
        errors.push(`Failed to register ${resource.name}: ${err.message}`);
      }
    }

    return {
      success: resourcesFailed.length === 0,
      resources_registered: resourcesRegistered,
      resources_failed: resourcesFailed,
      total_fields: totalFields,
      errors,
    };

  } catch (err: any) {
    return {
      success: false,
      resources_registered: resourcesRegistered,
      resources_failed: resourcesFailed,
      total_fields: totalFields,
      errors: [err.message],
    };
  }
}

/**
 * Register a single resource
 */
export function registerResource(resource: Resource): void {
  // Validate resource has required fields
  if (!resource.name || !resource.plural_name) {
    throw new Error(`Invalid resource: missing name or plural_name`);
  }

  // Register in the dynamic resource registry
  resourceRegistry.register(resource);

  console.log(`Registered resource: ${resource.name} (${resource.plural_name}) with ${resource.fields.length} fields`);
}

/**
 * Unregister a resource by name
 */
export function unregisterResource(resourceName: string): boolean {
  const existed = resourceRegistry.has(resourceName);
  resourceRegistry.unregister(resourceName);
  return existed;
}

/**
 * Get all registered resource names
 */
export function getRegisteredResourceNames(): string[] {
  return resourceRegistry.getAll().map(r => r.name);
}

/**
 * Check if a resource is registered
 */
export function isResourceRegistered(resourceName: string): boolean {
  return resourceRegistry.has(resourceName);
}

/**
 * Get registration stats
 */
export function getRegistrationStats(): {
  total_resources: number;
  total_fields: number;
  resources: Array<{ name: string; fields: number; plural: string }>;
} {
  const resources = resourceRegistry.getAll();
  
  return {
    total_resources: resources.length,
    total_fields: resources.reduce((sum, r) => sum + r.fields.length, 0),
    resources: resources.map(r => ({
      name: r.name,
      fields: r.fields.length,
      plural: r.plural_name,
    })),
  };
}

/**
 * Sync resources from a project plan (only add new ones)
 */
export function syncResourcesFromPlan(projectPlan: ProjectPlan): RegistrationResult {
  const newResources = projectPlan.resources.filter(
    r => !resourceRegistry.has(r.name)
  );

  const result = registerResourcesFromPlan({
    projectPlan: { ...projectPlan, resources: newResources },
    autoRegister: true,
    clearExisting: false,
  });

  return result;
}

/**
 * Reset all registrations
 */
export function resetRegistrations(): void {
  resourceRegistry.clear();
  console.log("All resource registrations cleared");
}

/**
 * Export registry as JSON (for debugging)
 */
export function exportRegistry(): Record<string, unknown> {
  return resourceRegistry.toJSON();
}

/**
 * Import registry from JSON (for debugging/persistence)
 */
export function importRegistry(data: Record<string, unknown>): void {
  resetRegistrations();
  
  // Note: In a real implementation, you'd need to reconstruct Resource objects
  // For now, this is a placeholder
  console.log("Registry import requested with", Object.keys(data).length, "entries");
}
