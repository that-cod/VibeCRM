/**
 * CRM Workspace Layout
 * Wraps all CRM pages with shell, loads workspace config
 */

import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/database/supabase-admin';
import { CRMShell } from '@/components/crm/layout/CRMShell';
import type { WorkspaceConfig } from '@/types/crm-config';

interface CRMLayoutProps {
    children: React.ReactNode;
    params: Promise<{ workspaceId: string }>;
}

export default async function CRMLayout({ children, params }: CRMLayoutProps) {
    const { workspaceId } = await params;

    // Fetch workspace configuration
    const { data: workspace, error } = await supabaseAdmin
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

    if (error || !workspace) {
        notFound();
    }

    const config = workspace.config as WorkspaceConfig;

    return (
        <CRMShell workspaceId={workspaceId} workspace={config}>
            {children}
        </CRMShell>
    );
}
