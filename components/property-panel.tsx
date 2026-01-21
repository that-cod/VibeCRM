"use client";

/**
 * @fileoverview Property panel for visual editing
 * 
 * Phase 3: Visual Editing
 * Allows editing element properties with visual controls
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Palette, Type, Box, Square } from "lucide-react";
import type { SelectedElement, ElementProperties, PropertyGroup } from "@/lib/visual-editor/types";
import { PROPERTY_GROUPS } from "@/lib/visual-editor/types";

interface PropertyPanelProps {
  element: SelectedElement | null;
  onPropertyChange: (property: keyof ElementProperties, value: any) => void;
  onClose: () => void;
}

export function PropertyPanel({ element, onPropertyChange, onClose }: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("colors");

  if (!element) {
    return null;
  }

  const tabs = [
    { id: "colors", label: "Colors", icon: Palette },
    { id: "typography", label: "Text", icon: Type },
    { id: "spacing", label: "Spacing", icon: Box },
    { id: "border", label: "Border", icon: Square },
  ];

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white border-l shadow-xl flex flex-col z-50">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-900">Edit Element</h3>
          <p className="text-xs text-gray-500 mt-0.5">{element.type.replace(/_/g, " ")}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b bg-gray-50">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="h-4 w-4 mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {PROPERTY_GROUPS.filter(group => 
          group.title.toLowerCase() === activeTab || 
          (activeTab === "colors" && group.title === "Colors") ||
          (activeTab === "typography" && group.title === "Typography") ||
          (activeTab === "spacing" && group.title === "Spacing") ||
          (activeTab === "border" && group.title === "Border")
        ).map((group) => (
          <PropertyGroupSection
            key={group.title}
            group={group}
            element={element}
            onPropertyChange={onPropertyChange}
          />
        ))}

        {/* Content Properties */}
        {element.type === "text" || element.type === "button" || element.type === "label" ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">Content</h4>
            <div className="space-y-2">
              <Label htmlFor="text" className="text-xs">Text</Label>
              <Input
                id="text"
                value={element.properties.text || ""}
                onChange={(e) => onPropertyChange("text", e.target.value)}
                placeholder="Enter text..."
                className="text-sm"
              />
            </div>
          </div>
        ) : null}

        {/* Metadata */}
        {element.metadata && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h4>
            <div className="space-y-2 text-xs">
              {element.metadata.tableName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Table:</span>
                  <span className="font-medium">{element.metadata.tableName}</span>
                </div>
              )}
              {element.metadata.columnName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Column:</span>
                  <span className="font-medium">{element.metadata.columnName}</span>
                </div>
              )}
              {element.metadata.fieldName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Field:</span>
                  <span className="font-medium">{element.metadata.fieldName}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4 bg-gray-50">
        <Button onClick={onClose} className="w-full" size="sm">
          Done Editing
        </Button>
      </div>
    </div>
  );
}

/**
 * Property group section component
 */
function PropertyGroupSection({
  group,
  element,
  onPropertyChange,
}: {
  group: PropertyGroup;
  element: SelectedElement;
  onPropertyChange: (property: keyof ElementProperties, value: any) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-900">{group.title}</h4>
      <div className="space-y-3">
        {group.properties.map((prop) => (
          <PropertyControl
            key={prop.key}
            property={prop}
            value={element.properties[prop.key]}
            onChange={(value) => onPropertyChange(prop.key, value)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual property control component
 */
function PropertyControl({
  property,
  value,
  onChange,
}: {
  property: any;
  value: any;
  onChange: (value: any) => void;
}) {
  switch (property.type) {
    case "color":
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key} className="text-xs">{property.label}</Label>
          <div className="flex gap-2">
            <Input
              id={property.key}
              type="color"
              value={rgbToHex(value) || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 text-sm font-mono"
            />
          </div>
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key} className="text-xs">{property.label}</Label>
          <select
            id={property.key}
            value={value || property.options?.[0] || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {property.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key} className="text-xs">{property.label}</Label>
          <Input
            id={property.key}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={property.placeholder}
            className="text-sm"
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={property.key} className="text-xs">{property.label}</Label>
          <Input
            id={property.key}
            type="number"
            value={value || property.min || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            min={property.min}
            max={property.max}
            step={property.step}
            className="text-sm"
          />
        </div>
      );

    case "toggle":
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={property.key} className="text-xs">{property.label}</Label>
          <button
            id={property.key}
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Convert RGB color to hex
 */
function rgbToHex(rgb: string | undefined): string | null {
  if (!rgb) return null;
  
  // Already hex
  if (rgb.startsWith("#")) return rgb;
  
  // Parse rgb(r, g, b) or rgba(r, g, b, a)
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
