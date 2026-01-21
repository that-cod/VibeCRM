"use client";

/**
 * @fileoverview Preview iframe component
 * 
 * Phase 1: Live Preview Infrastructure
 * Displays the live preview of generated CRM in an iframe
 */

import { useEffect, useRef, useState } from "react";
import { Loader2, Smartphone, Monitor, RefreshCw, Edit3, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewEngine, createPreviewEngine } from "@/lib/preview/preview-engine";
import { VisualEditorEngine, createVisualEditorEngine } from "@/lib/visual-editor/editor-engine";
import { PropertyPanel } from "@/components/property-panel";
import type { CRMSchema } from "@/types/schema";
import type { SelectedElement, ElementProperties } from "@/lib/visual-editor/types";

interface PreviewFrameProps {
  schema: CRMSchema | null;
  viewMode?: "desktop" | "mobile";
  theme?: "light" | "dark";
  onNavigate?: (path: string) => void;
  onError?: (error: Error) => void;
}

export function PreviewFrame({
  schema,
  viewMode = "desktop",
  theme = "light",
  onNavigate,
  onError,
}: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const engineRef = useRef<PreviewEngine | null>(null);
  const visualEditorRef = useRef<VisualEditorEngine | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState("/");
  const [isReady, setIsReady] = useState(false);
  
  // Visual editor state
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

  // Initialize preview engine and visual editor
  useEffect(() => {
    if (!iframeRef.current) return;

    const engine = createPreviewEngine();
    engine.initialize(iframeRef.current);
    engineRef.current = engine;
    
    const visualEditor = createVisualEditorEngine();
    visualEditor.initialize(iframeRef.current);
    visualEditorRef.current = visualEditor;

    // Subscribe to events
    const unsubReady = engine.on("ready", () => {
      setIsReady(true);
      setIsLoading(false);
    });

    const unsubNavigate = engine.on("navigate", (data: any) => {
      setCurrentPath(data.path);
      onNavigate?.(data.path);
    });

    const unsubError = engine.on("error", (data: any) => {
      setError(data.message);
      onError?.(new Error(data.message));
    });

    const unsubStateChange = engine.on("stateChange", (state: any) => {
      setIsLoading(state.isLoading);
      setError(state.error);
    });
    
    // Visual editor subscriptions
    const unsubElementSelected = visualEditor.on("elementSelected", (element: SelectedElement) => {
      setSelectedElement(element);
    });
    
    const unsubElementDeselected = visualEditor.on("elementDeselected", () => {
      setSelectedElement(null);
    });

    return () => {
      unsubReady();
      unsubNavigate();
      unsubError();
      unsubStateChange();
      unsubElementSelected();
      unsubElementDeselected();
      engine.destroy();
      visualEditor.destroy();
    };
  }, [onNavigate, onError]);

  // Render schema when it changes
  useEffect(() => {
    if (!schema || !engineRef.current) return;

    setIsLoading(true);
    setError(null);
    setIsReady(false);

    engineRef.current
      .renderSchema(schema, { theme, viewMode })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [schema, theme]);

  const handleRefresh = () => {
    engineRef.current?.reload();
  };

  const handleNavigateHome = () => {
    engineRef.current?.navigate("/");
  };
  
  const handleToggleEditMode = () => {
    if (!visualEditorRef.current) return;
    
    if (isEditMode) {
      visualEditorRef.current.disable();
      setIsEditMode(false);
      setSelectedElement(null);
    } else {
      visualEditorRef.current.enable();
      setIsEditMode(true);
    }
  };
  
  const handlePropertyChange = (property: keyof ElementProperties, value: any) => {
    if (!visualEditorRef.current) return;
    visualEditorRef.current.updateProperty(property, value);
  };
  
  const handleClosePropertyPanel = () => {
    visualEditorRef.current?.deselectElement();
    setSelectedElement(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Current Path */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-mono bg-gray-100 px-3 py-1 rounded">
              {currentPath}
            </span>
          </div>

          {/* Status Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading preview...</span>
            </div>
          )}

          {isReady && !isLoading && (
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
              <span className="text-sm">Live</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          <Button
            variant={isEditMode ? "default" : "ghost"}
            size="sm"
            onClick={handleToggleEditMode}
            disabled={isLoading || !isReady}
            className="gap-2"
          >
            {isEditMode ? (
              <>
                <Eye className="h-4 w-4" />
                Preview
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit
              </>
            )}
          </Button>
          
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          {/* Home Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNavigateHome}
            disabled={isLoading}
          >
            Home
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
            <div className="text-center max-w-md p-6">
              <div className="text-red-600 mb-4">
                <svg
                  className="h-16 w-16 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Preview Error
              </h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Generating preview...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!schema && !isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md p-6">
              <div className="text-gray-400 mb-4">
                <svg
                  className="h-24 w-24 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Preview Yet
              </h3>
              <p className="text-gray-600">
                Enter a prompt to generate your CRM and see a live preview
              </p>
            </div>
          </div>
        )}

        {/* Iframe Container */}
        <div
          className={`h-full transition-all duration-300 ${
            viewMode === "mobile"
              ? "max-w-[375px] mx-auto border-x-8 border-gray-800 rounded-3xl overflow-hidden"
              : "w-full"
          }`}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0 bg-white"
            title="CRM Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* View Mode Toggle (Bottom Right) */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border p-1 flex gap-1">
        <Button
          variant={viewMode === "desktop" ? "default" : "ghost"}
          size="sm"
          onClick={() => {}}
          className="gap-2"
        >
          <Monitor className="h-4 w-4" />
          Desktop
        </Button>
        <Button
          variant={viewMode === "mobile" ? "default" : "ghost"}
          size="sm"
          onClick={() => {}}
          className="gap-2"
        >
          <Smartphone className="h-4 w-4" />
          Mobile
        </Button>
      </div>
      
      {/* Property Panel */}
      {isEditMode && selectedElement && (
        <PropertyPanel
          element={selectedElement}
          onPropertyChange={handlePropertyChange}
          onClose={handleClosePropertyPanel}
        />
      )}
      
      {/* Edit Mode Indicator */}
      {isEditMode && !selectedElement && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
          Click any element to edit
        </div>
      )}
    </div>
  );
}
