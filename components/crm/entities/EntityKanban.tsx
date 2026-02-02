/**
 * Entity Kanban Component
 * Drag-and-drop kanban board for entity records
 */

'use client';

import { useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import type { EntityConfig, FieldConfig } from '@/types/crm-config';

interface EntityKanbanProps {
    entity: EntityConfig;
    records: any[];
    groupByField: string;
    loading?: boolean;
    onCreate?: (status: string) => void;
    onEdit?: (record: any) => void;
    onMove?: (recordId: string, newStatus: string) => void;
}

export function EntityKanban({
    entity,
    records,
    groupByField,
    loading = false,
    onCreate,
    onEdit,
    onMove,
}: EntityKanbanProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Find the field config for group field
    const groupField = entity.fields.find(f => f.name === groupByField);

    // Get options from the select field
    const columns = groupField?.options || [];

    // Group records by status
    const recordsByStatus = columns.reduce((acc, col) => {
        const colValue = typeof col === 'object' ? col.value : col;
        acc[colValue] = records.filter(r => r[groupByField] === colValue);
        return acc;
    }, {} as Record<string, any[]>);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const recordId = active.id as string;
        const newStatus = over.id as string;

        // If dropped on a column (status), update the record
        if (columns.some(col => {
            const colValue = typeof col === 'object' ? col.value : col;
            return colValue === newStatus;
        })) {
            onMove?.(recordId, newStatus);
        }

        setActiveId(null);
    };

    const getColumnColor = (column: any) => {
        if (typeof column === 'object' && column.color) {
            return column.color;
        }
        // Default colors based on common statuses
        const colValue = typeof column === 'object' ? column.value : column;
        const colorMap: Record<string, string> = {
            'To Do': 'bg-gray-100',
            'In Progress': 'bg-blue-100',
            'Done': 'bg-green-100',
            'Pending': 'bg-yellow-100',
            'Active': 'bg-green-100',
            'Inactive': 'bg-gray-100',
        };
        return colorMap[colValue] || 'bg-gray-100';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((column) => {
                    const colValue = typeof column === 'object' ? column.value : column;
                    const colLabel = typeof column === 'object' ? column.label : column;
                    const colRecords = recordsByStatus[colValue] || [];

                    return (
                        <KanbanColumn
                            key={colValue}
                            id={colValue}
                            title={colLabel}
                            color={getColumnColor(column)}
                            records={colRecords}
                            entity={entity}
                            onCreate={() => onCreate?.(colValue)}
                            onEdit={onEdit}
                        />
                    );
                })}
            </div>

            <DragOverlay>
                {activeId ? (
                    <KanbanCard
                        record={records.find(r => r.id === activeId)}
                        entity={entity}
                        isDragging
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

interface KanbanColumnProps {
    id: string;
    title: string;
    color: string;
    records: any[];
    entity: EntityConfig;
    onCreate?: () => void;
    onEdit?: (record: any) => void;
}

function KanbanColumn({
    id,
    title,
    color,
    records,
    entity,
    onCreate,
    onEdit,
}: KanbanColumnProps) {
    return (
        <div className="flex-shrink-0 w-80">
            <div className={`rounded-lg ${color} p-4`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                        {title}
                        <span className="ml-2 text-sm text-gray-600">({records.length})</span>
                    </h3>
                    {onCreate && (
                        <button
                            onClick={onCreate}
                            className="p-1 hover:bg-white/50 rounded transition-colors"
                            title={`Add to ${title}`}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <SortableContext
                    items={records.map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2 min-h-[200px]">
                        {records.map((record) => (
                            <SortableKanbanCard
                                key={record.id}
                                record={record}
                                entity={entity}
                                onEdit={onEdit}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

interface KanbanCardProps {
    record: any;
    entity: EntityConfig;
    isDragging?: boolean;
    onEdit?: (record: any) => void;
}

function KanbanCard({ record, entity, isDragging = false, onEdit }: KanbanCardProps) {
    // Get primary field to use as title
    const primaryField = entity.fields.find(f => f.name === entity.primaryField) || entity.fields[0];
    const title = record[primaryField.name] || 'Untitled';

    // Get a few other key fields to display
    const displayFields = entity.fields
        .filter(f => f.showInTable && f.name !== primaryField.name)
        .slice(0, 3);

    return (
        <div
            className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''
                }`}
            onClick={() => !isDragging && onEdit?.(record)}
        >
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{title}</h4>
            <div className="space-y-1">
                {displayFields.map((field) => (
                    <div key={field.name} className="text-sm text-gray-600">
                        <span className="font-medium">{field.label}:</span>{' '}
                        {String(record[field.name] || '-')}
                    </div>
                ))}
            </div>
        </div>
    );
}

function SortableKanbanCard({ record, entity, onEdit }: Omit<KanbanCardProps, 'isDragging'>) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: record.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <KanbanCard record={record} entity={entity} isDragging={isDragging} onEdit={onEdit} />
        </div>
    );
}
