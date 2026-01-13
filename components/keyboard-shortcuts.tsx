/**
 * @fileoverview Keyboard Shortcuts UI Components
 *
 * Reasoning:
 * - UI components for displaying keyboard shortcuts
 * - Keyboard shortcut hint badge
 * - Shortcuts reference component
 */

"use client";

import { cn } from "@/lib/utils";
import { isMac, getShortcutDisplay } from "@/lib/hooks/use-keyboard-shortcuts";
import { useEffect, useState } from "react";

export function KeyboardShortcutHint({ className }: { className?: string }) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
        className
      )}
    >
      <span className="text-xs">⌘</span>K
    </kbd>
  );
}

export function KeyboardShortcutBadge({
  key,
  modifiers,
  className,
}: {
  key: string;
  modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean };
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
        className
      )}
    >
      {getShortcutDisplay(key, modifiers)}
    </kbd>
  );
}

export function ShortcutsReference({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const shortcuts = [
    { label: "Command Palette", key: "k", modifiers: { meta: true } },
    { label: "Vibe Replay", key: "/", modifiers: { meta: true } },
    { label: "New Resource", key: "n", modifiers: { meta: true } },
    { label: "Close Modal", key: "Escape", modifiers: {} },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium">Keyboard Shortcuts</h4>
      <div className="grid gap-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{shortcut.label}</span>
            <KeyboardShortcutBadge
              key={shortcut.key}
              modifiers={shortcut.modifiers}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
