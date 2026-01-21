/**
 * @fileoverview Type definitions for chat-based iteration system
 * 
 * Phase 2: Chat-Based Iteration
 * Types for conversation management and schema refinement
 */

import type { CRMSchema } from "@/types/schema";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: {
    intent?: RefineIntent;
    changes?: SchemaChanges[];
    error?: string;
  };
}

export type RefineIntent =
  | "ADD_TABLE"
  | "MODIFY_TABLE"
  | "DELETE_TABLE"
  | "ADD_COLUMN"
  | "MODIFY_COLUMN"
  | "DELETE_COLUMN"
  | "ADD_RELATIONSHIP"
  | "MODIFY_UI"
  | "ADD_FEATURE"
  | "FIX_ERROR"
  | "CLARIFY"
  | "OTHER";

export interface SchemaChanges {
  type: "add" | "modify" | "delete";
  target: "table" | "column" | "relationship" | "ui_hints";
  tableName?: string;
  columnName?: string;
  changes: any;
}

export interface ConversationState {
  messages: ChatMessage[];
  currentSchema: CRMSchema | null;
  schemaHistory: CRMSchema[];
  historyIndex: number;
  isProcessing: boolean;
  error: string | null;
}

export interface RefineRequest {
  message: string;
  currentSchema: CRMSchema;
  conversationHistory: ChatMessage[];
}

export interface RefineResponse {
  intent: RefineIntent;
  reasoning: string;
  changes: SchemaChanges[];
  updatedSchema: CRMSchema;
  message: string;
}
