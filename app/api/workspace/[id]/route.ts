/**
 * Workspace Detail API
 * GET    /api/workspace/[id] - Get workspace details
 * PUT    /api/workspace/[id] - Update workspace
 * DELETE /api/workspace/[id] - Delete workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { deprovisionWorkspace } from '@/lib/database/entity-provisioner';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import type { UpdateWorkspaceRequest, WorkspaceResponse } from '@/types/api';

type Params = {
    params: Promise<{ id: string }>;
};

/**
 * GET - Get workspace by ID
 */
export async function GET(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { id } = params;

        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const supabase = supabaseAdmin;

        // Get workspace (RLS will filter)
        const { data: workspace, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !workspace) {
            return NextResponse.json(
                { error: 'Not found', message: 'Workspace not found' },
                { status: 404 }
            );
        }

        // Get member count
        const { count } = await supabase
            .from('workspace_members')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', id);

        // Determine user's role
        let role = 'member';
        if (workspace.owner_id === user.id) {
            role = 'owner';
        } else {
            const { data: member } = await supabase
                .from('workspace_members')
                .select('role')
                .eq('workspace_id', id)
                .eq('user_id', user.id)
                .single();

            if (member) {
                role = member.role;
            }
        }

        const response: WorkspaceResponse = {
            workspace,
            memberCount: (count || 0) + 1,
            role: role as 'owner' | 'admin' | 'member',
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching workspace:', error);
        return NextResponse.json(
            {
                error: 'Fetch failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update workspace
 */
export async function PUT(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { id } = params;

        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const supabase = supabaseAdmin;

        const body: UpdateWorkspaceRequest = await request.json();

        // Update workspace (RLS will ensure user has permissions)
        const { data: workspace, error } = await supabase
            .from('workspaces')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ workspace });
    } catch (error) {
        console.error('Error updating workspace:', error);
        return NextResponse.json(
            {
                error: 'Update failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Delete workspace and all its tables
 */
export async function DELETE(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { id } = params;

        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const supabase = supabaseAdmin;

        // Get workspace to get entity slugs
        const { data: workspace, error: fetchError } = await supabase
            .from('workspaces')
            .select('config')
            .eq('id', id)
            .single();

        if (fetchError || !workspace) {
            return NextResponse.json(
                { error: 'Not found', message: 'Workspace not found' },
                { status: 404 }
            );
        }

        // Get entity slugs to deprovision tables
        const entitySlugs = Object.keys(workspace.config.entities);

        // Deprovision tables
        await deprovisionWorkspace(id, entitySlugs);

        // Delete workspace record (CASCADE will delete members)
        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Workspace deleted' });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        return NextResponse.json(
            {
                error: 'Delete failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
