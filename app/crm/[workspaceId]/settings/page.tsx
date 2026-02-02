/**
 * Workspace Settings Page
 * Configure workspace-wide settings
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/utils/auth';
import type { WorkspaceConfig } from '@/types/crm-config';
import { Save, Trash2 } from 'lucide-react';

interface SettingsPageProps {
    params: Promise<{ workspaceId: string }>;
}

export default function SettingsPage({ params }: SettingsPageProps) {
    const router = useRouter();
    const [workspaceId, setWorkspaceId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [workspace, setWorkspace] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'America/New_York',
        currency: 'USD',
        language: 'en',
    });

    useEffect(() => {
        params.then(async (p) => {
            setWorkspaceId(p.workspaceId);
            await loadWorkspace(p.workspaceId);
        });
    }, [params]);

    const loadWorkspace = async (wId: string) => {
        try {
            const token = await getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch(`/api/workspace/${wId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to load workspace');

            const { workspace: ws } = await response.json();
            setWorkspace(ws);

            const config = ws.config as WorkspaceConfig;
            setFormData({
                name: config.name,
                dateFormat: config.settings?.dateFormat || 'MM/DD/YYYY',
                timeZone: config.settings?.timeZone || 'America/New_York',
                currency: config.settings?.currency || 'USD',
                language: config.settings?.language || 'en',
            });
        } catch (error) {
            console.error('Error loading workspace:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!workspace) return;

        setSaving(true);
        try {
            const token = await getAuthToken();
            if (!token) return;

            const updatedConfig = {
                ...workspace.config,
                name: formData.name,
                settings: {
                    dateFormat: formData.dateFormat,
                    timeZone: formData.timeZone,
                    currency: formData.currency,
                    language: formData.language,
                },
            };

            const response = await fetch(`/api/workspace/${workspaceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ config: updatedConfig }),
            });

            if (!response.ok) throw new Error('Failed to save settings');

            alert('Settings saved successfully!');
            await loadWorkspace(workspaceId);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
            return;
        }

        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`/api/workspace/${workspaceId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to delete workspace');

            router.push('/dashboard');
        } catch (error) {
            console.error('Error deleting workspace:', error);
            alert('Failed to delete workspace');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
                <p className="text-gray-600 mt-1">Manage your workspace configuration</p>
            </div>

            <div className="space-y-6">
                {/* General Settings */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Workspace Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date Format
                            </label>
                            <select
                                value={formData.dateFormat}
                                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Zone
                            </label>
                            <select
                                value={formData.timeZone}
                                onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Chicago">Central Time</option>
                                <option value="America/Denver">Mountain Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                                <option value="UTC">UTC</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Currency
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="INR">INR - Indian Rupee</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-lg border border-red-200 p-6">
                    <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Once you delete a workspace, there is no going back. All data will be permanently deleted.
                    </p>
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Workspace
                    </button>
                </div>
            </div>
        </div>
    );
}
