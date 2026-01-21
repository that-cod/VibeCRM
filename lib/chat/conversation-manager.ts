/**
 * @fileoverview Conversation manager for chat-based schema refinement
 * 
 * Phase 2: Chat-Based Iteration
 * Manages conversation state, history, and undo/redo
 */

import type { CRMSchema } from "@/types/schema";
import type {
  ChatMessage,
  ConversationState,
  RefineIntent,
  SchemaChanges,
} from "./types";

export class ConversationManager {
  private state: ConversationState = {
    messages: [],
    currentSchema: null,
    schemaHistory: [],
    historyIndex: -1,
    isProcessing: false,
    error: null,
  };

  private listeners: Map<string, Set<(state: ConversationState) => void>> = new Map();

  /**
   * Initialize with a schema
   */
  initialize(schema: CRMSchema) {
    this.state.currentSchema = schema;
    this.state.schemaHistory = [schema];
    this.state.historyIndex = 0;
    this.state.messages = [
      {
        id: this.generateId(),
        role: "assistant",
        content: "I've generated your CRM schema. You can now refine it by asking me to make changes. For example: 'Add a status column to properties' or 'Add dark mode'.",
        timestamp: Date.now(),
      },
    ];
    this.notifyListeners();
  }

  /**
   * Add a user message and process it
   */
  async addUserMessage(content: string): Promise<void> {
    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    this.state.messages.push(userMessage);
    this.state.isProcessing = true;
    this.state.error = null;
    this.notifyListeners();

    try {
      // Process the message (will be implemented with AI)
      const response = await this.processMessage(content);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: this.generateId(),
        role: "assistant",
        content: response.message,
        timestamp: Date.now(),
        metadata: {
          intent: response.intent,
          changes: response.changes,
        },
      };

      this.state.messages.push(assistantMessage);

      // Update schema if changes were made
      if (response.updatedSchema) {
        this.updateSchema(response.updatedSchema);
      }

      this.state.isProcessing = false;
      this.notifyListeners();
    } catch (error: any) {
      this.state.error = error.message;
      this.state.isProcessing = false;

      // Add error message
      const errorMessage: ChatMessage = {
        id: this.generateId(),
        role: "assistant",
        content: `I encountered an error: ${error.message}. Please try rephrasing your request.`,
        timestamp: Date.now(),
        metadata: {
          error: error.message,
        },
      };

      this.state.messages.push(errorMessage);
      this.notifyListeners();
    }
  }

  /**
   * Process a user message and generate response
   */
  private async processMessage(content: string): Promise<{
    intent: RefineIntent;
    message: string;
    changes: SchemaChanges[];
    updatedSchema: CRMSchema | null;
  }> {
    if (!this.state.currentSchema) {
      throw new Error("No schema loaded");
    }

    // Call the refine API endpoint
    const response = await fetch("/api/v1/refine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: content,
        current_schema: this.state.currentSchema,
        conversation_history: this.state.messages.slice(-5), // Last 5 messages for context
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process message");
    }

    const data = await response.json();

    return {
      intent: data.intent,
      message: data.message,
      changes: data.changes || [],
      updatedSchema: data.updated_schema,
    };
  }

  /**
   * Update schema and add to history
   */
  private updateSchema(newSchema: CRMSchema) {
    // Remove any history after current index (for redo)
    this.state.schemaHistory = this.state.schemaHistory.slice(
      0,
      this.state.historyIndex + 1
    );

    // Add new schema
    this.state.schemaHistory.push(newSchema);
    this.state.historyIndex++;
    this.state.currentSchema = newSchema;
  }

  /**
   * Undo last change
   */
  undo(): boolean {
    if (!this.canUndo()) return false;

    this.state.historyIndex--;
    this.state.currentSchema = this.state.schemaHistory[this.state.historyIndex];

    // Add system message
    this.state.messages.push({
      id: this.generateId(),
      role: "system",
      content: "Undid last change",
      timestamp: Date.now(),
    });

    this.notifyListeners();
    return true;
  }

  /**
   * Redo last undone change
   */
  redo(): boolean {
    if (!this.canRedo()) return false;

    this.state.historyIndex++;
    this.state.currentSchema = this.state.schemaHistory[this.state.historyIndex];

    // Add system message
    this.state.messages.push({
      id: this.generateId(),
      role: "system",
      content: "Redid change",
      timestamp: Date.now(),
    });

    this.notifyListeners();
    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.state.historyIndex < this.state.schemaHistory.length - 1;
  }

  /**
   * Get current state
   */
  getState(): ConversationState {
    return { ...this.state };
  }

  /**
   * Get current schema
   */
  getCurrentSchema(): CRMSchema | null {
    return this.state.currentSchema;
  }

  /**
   * Get messages
   */
  getMessages(): ChatMessage[] {
    return [...this.state.messages];
  }

  /**
   * Clear conversation
   */
  clear() {
    this.state.messages = [];
    this.state.schemaHistory = this.state.currentSchema
      ? [this.state.currentSchema]
      : [];
    this.state.historyIndex = this.state.currentSchema ? 0 : -1;
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: ConversationState) => void): () => void {
    const event = "stateChange";
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.get("stateChange")?.forEach((callback) => {
      callback(this.state);
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create a new conversation manager
 */
export function createConversationManager(): ConversationManager {
  return new ConversationManager();
}
