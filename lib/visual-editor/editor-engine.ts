/**
 * @fileoverview Visual editor engine for element selection and manipulation
 * 
 * Phase 3: Visual Editing
 * Manages element selection, hover states, and property changes
 */

import type {
  SelectedElement,
  ElementProperties,
  PropertyChange,
  VisualEditorState,
  EditableElementType,
} from "./types";

export class VisualEditorEngine {
  private state: VisualEditorState = {
    isEnabled: false,
    selectedElement: null,
    hoveredElement: null,
    mode: "select",
    changes: [],
    isDirty: false,
  };

  private iframe: HTMLIFrameElement | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Initialize the visual editor with an iframe
   */
  initialize(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupIframeListeners();
  }

  /**
   * Enable visual editing mode
   */
  enable() {
    if (!this.iframe) return;

    this.state.isEnabled = true;
    this.injectEditorStyles();
    this.enableElementSelection();
    this.emit("stateChange", this.state);
  }

  /**
   * Disable visual editing mode
   */
  disable() {
    if (!this.iframe) return;

    this.state.isEnabled = false;
    this.state.selectedElement = null;
    this.state.hoveredElement = null;
    this.removeEditorStyles();
    this.disableElementSelection();
    this.emit("stateChange", this.state);
  }

  /**
   * Select an element for editing
   */
  selectElement(element: SelectedElement) {
    this.state.selectedElement = element;
    this.highlightElement(element);
    this.emit("elementSelected", element);
    this.emit("stateChange", this.state);
  }

  /**
   * Deselect current element
   */
  deselectElement() {
    if (this.state.selectedElement) {
      this.unhighlightElement(this.state.selectedElement);
    }
    this.state.selectedElement = null;
    this.emit("elementDeselected", {});
    this.emit("stateChange", this.state);
  }

  /**
   * Update property of selected element
   */
  updateProperty(property: keyof ElementProperties, value: any) {
    if (!this.state.selectedElement) return;

    const oldValue = this.state.selectedElement.properties[property];

    // Record change
    const change: PropertyChange = {
      elementId: this.state.selectedElement.id,
      property,
      oldValue,
      newValue: value,
      timestamp: Date.now(),
    };

    this.state.changes.push(change);
    this.state.isDirty = true;

    // Update element properties
    this.state.selectedElement.properties[property] = value;

    // Apply change to DOM
    this.applyPropertyChange(this.state.selectedElement, property, value);

    this.emit("propertyChanged", change);
    this.emit("stateChange", this.state);
  }

  /**
   * Get current state
   */
  getState(): VisualEditorState {
    return { ...this.state };
  }

  /**
   * Get all changes
   */
  getChanges(): PropertyChange[] {
    return [...this.state.changes];
  }

  /**
   * Clear all changes
   */
  clearChanges() {
    this.state.changes = [];
    this.state.isDirty = false;
    this.emit("stateChange", this.state);
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

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
   * Inject editor styles into iframe
   */
  private injectEditorStyles() {
    if (!this.iframe?.contentDocument) return;

    const style = this.iframe.contentDocument.createElement("style");
    style.id = "visual-editor-styles";
    style.textContent = `
      .ve-editable {
        cursor: pointer !important;
        transition: outline 0.2s ease, box-shadow 0.2s ease;
      }
      
      .ve-editable:hover {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px;
      }
      
      .ve-selected {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1) !important;
      }
      
      .ve-editing-enabled * {
        user-select: none !important;
      }
    `;

    this.iframe.contentDocument.head.appendChild(style);
    this.iframe.contentDocument.body.classList.add("ve-editing-enabled");
  }

  /**
   * Remove editor styles from iframe
   */
  private removeEditorStyles() {
    if (!this.iframe?.contentDocument) return;

    const style = this.iframe.contentDocument.getElementById("visual-editor-styles");
    if (style) {
      style.remove();
    }

    this.iframe.contentDocument.body.classList.remove("ve-editing-enabled");

    // Remove all editor classes
    this.iframe.contentDocument.querySelectorAll(".ve-editable, .ve-selected").forEach(el => {
      el.classList.remove("ve-editable", "ve-selected");
    });
  }

  /**
   * Enable element selection in iframe
   */
  private enableElementSelection() {
    if (!this.iframe?.contentDocument) return;

    // Mark editable elements
    const editableSelectors = [
      "button",
      "h1, h2, h3, h4, h5, h6",
      "p",
      "span",
      "div[class*='bg-']",
      "div[class*='border']",
      "table th",
      "table td",
    ];

    editableSelectors.forEach(selector => {
      this.iframe!.contentDocument!.querySelectorAll(selector).forEach(el => {
        (el as HTMLElement).classList.add("ve-editable");
        (el as HTMLElement).dataset.veType = this.getElementType(el as HTMLElement);
      });
    });
  }

  /**
   * Disable element selection
   */
  private disableElementSelection() {
    if (!this.iframe?.contentDocument) return;

    this.iframe.contentDocument.querySelectorAll(".ve-editable").forEach(el => {
      el.classList.remove("ve-editable");
      delete (el as HTMLElement).dataset.veType;
    });
  }

  /**
   * Setup iframe event listeners
   */
  private setupIframeListeners() {
    if (!this.iframe) return;

    // Listen for clicks in iframe
    this.iframe.addEventListener("load", () => {
      if (!this.iframe?.contentDocument) return;

      this.iframe.contentDocument.addEventListener("click", (e) => {
        if (!this.state.isEnabled) return;

        e.preventDefault();
        e.stopPropagation();

        const target = e.target as HTMLElement;
        if (target.classList.contains("ve-editable")) {
          const element = this.extractElementData(target);
          this.selectElement(element);
        }
      });

      // Listen for hover
      this.iframe!.contentDocument!.addEventListener("mouseover", (e) => {
        if (!this.state.isEnabled) return;

        const target = e.target as HTMLElement;
        if (target.classList.contains("ve-editable")) {
          const element = this.extractElementData(target);
          this.state.hoveredElement = element;
          this.emit("elementHovered", element);
        }
      });

      this.iframe!.contentDocument!.addEventListener("mouseout", () => {
        if (!this.state.isEnabled) return;
        this.state.hoveredElement = null;
        this.emit("elementUnhovered", {});
      });
    });
  }

  /**
   * Extract element data from DOM element
   */
  private extractElementData(element: HTMLElement): SelectedElement {
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    return {
      id: this.generateElementId(element),
      type: (element.dataset.veType as EditableElementType) || "container",
      path: this.getElementPath(element),
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      },
      properties: {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        padding: computedStyle.padding,
        margin: computedStyle.margin,
        borderRadius: computedStyle.borderRadius,
        borderColor: computedStyle.borderColor,
        borderWidth: computedStyle.borderWidth,
        text: element.textContent || "",
      },
      metadata: {
        tableName: element.dataset.tableName,
        columnName: element.dataset.columnName,
        fieldName: element.dataset.fieldName,
      },
    };
  }

