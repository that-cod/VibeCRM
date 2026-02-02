/**
 * Workspace Members API
 * GET  /api/workspace/[id]/members - List members
 * POST/api/workspace/[id]/members - Invite member
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import type { InviteMemberRequest, WorkspaceMembersResponse } from '@/types/api';

type Params = {
    params: Promise<{ id: string }>;
};

const MAX_MEMBERS = 5;

/**
 * GET - List workspace members
 */
export async function GET(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { id } = params;

        const supabase = supabaseAdmin;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'User not authenticated' },
                { status: 401 }
            );
        }

        // Get workspace owner
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('owner_id')
            .eq('id', id)
            .single();

        if (!workspace) {
            return NextResponse.json(
                { error: 'Not found', message: 'Workspace not found' },
                { status: 404 }
            );
        }

        // Get members
        const { data: members, error } = await supabase
            .from('workspace_members')
            .select(`
        *,
        user:users(email, name)
      `)
            .eq('workspace_id', id);

        if (error) {
            throw error;
        }

        // Get owner info
        const { data: owner } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', workspace.owner_id)
            .single();

        // Combine owner and members
        const allMembers = [
            {
                id: workspace.owner_id,
                workspace_id: id,
                user_id: workspace.owner_id,
                role: 'owner',
                joined_at: new Date().toISOString(),
                user: owner || { email: 'Unknown', name: 'Owner' },
            },
            ...(members || []),
        ];

        const currentCount = allMembers.length;
        const canInviteMore = currentCount < MAX_MEMBERS;

        const response: WorkspaceMembersResponse = {
            members: allMembers,
            canInviteMore,
            maxMembers: MAX_MEMBERS,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching members:', error);
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
 * POST - Invite member to workspace
 */
export async function POST(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { id } = params;

        const supabase = supabaseAdmin;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'User not authenticated' },
                { status: 401 }
            );
        }

        const body: InviteMemberRequest = await request.json();
        const { email, role } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Invalid request', message: 'Email is required' },
                { status: 400 }
            );
        }

        // Check member limit
        const { count } = await supabase
            .from('workspace_members')
            .select('*', { count: 'exact', head: true })
            .eq('workspace_id', id);

        if ((count || 0) + 1 >= MAX_MEMBERS) {
            return NextResponse.json(
                { error: 'Limit reached', message: `Maximum ${MAX_MEMBERS} members allowed` },
                { status: 400 }
            );
        }

        // Find user by email
        const { data: invitedUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (!invitedUser) {
            return NextResponse.json(
                { error: 'Not found', message: 'User with this email not found' },
                { status: 404 }
            );
        }

        // Add member
        const { data: member, error: insertError } = await supabase
            .from('workspace_members')
            .insert({
                workspace_id: id,
                user_id: invitedUser.id,
                role: role || 'member',
                invited_by: user.id,
            })
            .select()
            .single();

        if (insertError) {
            // Check if already member
            if (insertError.code === '23505') {
                return NextResponse.json(
                    { error: 'Already member', message: 'User is already a member' },
                    { status: 400 }
                );
            }
            throw insertError;
        }

        return NextResponse.json({ success: true, member });
    } catch (error) {
        console.error('Error inviting member:', error);
        return NextResponse.json(
            {
                error: 'Invite failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Remove member from workspace
 */
export async function DELETE(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { id } = params;

        const supabase = supabaseAdmin;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'User not authenticated' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const memberUserId = searchParams.get('userId');

        if (!memberUserId) {
            return NextResponse.json(
                { error: 'Invalid request', message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Remove member
        const { error } = await supabase
            .from('workspace_members')
            .delete()
            .eq('workspace_id', id)
            .eq('user_id', memberUserId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Member removed' });
    } catch (error) {
        console.error('Error removing member:', error);
        return NextResponse.json(
            {
                error: 'Remove failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
