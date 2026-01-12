/**
 * @fileoverview Mobile bottom navigation bar for dashboard.
 * 
 * Reasoning:
 * - Fixed bottom navigation for mobile devices
 * - Shows only on screens < 768px
 * - Quick access to main sections
 * 
 * Dependencies:
 * - lib/hooks/use-project for project state
 */

"use client"

import { Home, Table2, Search, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MobileNavProps {
    className?: string
}

export function MobileNav({ className }: MobileNavProps) {
    const pathname = usePathname()

    const navItems = [
        { href: "/dashboard", label: "Home", icon: Home },
        { href: "/dashboard/tables", label: "Tables", icon: Table2 },
        { href: "/dashboard/search", label: "Search", icon: Search },
        { href: "/dashboard/profile", label: "Profile", icon: User },
    ]

    return (
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 border-t border-border bg-card z-50",
            className
        )}>
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-xs">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
