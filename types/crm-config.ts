/**
 * @fileoverview Complete type definitions for VibeCRM workspace configuration.
 * 
 * This defines the config-driven architecture where:
 * - Workspaces contain multiple entities
 * - Each entity has fields, views, and UI settings
 * - Templates provide industry-specific starting configs
 */

// ============================================================================
// Field Types & Configuration
// ============================================================================

/**
 * Supported field types for entity properties
 */
export type FieldType =
    | 'text'
    | 'email'
    | 'phone'
    | 'url'
    | 'textarea'
    | 'number'
    | 'currency'
    | 'date'
    | 'datetime'
    | 'checkbox'
    | 'select'
    | 'multiselect'
    | 'relation'
    | 'file'
    | 'user';

/**
 * PostgreSQL type mapping for field types
 */
export type PostgresFieldType =
    | 'TEXT'
    | 'VARCHAR'
    | 'INTEGER'
    | 'NUMERIC'
    | 'BOOLEAN'
    | 'DATE'
    | 'TIMESTAMPTZ'
    | 'UUID'
    | 'JSONB'
    | 'TEXT[]';

/**
 * Validation rules for fields
 */
export interface ValidationRules {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string; // Custom validation function name
}

/**
 * Field configuration for an entity
 */
export interface FieldConfig {
    id: string;
    name: string;
    label: string;
    type: FieldType;
    postgresType?: PostgresFieldType;
    required: boolean;
    unique?: boolean;
    defaultValue?: string | number | boolean;
    validation?: ValidationRules;

    // For select/multiselect fields
    options?: Array<{
        value: string;
        label: string;
        color?: string;
    }>;

    // For relation fields
    relationTo?: string; // Entity name
    relationField?: string; // Foreign key field name

    // UI hints
    placeholder?: string;
    helpText?: string;
    showInTable?: boolean;
    showInForm?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    mobilePriority?: number; // 1 = always show, 5 = hide on mobile
    hidden?: boolean;
    description?: string;
}

// ============================================================================
// View Types & Configuration
// ============================================================================

/**
 * Available view types for entities
 */
export type ViewType = 'table' | 'kanban' | 'calendar' | 'grid';

/**
 * Filter operators for entity queries
 */
export type FilterOperator =
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan'
    | 'between'
    | 'in'
    | 'notIn'
    | 'isNull'
    | 'isNotNull';

/**
 * Filter configuration
 */
export interface FilterConfig {
    field: string;
    operator: FilterOperator;
    value: unknown;
}

/**
 * View configuration for an entity
 */
export interface ViewConfig {
    type: ViewType;
    name: string;
    default?: boolean;

    // Table view specific
    columns?: string[]; // Field IDs to show

    // Kanban view specific
    groupByField?: string; // Field to group by (usually select field)

    // Calendar view specific
    dateField?: string; // Field for calendar date
    endDateField?: string; // Optional end date for ranges
    titleField?: string; // Field to use as event title

    // Common settings
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: FilterConfig[];
}

// ============================================================================
// Entity Configuration
// ============================================================================

/**
 * Complete entity configuration
 */
export interface EntityConfig {
    id: string;
    name: string; // Singular name (e.g., "Property")
    namePlural: string; // Plural name (e.g., "Properties")
    slug: string; // URL-safe name
    icon: string; // Lucide icon name
    description?: string;

    fields: FieldConfig[];
    views: ViewConfig[];

    // UI settings
    primaryField: string; // Field to use as record title
    color?: string; // Theme color for entity

    // Permissions (future: per-role)
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
}

// ============================================================================
// Workspace Configuration
// ============================================================================

/**
 * Dashboard widget types
 */
export type WidgetType = 'stats' | 'chart' | 'activity' | 'list';

/**
 * Dashboard widget configuration
 */
export interface WidgetConfig {
    id: string;
    type: WidgetType;
    title: string;
    entityName?: string; // For entity-specific widgets
    size: 'small' | 'medium' | 'large';
    position: { x: number; y: number };

    // Stats widget
    metric?: 'count' | 'sum' | 'average';
    field?: string;

    // Chart widget
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    dataField?: string;
    groupByField?: string;

    // List widget
    limit?: number;
    filters?: FilterConfig[];
}

/**
 * Complete workspace configuration
 */
export interface WorkspaceConfig {
    id: string;
    name: string;
    industry: string;
    templateId?: string; // If created from template

    entities: Record<string, EntityConfig>; // Key: entity slug

    dashboard: {
        widgets: WidgetConfig[];
    };

    // Workspace settings
    settings: {
        dateFormat: string;
        timeZone: string;
        currency: string;
        language: string;
    };

    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// Template Configuration
// ============================================================================

/**
 * Industry template configuration
 */
export interface TemplateConfig {
    id: string;
    name: string;
    slug: string;
    industry: string;
    description: string;
    icon: string;
    featured: boolean;

    // Pre-configured entities
    entities: Record<string, Omit<EntityConfig, 'id'>>;

    // Pre-configured dashboard
    dashboard: {
        widgets: Omit<WidgetConfig, 'id'>[];
    };

    // Example use cases
    useCases?: string[];

    // Preview images
    screenshots?: string[];
}

// ============================================================================
// Database Models
// ============================================================================

/**
 * User profile (extends Supabase auth.users)
 */
export interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    created_at: string;
}

/**
 * Workspace model
 */
export interface Workspace {
    id: string;
    name: string;
    owner_id: string;
    config: WorkspaceConfig;
    template_id?: string;
    industry: string;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
}

/**
 * Workspace member model
 */
export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    invited_by?: string;
    joined_at: string;
}

/**
 * Template model
 */
export interface Template {
    id: string;
    name: string;
    slug: string;
    industry: string;
    description: string;
    config: TemplateConfig;
    icon: string;
    featured: boolean;
    usage_count: number;
    created_at: string;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Business context for AI generation
 */
export interface BusinessContext {
    industry: string;
    companyName?: string;
    teamSize?: number;
    description: string;
    specificNeeds?: string[];
}

/**
 * AI generation result
 */
export interface GenerateConfigResult {
    config: WorkspaceConfig;
    templateUsed?: string;
    warnings?: string[];
    suggestions?: string[];
}

/**
 * Generic entity record (dynamic shape)
 */
export type EntityRecord = {
    id: string;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    [key: string]: unknown; // Dynamic fields from config
};

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

/**
 * API error response
 */
export interface APIError {
    error: string;
    message: string;
    details?: Record<string, unknown>;
}
