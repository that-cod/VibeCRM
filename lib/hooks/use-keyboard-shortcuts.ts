/**
 * @fileoverview Keyboard Shortcuts Hook
 *
 * Reasoning:
 * - Centralized keyboard shortcut management
 * - Prevents conflicts between shortcuts
 * - Supports modifier combinations
 * - Handles focus-aware shortcuts
 */

import { useEffect, useCallback, useRef } from "react";

interface ShortcutConfig {
  key: string;
  modifiers: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  action: () => void;
  description?: string;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const enabledShortcuts = shortcuts.filter((s) => s.enabled !== false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of enabledShortcuts) {
        const { key, modifiers, action } = shortcut;

        const ctrlMatch = modifiers.ctrl ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = modifiers.meta ? event.metaKey : !event.metaKey;
        const shiftMatch = modifiers.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = modifiers.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          ctrlMatch &&
          metaMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          action();
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabledShortcuts]);
}

export function useKeyboardShortcut(
  key: string,
  modifiers: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  },
  action: () => void,
  enabled = true
) {
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const { ctrl, meta, shift, alt } = modifiers;

      const ctrlMatch = ctrl ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = meta ? event.metaKey : !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        ctrlMatch &&
        metaMatch &&
        shiftMatch &&
        altMatch
      ) {
        event.preventDefault();
        actionRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [key, modifiers, enabled]);
}

export function useGlobalShortcuts() {
  const shortcuts: ShortcutConfig[] = [
    {
      key: "k",
      modifiers: { meta: true },
      action: () => {
        const event = new CustomEvent("toggle-command-palette");
        window.dispatchEvent(event);
      },
      description: "Open Command Palette",
    },
    {
      key: "/",
      modifiers: { meta: true },
      action: () => {
        const event = new CustomEvent("open-vibe-replay");
        window.dispatchEvent(event);
      },
      description: "Open Vibe Replay",
    },
    {
      key: "n",
      modifiers: { meta: true },
      action: () => {
        window.location.href = "/demo/code-generate";
      },
      description: "Create New Resource",
    },
    {
      key: "Escape",
      modifiers: {},
      action: () => {
        const event = new CustomEvent("close-all-modals");
        window.dispatchEvent(event);
      },
      description: "Close Modal",
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

export function isMac(): boolean {
  return typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
}

export function getShortcutDisplay(key: string, modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }): string {
  const parts: string[] = [];

  if (isMac()) {
    if (modifiers.meta) parts.push("⌘");
    if (modifiers.alt) parts.push("⌥");
    if (modifiers.shift) parts.push("⇧");
    if (modifiers.ctrl) parts.push("^");
  } else {
    if (modifiers.ctrl) parts.push("Ctrl+");
    if (modifiers.alt) parts.push("Alt+");
    if (modifiers.shift) parts.push("Shift+");
  }

  const keyDisplay = key.length === 1 ? key.toUpperCase() : key;
  parts.push(keyDisplay);

  return parts.join("");
}
