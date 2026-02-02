/**
 * CRM Sidebar Component
 * Dynamic navigation based on workspace configuration
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { WorkspaceConfig } from '@/types/crm-config';
import {
    LayoutDashboard,
    Settings,
    Users,
    ChevronLeft,
    ChevronRight,
    Home,
    FileText,
    Calendar,
    Grid3x3,
} from 'lucide-react';

interface SidebarProps {
    workspaceId: string;
    workspace: WorkspaceConfig;
    currentEntity?: string;
    isOpen: boolean;
    onToggle: () => void;
}

// Icon mapping for entity types
const getEntityIcon = (entityName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
        properties: Home,
        clients: Users,
        projects: FileText,
        showings: Calendar,
        products: Grid3x3,
        customers: Users,
        orders: FileText,
        invoices: FileText,
    };

    return iconMap[entityName.toLowerCase()] || FileText;
};

export function Sidebar({ workspaceId, workspace, currentEntity, isOpen, onToggle }: SidebarProps) {
    const pathname = usePathname();

    const baseUrl = `/crm/${workspaceId}`;

    // Build navigation items from workspace entities
    const entityNavItems = Object.entries(workspace.entities).map(([slug, entity]) => {
        const Icon = getEntityIcon(slug);
        return {
            name: entity.name,
            href: `${baseUrl}/${slug}`,
            icon: Icon,
            active: pathname === `${baseUrl}/${slug}` || currentEntity === slug,
        };
    });

    const navSections = [
        {
            title: 'Overview',
            items: [
                {
                    name: 'Dashboard',
                    href: `${baseUrl}/dashboard`,
                    icon: LayoutDashboard,
                    active: pathname === `${baseUrl}/dashboard`,
                },
            ],
        },
        {
            title: 'Entities',
            items: entityNavItems,
        },
        {
            title: 'Settings',
            items: [
                {
                    name: 'Team',
                    href: `${baseUrl}/settings/team`,
                    icon: Users,
                    active: pathname.startsWith(`${baseUrl}/settings/team`),
                },
                {
                    name: 'Settings',
                    href: `${baseUrl}/settings`,
                    icon: Settings,
                    active: pathname === `${baseUrl}/settings`,
                },
            ],
        },
    ];

    return (
        <>
            {/* Sidebar */}
            <aside
                className={cn(
                    'relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
                    isOpen ? 'w-64' : 'w-16'
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-semibold text-gray-900 truncate">
                                {workspace.name}
                            </h2>
                            <p className="text-xs text-gray-500 truncate">{workspace.industry}</p>
                        </div>
                    )}

                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        {isOpen ? (
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4">
                    {navSections.map((section) => (
                        <div key={section.title} className="mb-6">
                            {isOpen && (
                                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {section.title}
                                </h3>
                            )}

                            <div className="space-y-1 px-2">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                                                item.active
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            )}
                                            title={!isOpen ? item.name : undefined}
                                        >
                                            <Icon className="w-5 h-5 flex-shrink-0" />
                                            {isOpen && (
                                                <span className="text-sm font-medium truncate">
                                                    {item.name}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
}
