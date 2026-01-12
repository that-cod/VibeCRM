/**
 * @fileoverview Dynamic Resource Registry
 * 
 * Reasoning:
 * - Stores resource schemas at runtime
 * - Allows dynamic CRUD operations without static code generation
 * - Provides type-safe access to registered resources
 */

import type { Resource, Field } from "@/lib/code-generator/schemas";

interface ResourceRegistryEntry {
  resource: Resource;
  createdAt: Date;
  updatedAt: Date;
}

class DynamicResourceRegistry {
  private registry: Map<string, ResourceRegistryEntry> = new Map();

  /**
   * Register a new resource schema
   */
  register(resource: Resource): void {
    if (this.registry.has(resource.name)) {
      console.warn(`Resource "${resource.name}" already registered, updating...`);
    }
    
    this.registry.set(resource.name, {
      resource,
      createdAt: this.registry.get(resource.name)?.createdAt || new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`Registered resource: ${resource.name} (${resource.plural_name})`);
  }

  /**
   * Unregister a resource
   */
  unregister(name: string): boolean {
    return this.registry.delete(name);
  }

  /**
   * Get a resource by name
   */
  get(name: string): Resource | undefined {
    return this.registry.get(name)?.resource;
  }

  /**
   * Get all registered resources
   */
  getAll(): Resource[] {
    return Array.from(this.registry.values()).map(entry => entry.resource);
  }

  /**
   * Get resource by plural name
   */
  getByPlural(pluralName: string): Resource | undefined {
    for (const entry of this.registry.values()) {
      if (entry.resource.plural_name === pluralName) {
        return entry.resource;
      }
    }
    return undefined;
  }

  /**
   * Check if resource exists
   */
  has(name: string): boolean {
    return this.registry.has(name);
  }

  /**
   * Get all resources as array for Refine resources config
   */
  getRefineResources(): Array<{
    name: string;
    list: string;
    create: string;
    edit: string;
    show: string;
    meta?: Record<string, unknown>;
  }> {
    return this.getAll().map(resource => ({
      name: resource.plural_name,
      list: `/${resource.plural_name}`,
      create: `/${resource.plural_name}/create`,
      edit: `/${resource.plural_name}/:id/edit`,
      show: `/${resource.plural_name}/:id`,
      meta: {
        label: resource.plural_label,
        icon: resource.icon,
        description: resource.description,
      },
    }));
  }

  /**
   * Get form fields (excluding audit fields)
   */
  getFormFields(resourceName: string): Field[] {
    const resource = this.get(resourceName);
    if (!resource) return [];
    
    return resource.fields.filter(
      field => !["id", "user_id", "created_at", "updated_at"].includes(field.name)
    );
  }

  /**
   * Get list fields (excluding sensitive audit fields)
   */
  getListFields(resourceName: string): Field[] {
    const resource = this.get(resourceName);
    if (!resource) return [];
    
    return resource.fields.filter(
      field => !["id", "user_id", "created_at", "updated_at"].includes(field.name)
    );
  }

  /**
   * Get relationship fields
   */
  getRelationshipFields(resourceName: string): Array<Field & { relatedResource: string }> {
    const resource = this.get(resourceName);
    if (!resource) return [];
    
    return (resource.relationships || []).map(rel => ({
      name: rel.foreign_key_column,
      type: "text" as const,
      required: false,
      display_name: rel.name.charAt(0).toUpperCase() + rel.name.slice(1),
      relatedResource: rel.related_resource,
    }));
  }

  /**
   * Clear all registered resources
   */
  clear(): void {
    this.registry.clear();
    console.log("Cleared all registered resources");
  }

  /**
   * Get registry size
   */
  size(): number {
    return this.registry.size;
  }

  /**
   * Get all resources as JSON (for debugging/serialization)
   */
  toJSON(): Record<string, Resource> {
    const result: Record<string, Resource> = {};
    for (const [name, entry] of this.registry) {
      result[name] = entry.resource;
    }
    return result;
  }

  /**
   * Get registration statistics
   */
  getStats(): { total_resources: number; total_fields: number; resources: Array<{ name: string; fields: number; plural: string }> } {
    const resources = this.getAll();
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
}

// Singleton instance
export const resourceRegistry = new DynamicResourceRegistry();

/**
 * Helper function to get registration stats
 */
export function getRegistrationStats(): { total_resources: number; total_fields: number; resources: Array<{ name: string; fields: number; plural: string }> } {
  return resourceRegistry.getStats();
}
