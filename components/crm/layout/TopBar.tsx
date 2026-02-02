/**
 * CRM Top Bar Component
 * Search, view switcher, and user menu
 */

'use client';

import { useState } from 'react';
import { Search, Grid3x3, List, Calendar, Columns, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkspaceConfig, ViewType } from '@/types/crm-config';

interface TopBarProps {
    workspaceId: string;
    workspace: WorkspaceConfig;
    currentEntity?: string;
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
    onSearch?: (query: string) => void;
}

export function TopBar({
    workspaceId,
    workspace,
    currentEntity,
    currentView = 'table',
    onViewChange,
    onSearch,
}: TopBarProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Get available views for current entity
    const entityConfig = currentEntity ? workspace.entities[currentEntity] : null;
    const availableViews = entityConfig?.views || {};

    const viewButtons: { type: ViewType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
        { type: 'table', icon: List, label: 'Table' },
        { type: 'kanban', icon: Columns, label: 'Kanban' },
        { type: 'calendar', icon: Calendar, label: 'Calendar' },
        { type: 'grid', icon: Grid3x3, label: 'Grid' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(searchQuery);
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            {/* Left: Search */}
            <div className="flex-1 max-w-md">
                <form onSubmit={handleSearch}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search records..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </form>
            </div>

            {/* Center: View Switcher (only show for entity pages) */}
            {currentEntity && onViewChange && (
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    {viewButtons
                        .filter((view) => availableViews[view.type])
                        .map(({ type, icon: Icon, label }) => (
                            <button
                                key={type}
                                onClick={() => onViewChange(type)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
                                    currentView === type
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                )}
                                title={label}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium hidden sm:inline">{label}</span>
                            </button>
                        ))}
                </div>
            )}

            {/* Right: User Menu */}
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden md:inline">
                            User
                        </span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                        <div className="py-1">
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                <User className="w-4 h-4" />
                                Profile
                            </button>
                            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
