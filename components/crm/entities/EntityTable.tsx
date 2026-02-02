/**
 * Entity Table Component
 * Dynamic table that renders based on entity configuration
 */

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityConfig, FieldConfig } from '@/types/crm-config';

interface EntityTableProps {
    entity: EntityConfig;
    records: any[];
    loading?: boolean;
    onSort?: (field: string, direction: 'asc' | 'desc') => void;
    onEdit?: (record: any) => void;
    onDelete?: (recordId: string) => void;
    onCreate?: () => void;
}

export function EntityTable({
    entity,
    records,
    loading = false,
    onSort,
    onEdit,
    onDelete,
    onCreate,
}: EntityTableProps) {
    const [sortField, setSortField] = useState<string>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Filter fields that should be shown in table
    const visibleFields = entity.fields.filter(
        (field) => !field.hidden && field.name !== 'id'
    );

    const handleSort = (field: FieldConfig) => {
        if (!field.sortable) return;

        const newDirection =
            sortField === field.name && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortField(field.name);
        setSortDirection(newDirection);
        onSort?.(field.name, newDirection);
    };

    const getSortIcon = (field: FieldConfig) => {
        if (!field.sortable) return null;

        if (sortField !== field.name) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
        }

        return sortDirection === 'asc' ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
        ) : (
            <ChevronDown className="w-4 h-4 text-blue-600" />
        );
    };

    const formatValue = (value: any, field: FieldConfig) => {
        if (value === null || value === undefined) return '-';

        switch (field.type) {
            case 'date':
                return new Date(value).toLocaleDateString();
            case 'datetime':
                return new Date(value).toLocaleString();
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                }).format(value);
            case 'checkbox':
                return value ? 'Yes' : 'No';
            case 'select':
            case 'multiselect':
                return Array.isArray(value) ? value.join(', ') : value;
            default:
                return String(value);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200">
            {/* Table Header with Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{entity.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {records.length} {records.length === 1 ? 'record' : 'records'}
                    </p>
                </div>

                {onCreate && (
                    <button
                        onClick={onCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add {entity.name.slice(0, -1)}</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {visibleFields.map((field) => (
                                <th
                                    key={field.name}
                                    className={cn(
                                        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                                        field.sortable && 'cursor-pointer hover:bg-gray-100'
                                    )}
                                    onClick={() => handleSort(field)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{field.label}</span>
                                        {getSortIcon(field)}
                                    </div>
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {records.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={visibleFields.length + 1}
                                    className="px-6 py-12 text-center text-sm text-gray-500"
                                >
                                    No records found. Click "Add {entity.name.slice(0, -1)}" to create one.
                                </td>
                            </tr>
                        ) : (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    {visibleFields.map((field) => (
                                        <td key={field.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatValue(record[field.name], field)}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            {onEdit && (
                                                <button
                                                    onClick={() => onEdit(record)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            )}
                                            {onDelete && (
                                                <button
                                                    onClick={() => onDelete(record.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
