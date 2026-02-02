/**
 * Workspace API
 * GET  /api/workspace - List user's workspaces
 * POST /api/workspace - Create new workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { provisionWorkspace } from '@/lib/database/entity-provisioner';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import type { CreateWorkspaceRequest, ListWorkspacesResponse } from '@/types/api';
import type { Workspace } from '@/types/crm-config';

/**
 * GET - List all workspaces user has access to
 */
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const supabase = supabaseAdmin;

        // Get workspaces user owns or is member of
        const { data: ownedWorkspaces, error: ownedError } = await supabase
            .from('workspaces')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        if (ownedError) {
            throw ownedError;
        }

        // Get workspaces user is member of
        const { data: memberships } = await supabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id);

        const memberWorkspaceIds = memberships?.map(m => m.workspace_id) || [];

        let memberWorkspaces: Workspace[] = [];
        if (memberWorkspaceIds.length > 0) {
            const { data } = await supabase
                .from('workspaces')
                .select('*')
                .in('id', memberWorkspaceIds);

            memberWorkspaces = data || [];
        }

        const allWorkspaces = [...(ownedWorkspaces || []), ...memberWorkspaces];

        // Get member count for each workspace
        const workspacesWithCounts = await Promise.all(
            allWorkspaces.map(async (workspace: Workspace) => {
                const { count } = await supabase
                    .from('workspace_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('workspace_id', workspace.id);

                // Determine user's role
                let role = 'member';
                if (workspace.owner_id === user.id) {
                    role = 'owner';
                } else {
                    const { data: member } = await supabase
                        .from('workspace_members')
                        .select('role')
                        .eq('workspace_id', workspace.id)
                        .eq('user_id', user.id)
                        .single();

                    if (member) {
                        role = member.role;
                    }
                }

                return {
                    ...workspace,
                    memberCount: (count || 0) + 1, // +1 for owner
                    role,
                };
            })
        );

        const response: ListWorkspacesResponse = {
            workspaces: workspacesWithCounts,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
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
 * POST - Create new workspace
 */
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const supabase = supabaseAdmin;
        const body: CreateWorkspaceRequest = await request.json();
        const { name, config } = body;

        if (!name || !config) {
            return NextResponse.json(
                { error: 'Invalid request', message: 'Name and config are required' },
                { status: 400 }
            );
        }

        // Ensure user exists in users table
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!existingUser) {
            // Create user profile if doesn't exist (for mock users)
            await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    name: 'Demo User',
                });
        }

        // Create workspace record
        const { data: workspace, error: createError } = await supabase
            .from('workspaces')
            .insert({
                name,
                owner_id: user.id,
                config,
                template_id: null, // Template was used internally by AI, no need to store reference
                industry: config.industry,
                status: 'active',
            })
            .select()
            .single();

        if (createError) {
            throw createError;
        }

        // Provision database tables for entities
        try {
            await provisionWorkspace(workspace.id, config);
        } catch (provisionError) {
            // Rollback: delete workspace if provisioning fails
            await supabase
                .from('workspaces')
                .delete()
                .eq('id', workspace.id);

            throw new Error(`Failed to provision workspace: ${provisionError instanceof Error ? provisionError.message : 'Unknown error'}`);
        }

        return NextResponse.json({
            workspace,
            memberCount: 1,
            role: 'owner',
        });
    } catch (error) {
        console.error('Error creating workspace:', error);
        return NextResponse.json(
            {
                error: 'Creation failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
