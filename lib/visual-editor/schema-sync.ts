/**
 * @fileoverview Sync visual editor changes back to schema
 * 
 * Phase 3: Visual Editing
 * Converts visual property changes into schema updates
 */

import type { CRMSchema, TableDefinition } from "@/types/schema";
import type { PropertyChange } from "./types";

/**
 * Apply visual editor changes to schema
 */
export function applyVisualChangesToSchema(
  schema: CRMSchema,
  changes: PropertyChange[]
): CRMSchema {
  const updatedSchema = JSON.parse(JSON.stringify(schema)); // Deep clone

  changes.forEach(change => {
    // Extract metadata from element ID
    const metadata = extractMetadataFromElementId(change.elementId);
    
    if (!metadata) return;

    // Find the table
    const table = updatedSchema.tables.find(
      (t: TableDefinition) => t.name === metadata.tableName
    );

    if (!table) return;

    // Update ui_hints based on property
    if (!table.ui_hints) {
      table.ui_hints = {};
    }

    switch (change.property) {
      case "backgroundColor":
        if (!table.ui_hints.styling) {
          table.ui_hints.styling = {};
        }
        table.ui_hints.styling.backgroundColor = change.newValue;
        break;

      case "color":
        if (!table.ui_hints.styling) {
          table.ui_hints.styling = {};
        }
        table.ui_hints.styling.textColor = change.newValue;
        break;

      case "text":
        if (metadata.type === "label") {
          table.ui_hints.label = change.newValue;
        }
        break;

      case "borderColor":
        if (!table.ui_hints.styling) {
          table.ui_hints.styling = {};
        }
        table.ui_hints.styling.borderColor = change.newValue;
        break;

      // Add more property mappings as needed
    }
  });

  return updatedSchema;
}

/**
 * Extract metadata from element ID
 */
function extractMetadataFromElementId(elementId: string): {
  tableName?: string;
  columnName?: string;
  type?: string;
} | null {
  // Element IDs are in format: ve-{type}-{timestamp}-{random}
  // Metadata is stored separately in the element
  // This is a placeholder - actual implementation would need to track metadata
  return null;
}

/**
 * Convert visual changes to chat message
 */
export function visualChangesToChatMessage(changes: PropertyChange[]): string {
  if (changes.length === 0) return "";

  const changeDescriptions = changes.map(change => {
    const property = change.property.replace(/([A-Z])/g, " $1").toLowerCase();
    return `Changed ${property} to ${change.newValue}`;
  });

  return changeDescriptions.join(", ");
}

/**
 * Group changes by element
 */
export function groupChangesByElement(
  changes: PropertyChange[]
): Map<string, PropertyChange[]> {
  const grouped = new Map<string, PropertyChange[]>();

  changes.forEach(change => {
    const existing = grouped.get(change.elementId) || [];
    existing.push(change);
    grouped.set(change.elementId, existing);
  });

  return grouped;
}
