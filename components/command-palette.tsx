/**
 * @fileoverview Command Palette Component (Cmd+K)
 *
 * Reasoning:
 * - Provides quick keyboard access to all features
 * - Inspired by VS Code and linear.app command palettes
 * - Supports navigation via keyboard arrows
 * - Searchable commands with fuzzy matching
 */

"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Command,
  Keyboard,
  Plus,
  Settings,
  Database,
  FileCode,
  History,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  category: "create" | "navigate" | "tools" | "settings";
  keywords?: string[];
}

interface CommandPaletteProps {
  children?: React.ReactNode;
}

export function CommandPalette({ children }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const commands: CommandItem[] = [
    {
      id: "new-resource",
      label: "Create New Resource",
      shortcut: "⌘N",
      icon: <Plus className="h-4 w-4" />,
      category: "create",
      keywords: ["add", "new", "create", "generate"],
      action: () => router.push("/demo/code-generate"),
    },
    {
      id: "vibe-replay",
      label: "Open Vibe Replay",
      shortcut: "⌘/",
      icon: <History className="h-4 w-4" />,
      category: "navigate",
      keywords: ["timeline", "decisions", "history", "replay"],
      action: () => {
        const match = pathname.match(/\/dashboard\/([^\/]+)/);
        if (match) {
          router.push(`/dashboard/vibe-replay/${match[1]}`);
        } else {
          router.push("/projects");
        }
      },
    },
    {
      id: "resources",
      label: "Manage Resources",
      icon: <Database className="h-4 w-4" />,
      category: "navigate",
      keywords: ["tables", "data", "crud"],
      action: () => router.push("/dashboard/resources"),
    },
    {
      id: "code-generator",
      label: "Code Generator",
      icon: <FileCode className="h-4 w-4" />,
      category: "tools",
      keywords: ["generate", "ai", "code"],
      action: () => router.push("/demo/code-generate"),
    },
    {
      id: "projects",
      label: "All Projects",
      icon: <Command className="h-4 w-4" />,
      category: "navigate",
      keywords: ["dashboard", "home"],
      action: () => router.push("/projects"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      category: "settings",
      keywords: ["preferences", "config"],
      action: () => router.push("/settings"),
    },
  ];

  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;
    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower) ||
        cmd.keywords?.some((k) => k.includes(searchLower))
    );
  }, [search, commands]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setOpen(false);
        setSearch("");
      }
    }
  };

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      create: [],
      navigate: [],
      tools: [],
      settings: [],
    };
    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[500px] p-0 gap-0 overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">ESC</span>
            </kbd>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(groupedCommands).map(([category, cmds]) =>
              cmds.length > 0 ? (
                <div key={category}>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category === "create" && "Create"}
                    {category === "navigate" && "Navigate"}
                    {category === "tools" && "Tools"}
                    {category === "settings" && "Settings"}
                  </div>
                  {cmds.map((cmd, index) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          setOpen(false);
                          setSearch("");
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                          globalIndex === selectedIndex
                            ? "bg-accent"
                            : "hover:bg-accent/50"
                        )}
                      >
                        {cmd.icon}
                        <span className="flex-1 text-left">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {globalIndex === selectedIndex && (
                          <ArrowRight className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null
            )}
          </div>
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Keyboard className="h-3 w-3" />
              <span>Navigate with arrows</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded border px-1">↵</kbd>
              <span>to select</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  return { open, setOpen };
}

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
