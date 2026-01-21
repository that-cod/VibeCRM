/**
 * @fileoverview Core preview engine for rendering schemas in real-time
 * 
 * Phase 1: Live Preview Infrastructure
 * Manages iframe communication, component rendering, and hot reload
 */

import type { CRMSchema } from "@/types/schema";
import type { PreviewConfig, PreviewState, PreviewMessage, MockTableData } from "./types";
import { generateMockData } from "./mock-data-generator";
import { generatePreviewComponents, generatePreviewHTML } from "./component-renderer";

export class PreviewEngine {
  private iframe: HTMLIFrameElement | null = null;
  private schema: CRMSchema | null = null;
  private mockData: MockTableData[] = [];
  private state: PreviewState = {
    isLoading: false,
    error: null,
    lastUpdate: Date.now(),
    currentRoute: "/",
  };
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Initialize the preview engine with an iframe element
   */
  initialize(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupMessageListener();
  }

  /**
   * Render a schema in the preview
   */
  async renderSchema(schema: CRMSchema, config?: Partial<PreviewConfig>): Promise<void> {
    if (!this.iframe) {
      throw new Error("Preview engine not initialized");
    }

    this.state.isLoading = true;
    this.state.error = null;
    this.emit("stateChange", this.state);

    try {
      // Store schema
      this.schema = schema;

      // Generate mock data
      this.mockData = generateMockData(schema);

      // Generate components
      const components = generatePreviewComponents(schema, this.mockData);

      // Generate HTML
      const html = generatePreviewHTML(components, config?.theme || "light");

      // Load into iframe
      await this.loadHTML(html);

      this.state.isLoading = false;
      this.state.lastUpdate = Date.now();
      this.emit("stateChange", this.state);
      this.emit("renderComplete", { schema, components });
    } catch (error: any) {
      this.state.isLoading = false;
      this.state.error = error.message;
      this.emit("stateChange", this.state);
      this.emit("renderError", error);
      throw error;
    }
  }

  /**
   * Update the preview with schema changes (hot reload)
   */
  async updateSchema(changes: Partial<CRMSchema>): Promise<void> {
    if (!this.schema) {
      throw new Error("No schema loaded");
    }

    // Merge changes into current schema
    this.schema = { ...this.schema, ...changes };

    // Re-render (in production, this would be optimized to only update changed parts)
    await this.renderSchema(this.schema);
  }

  /**
   * Navigate to a different route in the preview
   */
  navigate(path: string) {
    if (!this.iframe) return;

    this.state.currentRoute = path;
    this.sendMessage({
      type: "NAVIGATE",
      payload: { path },
    });
  }

  /**
   * Reload the preview
   */
  reload() {
    if (!this.iframe) return;

    this.sendMessage({
      type: "RELOAD",
      payload: {},
    });
  }

  /**
   * Get current state
   */
  getState(): PreviewState {
    return { ...this.state };
  }

  /**
   * Get current schema
   */
  getSchema(): CRMSchema | null {
    return this.schema;
  }

  /**
   * Get mock data
   */
  getMockData(): MockTableData[] {
    return this.mockData;
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void) {
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
   * Emit an event
   */
  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Load HTML into iframe
   */
  private async loadHTML(html: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.iframe) {
        reject(new Error("No iframe"));
        return;
      }

      // Set up load listener
      const onLoad = () => {
        this.iframe?.removeEventListener("load", onLoad);
        resolve();
      };

      const onError = () => {
        this.iframe?.removeEventListener("error", onError);
        reject(new Error("Failed to load preview"));
      };

      this.iframe.addEventListener("load", onLoad);
      this.iframe.addEventListener("error", onError);

      // Write HTML to iframe
      const doc = this.iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      } else {
        reject(new Error("Cannot access iframe document"));
      }
    });
  }

  /**
   * Send message to iframe
   */
  private sendMessage(message: PreviewMessage) {
    if (!this.iframe?.contentWindow) return;

    this.iframe.contentWindow.postMessage(message, "*");
  }

  /**
   * Set up message listener for iframe communication
   */
  private setupMessageListener() {
    window.addEventListener("message", (event) => {
      // Only accept messages from our iframe
      if (event.source !== this.iframe?.contentWindow) return;

      const message = event.data as PreviewMessage;

      switch (message.type) {
        case "PREVIEW_READY":
          this.emit("ready", {});
          break;

        case "NAVIGATE":
          this.state.currentRoute = message.payload.path;
          this.emit("navigate", message.payload);
          break;

        case "ERROR":
          this.state.error = message.payload.message;
          this.emit("error", message.payload);
          break;

        default:
          // Unknown message type
          break;
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this.iframe = null;
    this.schema = null;
    this.mockData = [];
    this.listeners.clear();
  }
}

/**
 * Create a new preview engine instance
 */
export function createPreviewEngine(): PreviewEngine {
  return new PreviewEngine();
}
