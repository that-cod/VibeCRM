/**
 * @fileoverview Type definitions for visual editor
 * 
 * Phase 3: Visual Editing
 * Types for element selection, property editing, and visual changes
 */

export type EditableElementType = 
  | "table_card"
  | "table_header"
  | "table_cell"
  | "button"
  | "text"
  | "container"
  | "input"
  | "label";

export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedElement {
  id: string;
  type: EditableElementType;
  path: string[]; // DOM path to element
  position: ElementPosition;
  properties: ElementProperties;
  metadata?: {
    tableName?: string;
    columnName?: string;
    fieldName?: string;
  };
}

export interface ElementProperties {
  // Style properties
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  
  // Content properties
  text?: string;
  placeholder?: string;
  label?: string;
  
  // Data properties
  dataField?: string;
  dataType?: string;
  
  // Layout properties
  display?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
}

export interface PropertyChange {
  elementId: string;
  property: keyof ElementProperties;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface VisualEditorState {
  isEnabled: boolean;
  selectedElement: SelectedElement | null;
  hoveredElement: SelectedElement | null;
  mode: "select" | "edit" | "drag";
  changes: PropertyChange[];
  isDirty: boolean;
}

export interface EditableProperty {
  key: keyof ElementProperties;
  label: string;
  type: "color" | "text" | "number" | "select" | "toggle";
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface PropertyGroup {
  title: string;
  properties: EditableProperty[];
}

export const PROPERTY_GROUPS: PropertyGroup[] = [
  {
    title: "Colors",
    properties: [
      { key: "backgroundColor", label: "Background", type: "color" },
      { key: "color", label: "Text Color", type: "color" },
      { key: "borderColor", label: "Border Color", type: "color" },
    ],
  },
  {
    title: "Typography",
    properties: [
      { 
        key: "fontSize", 
        label: "Font Size", 
        type: "select",
        options: ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"]
      },
      { 
        key: "fontWeight", 
        label: "Font Weight", 
        type: "select",
        options: ["font-normal", "font-medium", "font-semibold", "font-bold"]
      },
    ],
  },
  {
    title: "Spacing",
    properties: [
      { 
        key: "padding", 
        label: "Padding", 
        type: "select",
        options: ["p-0", "p-1", "p-2", "p-3", "p-4", "p-6", "p-8"]
      },
      { 
        key: "margin", 
        label: "Margin", 
        type: "select",
        options: ["m-0", "m-1", "m-2", "m-3", "m-4", "m-6", "m-8"]
      },
      { 
        key: "gap", 
        label: "Gap", 
        type: "select",
        options: ["gap-0", "gap-1", "gap-2", "gap-3", "gap-4", "gap-6", "gap-8"]
      },
    ],
  },
  {
    title: "Border",
    properties: [
      { 
        key: "borderRadius", 
        label: "Radius", 
        type: "select",
        options: ["rounded-none", "rounded-sm", "rounded", "rounded-md", "rounded-lg", "rounded-xl", "rounded-full"]
      },
      { 
        key: "borderWidth", 
        label: "Width", 
        type: "select",
        options: ["border-0", "border", "border-2", "border-4"]
      },
    ],
  },
  {
    title: "Content",
    properties: [
      { key: "text", label: "Text", type: "text" },
      { key: "label", label: "Label", type: "text" },
      { key: "placeholder", label: "Placeholder", type: "text" },
    ],
  },
];
