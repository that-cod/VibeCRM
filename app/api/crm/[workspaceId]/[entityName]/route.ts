/**
 * Dynamic Entity CRUD API
 * Handles CRUD operations for any workspace entity
 * GET    /api/crm/[workspaceId]/[entityName] - List records
 * POST   /api/crm/[workspaceId]/[entityName] - Create record
 * PUT    /api/crm/[workspaceId]/[entityName] - Update record
 * DELETE /api/crm/[workspaceId]/[entityName] - Delete record
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabase-admin';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import type { EntityQueryParams, EntityRecordsResponse, EntityRecordRequest } from '@/types/api';

type Params = {
    params: Promise<{ workspaceId: string; entityName: string }>;
};

/**
 * GET - List entity records with pagination and filtering
 */
export async function GET(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { workspaceId, entityName } = params;

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const sortBy = searchParams.get('sortBy') || 'created_at';
        const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
        const search = searchParams.get('search');

        // Authenticate user
        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        // Verify workspace access
        const { data: hasAccess } = await supabaseAdmin.rpc('can_access_workspace', {
            workspace_id: workspaceId,
            user_id: user.id,
        });

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Forbidden', message: 'No access to this workspace' },
                { status: 403 }
            );
        }

        // Sanitize IDs for table names (replace hyphens with underscores)
        const safeWorkspaceId = workspaceId.replace(/-/g, '_');
        const safeEntityName = entityName.replace(/-/g, '_');
        const tableName = `workspace_${safeWorkspaceId}_${safeEntityName}`;

        // Build query
        let query = supabaseAdmin
            .from(tableName)
            .select('*', { count: 'exact' })
            .eq('workspace_id', workspaceId);

        // Add search if provided (searches across all text fields)
        if (search) {
            // Note: In production, you'd get searchable fields from entity config
            // For now, we'll just search in common fields
            query = query.or(`name.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Add sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Add pagination
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        const response: EntityRecordsResponse = {
            data: data || [],
            total: count || 0,
            page,
            pageSize,
            hasMore: (count || 0) > page * pageSize,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching entity records:', error);
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
 * POST - Create new entity record
 */
export async function POST(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { workspaceId, entityName } = params;

        // Authenticate user
        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const body: EntityRecordRequest = await request.json();

        // Sanitize IDs for table names (replace hyphens with underscores)
        const safeWorkspaceId = workspaceId.replace(/-/g, '_');
        const safeEntityName = entityName.replace(/-/g, '_');
        const tableName = `workspace_${safeWorkspaceId}_${safeEntityName}`;

        // Insert record
        const { data, error } = await supabaseAdmin
            .from(tableName)
            .insert({
                ...body,
                workspace_id: workspaceId,
                created_by: user.id,
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ record: data });
    } catch (error) {
        console.error('Error creating entity record:', error);
        return NextResponse.json(
            {
                error: 'Creation failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update entity record
 */
export async function PUT(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { workspaceId, entityName } = params;

        // Authenticate user
        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Invalid request', message: 'Record ID is required' },
                { status: 400 }
            );
        }

        // Build table name
        const tableName = `workspace_${workspaceId}_${entityName}`;

        // Update record
        const { data, error } = await supabaseAdmin
            .from(tableName)
            .update(updates)
            .eq('id', id)
            .eq('workspace_id', workspaceId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ record: data });
    } catch (error) {
        console.error('Error updating entity record:', error);
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
 * DELETE - Delete entity record
 */
export async function DELETE(request: NextRequest, props: Params) {
    try {
        const params = await props.params;
        const { workspaceId, entityName } = params;

        // Authenticate user
        const user = await authenticateRequest(request);

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authorization token required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const recordId = searchParams.get('id');

        if (!recordId) {
            return NextResponse.json(
                { error: 'Invalid request', message: 'Record ID is required' },
                { status: 400 }
            );
        }

        // Build table name
        const tableName = `workspace_${workspaceId}_${entityName}`;

        // Delete record
        const { error } = await supabaseAdmin
            .from(tableName)
            .delete()
            .eq('id', recordId)
            .eq('workspace_id', workspaceId);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Record deleted' });
    } catch (error) {
        console.error('Error deleting entity record:', error);
        return NextResponse.json(
            {
                error: 'Delete failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