  /**
   * Generate unique ID for element
   */
  private generateElementId(element: HTMLElement): string {
    return `ve-${element.tagName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get DOM path to element
   */
  private getElementPath(element: HTMLElement): string[] {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== this.iframe?.contentDocument?.body) {
      const index = Array.from(current.parentElement?.children || []).indexOf(current);
      path.unshift(`${current.tagName.toLowerCase()}:${index}`);
      current = current.parentElement;
    }

    return path;
  }

  /**
   * Get element type from DOM element
   */
  private getElementType(element: HTMLElement): EditableElementType {
    const tag = element.tagName.toLowerCase();

    if (tag === "button") return "button";
    if (tag === "input") return "input";
    if (tag === "label") return "label";
    if (tag === "th") return "table_header";
    if (tag === "td") return "table_cell";
    if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "span"].includes(tag)) return "text";

    return "container";
  }

  /**
   * Highlight selected element
   */
  private highlightElement(element: SelectedElement) {
    if (!this.iframe?.contentDocument) return;

    // Remove previous selection
    this.iframe.contentDocument.querySelectorAll(".ve-selected").forEach(el => {
      el.classList.remove("ve-selected");
    });

    // Find and highlight element
    const domElement = this.findElementByPath(element.path);
    if (domElement) {
      domElement.classList.add("ve-selected");
    }
  }

  /**
   * Remove highlight from element
   */
  private unhighlightElement(element: SelectedElement) {
    if (!this.iframe?.contentDocument) return;

    const domElement = this.findElementByPath(element.path);
    if (domElement) {
      domElement.classList.remove("ve-selected");
    }
  }

  /**
   * Find element by path
   */
  private findElementByPath(path: string[]): HTMLElement | null {
    if (!this.iframe?.contentDocument) return null;

    let current: Element = this.iframe.contentDocument.body;

    for (const segment of path) {
      const [tag, indexStr] = segment.split(":");
      const index = parseInt(indexStr, 10);
      const children = Array.from(current.children).filter(
        child => child.tagName.toLowerCase() === tag
      );

      if (index >= children.length) return null;
      current = children[index];
    }

    return current as HTMLElement;
  }

  /**
   * Apply property change to DOM element
   */
  private applyPropertyChange(
    element: SelectedElement,
    property: keyof ElementProperties,
    value: any
  ) {
    const domElement = this.findElementByPath(element.path);
    if (!domElement) return;

    switch (property) {
      case "backgroundColor":
        domElement.style.backgroundColor = value;
        break;
      case "color":
        domElement.style.color = value;
        break;
      case "fontSize":
        domElement.style.fontSize = value;
        break;
      case "fontWeight":
        domElement.style.fontWeight = value;
        break;
      case "padding":
        domElement.style.padding = value;
        break;
      case "margin":
        domElement.style.margin = value;
        break;
      case "borderRadius":
        domElement.style.borderRadius = value;
        break;
      case "borderColor":
        domElement.style.borderColor = value;
        break;
      case "borderWidth":
        domElement.style.borderWidth = value;
        break;
      case "text":
        domElement.textContent = value;
        break;
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    this.disable();
    this.iframe = null;
    this.listeners.clear();
  }
}

/**
 * Create a new visual editor engine
 */
export function createVisualEditorEngine(): VisualEditorEngine {
  return new VisualEditorEngine();
}
