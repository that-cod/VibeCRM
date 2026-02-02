/**
 * CRM Shell Component
 * Main layout wrapper for CRM workspace
 */

'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { WorkspaceConfig } from '@/types/crm-config';

interface CRMShellProps {
    workspaceId: string;
    workspace: WorkspaceConfig;
    currentEntity?: string;
    children: React.ReactNode;
}

export function CRMShell({ workspaceId, workspace, currentEntity, children }: CRMShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar
                workspaceId={workspaceId}
                workspace={workspace}
                currentEntity={currentEntity}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar workspaceId={workspaceId} workspace={workspace} currentEntity={currentEntity} />

                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
