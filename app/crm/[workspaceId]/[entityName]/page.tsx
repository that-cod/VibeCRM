/**
 * Dynamic Entity Page - UPDATED
 * Displays entity records with table view and CRUD operations
 * NOW WITH REAL API INTEGRATION
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EntityTable } from '@/components/crm/entities/EntityTable';
import { EntityForm } from '@/components/crm/entities/EntityForm';
import { getAuthToken } from '@/lib/utils/auth';
import type { EntityConfig, WorkspaceConfig } from '@/types/crm-config';

interface EntityPageProps {
    params: Promise<{ workspaceId: string; entityName: string }>;
}

export default function EntityPage({ params }: EntityPageProps) {
    const router = useRouter();
    const [workspaceId, setWorkspaceId] = useState<string>('');
    const [entityName, setEntityName] = useState<string>('');
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editRecord, setEditRecord] = useState<any>(null);
    const [entityConfig, setEntityConfig] = useState<EntityConfig | null>(null);

    useEffect(() => {
        params.then((p) => {
            setWorkspaceId(p.workspaceId);
            setEntityName(p.entityName);
            loadWorkspaceAndEntity(p.workspaceId, p.entityName);
        });
    }, [params]);

    const loadWorkspaceAndEntity = async (wId: string, eName: string) => {
        try {
            const token = await getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }

            // Fetch workspace config
            const response = await fetch(`/api/workspace/${wId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to load workspace');

            const { workspace } = await response.json();
            const config = workspace.config as WorkspaceConfig;

            // Get entity config
            const entity = config.entities[eName];
            if (!entity) {
                console.error('Entity not found:', eName);
                return;
            }

            setEntityConfig(entity);
            await loadRecords(wId, eName, token);
        } catch (error) {
            console.error('Error loading workspace:', error);
        }
    };

    const loadRecords = async (wId: string, eName: string, token?: string) => {
        setLoading(true);
        try {
            const authToken = token || await getAuthToken();
            if (!authToken) return;

            const response = await fetch(`/api/crm/${wId}/${eName}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });

            if (!response.ok) throw new Error('Failed to load records');

            const { data } = await response.json();
            setRecords(data || []);
        } catch (error) {
            console.error('Error loading records:', error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditRecord(null);
        setShowForm(true);
    };

    const handleEdit = (record: any) => {
        setEditRecord(record);
        setShowForm(true);
    };

    const handleDelete = async (recordId: string) => {
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }

        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`/api/crm/${workspaceId}/${entityName}?id=${recordId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to delete record');

            await loadRecords(workspaceId, entityName);
        } catch (error) {
            console.error('Error deleting record:', error);
            alert('Failed to delete record');
        }
    };

    const handleSubmit = async (data: any) => {
        try {
            const token = await getAuthToken();
            if (!token) return;

            const method = editRecord ? 'PUT' : 'POST';
            const body = editRecord ? { ...data, id: editRecord.id } : data;

            const response = await fetch(`/api/crm/${workspaceId}/${entityName}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error('Failed to save record');

            setShowForm(false);
            setEditRecord(null);
            await loadRecords(workspaceId, entityName);
        } catch (error) {
            console.error('Error saving record:', error);
            alert('Failed to save record');
        }
    };

    if (!entityConfig) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <EntityTable
                entity={entityConfig}
                records={records}
                loading={loading}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {showForm && (
                <EntityForm
                    entity={entityConfig}
                    initialData={editRecord}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setEditRecord(null);
                    }}
                />
            )}
        </div>
    );
}
