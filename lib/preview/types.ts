/**
 * @fileoverview Type definitions for preview system
 * 
 * Phase 1: Live Preview Infrastructure
 * Core types for preview engine, mock data, and component rendering
 */

import type { CRMSchema, TableDefinition } from "@/types/schema";

export interface PreviewConfig {
  schema: CRMSchema;
  viewMode: "desktop" | "mobile";
  theme: "light" | "dark";
}

export interface MockRecord {
  id: string;
  user_id: string;
  [key: string]: any;
  created_at: string;
  updated_at: string;
}

export interface MockTableData {
  tableName: string;
  records: MockRecord[];
}

export interface PreviewComponent {
  path: string;
  code: string;
  type: "page" | "component";
}

export interface PreviewUpdate {
  type: "FULL_RENDER" | "PARTIAL_UPDATE" | "STYLE_CHANGE";
  components?: PreviewComponent[];
  changes?: Partial<CRMSchema>;
  timestamp: number;
}

export interface PreviewState {
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  currentRoute: string;
}

export interface PreviewMessage {
  type: "INIT" | "UPDATE" | "NAVIGATE" | "RELOAD" | "ERROR" | "PREVIEW_READY";
  payload: any;
}
