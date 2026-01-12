/**
 * @fileoverview Dashboard sidebar with dynamic navigation from schema.
 * 
 * Reasoning:
 * - Generates navigation items from active schema tables
 * - Shows project selector
 * - Provides quick links to common pages
 * 
 * Dependencies:
 * - lib/hooks/use-project for schema data
 */

"use client"

import { useProject } from "@/lib/hooks/use-project"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Sparkles, History, Settings, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DashboardSidebarProps {
    className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
    const { currentProject, activeSchema, projects, switchProject } = useProject()
    const pathname = usePathname()

    const navItems = [
        { href: "/dashboard", label: "Home", icon: Home },
        { href: "/", label: "Schema Generator", icon: Sparkles },
    ]

    return (
        <aside className={cn("w-64 border-r border-border bg-card p-6", className)}>
            {/* Project Selector */}
            <div className="mb-8">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                    CURRENT PROJECT
                </div>
                {currentProject ? (
                    <div className="p-2 rounded-md border border-border bg-background/50">
                        <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{currentProject.name}</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">No project selected</div>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="space-y-1 mb-8">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Tables Section */}
            {activeSchema && activeSchema.tables.length > 0 && (
                <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-3">
                        TABLES
                    </div>
                    <nav className="space-y-1">
                        {activeSchema.tables.map((table) => {
                            const href = `/dashboard/tables/${table.name}`
                            const isActive = pathname === href
                            return (
                                <Link key={table.name} href={href}>
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                            isActive
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                        )}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                                        <span className="truncate">
                                            {table.ui_hints?.label || table.name}
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            )}

            {/* Bottom Links */}
            <div className="absolute bottom-6 left-6 right-6 space-y-1">
                <Link href="/dashboard/vibe-replay">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <History className="h-4 w-4" />
                        <span>Vibe Replay</span>
                    </div>
                </Link>
                <Link href="/dashboard/settings">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                    </div>
                </Link>
            </div>
        </aside>
    )
}
