/**
 * @fileoverview Dashboard layout with project provider and responsive shell.
 *
 * Reasoning:
 * - Wraps all dashboard pages with ProjectProvider
 * - Provides consistent layout shell
 * - Responsive design (sidebar on desktop, bottom nav on mobile)
 * - Command Palette integration for power users
 *
 * Dependencies:
 * - lib/hooks/use-project for project context
 * - components/dashboard-sidebar for navigation
 * - components/mobile-nav for mobile navigation
 * - components/command-palette for keyboard shortcuts
 */

import { ProjectProvider } from "@/lib/hooks/use-project"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CommandPalette } from "@/components/command-palette"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProjectProvider>
            <CommandPalette>
                <div className="flex h-screen bg-background">
                    {/* Desktop Sidebar */}
                    <DashboardSidebar className="hidden md:block" />

                    {/* Main Content */}
                    <main className="flex-1 overflow-auto pb-16 md:pb-0">
                        <div className="container mx-auto p-6">
                            {children}
                        </div>
                    </main>

                    {/* Mobile Bottom Navigation */}
                    <MobileNav className="md:hidden" />
                </div>
            </CommandPalette>
        </ProjectProvider>
    )
}
