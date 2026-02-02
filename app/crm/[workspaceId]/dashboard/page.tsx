/**
 * CRM Dashboard Page
 * Displays workspace overview and dashboard widgets
 */

'use client';

import { useEffect, useState } from 'react';
import type { WorkspaceConfig } from '@/types/crm-config';

interface DashboardPageProps {
    params: Promise<{ workspaceId: string }>;
}

export default function DashboardPage({ params }: DashboardPageProps) {
    const [workspaceId, setWorkspaceId] = useState<string>('');

    useEffect(() => {
        params.then((p) => setWorkspaceId(p.workspaceId));
    }, [params]);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome to your CRM workspace</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Placeholder stats - will be populated from dashboard config */}
                <StatCard
                    title="Total Records"
                    value="0"
                    change="+0%"
                    trend="up"
                />
                <StatCard
                    title="Active"
                    value="0"
                    change="+0%"
                    trend="up"
                />
                <StatCard
                    title="This Month"
                    value="0"
                    change="+0%"
                    trend="up"
                />
                <StatCard
                    title="Completed"
                    value="0"
                    change="+0%"
                    trend="neutral"
                />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="text-center py-12 text-gray-500">
                    <p>No recent activity</p>
                    <p className="text-sm mt-2">Activity will appear here once you start using your CRM</p>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, change, trend }: StatCardProps) {
    const trendColors = {
        up: 'text-green-600',
        down: 'text-red-600',
        neutral: 'text-gray-600',
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            <p className={`text-sm mt-2 ${trendColors[trend]}`}>{change} from last month</p>
        </div>
    );
}
