/**
 * @fileoverview API route types and request/response schemas
 */

import type {
    WorkspaceConfig,
    BusinessContext,
    Workspace,
    WorkspaceMember,
    EntityRecord,
    PaginatedResponse,
} from './crm-config';

// ============================================================================
// Request Types
// ============================================================================

/**
 * Generate CRM config request
 */
export interface GenerateConfigRequest {
    prompt: string;
    context?: BusinessContext;
    templateId?: string; // Optional: suggest a specific template
}

/**
 * Create workspace request
 */
export interface CreateWorkspaceRequest {
    name: string;
    config: WorkspaceConfig;
    templateId?: string;
}

/**
 * Update workspace request
 */
export interface UpdateWorkspaceRequest {
    name?: string;
    config?: Partial<WorkspaceConfig>;
    status?: 'active' | 'archived';
}

/**
 * Invite member request
 */
export interface InviteMemberRequest {
    email: string;
    role: 'admin' | 'member';
}

/**
 * Entity query parameters
 */
export interface EntityQueryParams {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, unknown>;
}

/**
 * Create/Update entity record request
 */
export type EntityRecordRequest = Omit<
    EntityRecord,
    'id' | 'workspace_id' | 'created_at' | 'updated_at'
>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Generate config response
 */
export interface GenerateConfigResponse {
    config: WorkspaceConfig;
    templateUsed?: string;
    warnings?: string[];
    suggestions?: string[];
}

/**
 * Workspace response
 */
export interface WorkspaceResponse {
    workspace: Workspace;
    memberCount: number;
    role: 'owner' | 'admin' | 'member';
}

/**
 * List workspaces response
 */
export interface ListWorkspacesResponse {
    workspaces: Array<Workspace & { memberCount: number; role: string }>;
}

/**
 * Workspace members response
 */
export interface WorkspaceMembersResponse {
    members: Array<WorkspaceMember & { user: { email: string; name?: string } }>;
    canInviteMore: boolean;
    maxMembers: number;
}

/**
 * Entity records response
 */
export type EntityRecordsResponse = PaginatedResponse<EntityRecord>;

/**
 * Single entity record response
 */
export interface EntityRecordResponse {
    record: EntityRecord;
}

/**
 * Success response
 */
export interface SuccessResponse {
    success: true;
    message?: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
    error: string;
    message: string;
    details?: Record<string, unknown>;
    code?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if response is an error
 */
export function isErrorResponse(
    response: unknown
): response is ErrorResponse {
    return (
        typeof response === 'object' &&
        response !== null &&
        'error' in response
    );
}

/**
 * Check if response is successful
 */
export function isSuccessResponse(
    response: unknown
): response is SuccessResponse {
    return (
        typeof response === 'object' &&
        response !== null &&
        'success' in response &&
        response.success === true
    );
}
