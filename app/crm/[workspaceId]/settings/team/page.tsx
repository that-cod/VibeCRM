/**
 * Team Management Page
 * Manage workspace members and invitations
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, getCurrentUser } from '@/lib/utils/auth';
import { UserPlus, Mail, Trash2, Crown, Shield, User as UserIcon } from 'lucide-react';

interface TeamPageProps {
    params: Promise<{ workspaceId: string }>;
}

interface Member {
    id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    joined_at: string;
    user?: {
        email: string;
        name?: string;
    };
}

export default function TeamPage({ params }: TeamPageProps) {
    const router = useRouter();
    const [workspaceId, setWorkspaceId] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
    const [inviting, setInviting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        params.then(async (p) => {
            setWorkspaceId(p.workspaceId);
            const user = await getCurrentUser();
            setCurrentUserId(user?.id || null);
            await loadMembers(p.workspaceId);
        });
    }, [params]);

    const loadMembers = async (wId: string) => {
        setLoading(true);
        try {
            const token = await getAuthToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const response = await fetch(`/api/workspace/${wId}/members`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to load members');

            const { members: memberData } = await response.json();
            setMembers(memberData || []);
        } catch (error) {
            console.error('Error loading members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;

        setInviting(true);
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`/api/workspace/${workspaceId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    role: inviteRole,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to invite member');
            }

            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('member');
            await loadMembers(workspaceId);
            alert('Member invited successfully!');
        } catch (error: any) {
            console.error('Error inviting member:', error);
            alert(error.message || 'Failed to invite member');
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch(`/api/workspace/${workspaceId}/members?memberId=${memberId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Failed to remove member');

            await loadMembers(workspaceId);
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Failed to remove member');
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
                return <Crown className="w-4 h-4 text-yellow-600" />;
            case 'admin':
                return <Shield className="w-4 h-4 text-blue-600" />;
            default:
                return <UserIcon className="w-4 h-4 text-gray-600" />;
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-yellow-100 text-yellow-800';
            case 'admin':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
                    <p className="text-gray-600 mt-1">{members.length} / 5 members</p>
                </div>

                <button
                    onClick={() => setShowInviteModal(true)}
                    disabled={members.length >= 5}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite Member
                </button>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                {members.map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                    {member.user?.email?.charAt(0).toUpperCase() || '?'}
                                </span>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">
                                        {member.user?.name || member.user?.email || 'Unknown'}
                                    </p>
                                    {member.user_id === currentUserId && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                            You
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">{member.user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(member.role)}`}>
                                {getRoleIcon(member.role)}
                                <span className="capitalize">{member.role}</span>
                            </div>

                            {member.role !== 'owner' && member.user_id !== currentUserId && (
                                <button
                                    onClick={() => handleRemove(member.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Remove member"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>MVP Limit:</strong> You can have up to 5 team members. Owners can manage all settings,
                    admins can manage members and records, and members can view and edit records.
                </p>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Invite Team Member</h2>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="member">Member - Can view and edit records</option>
                                    <option value="admin">Admin - Can manage team and records</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={inviting || !inviteEmail}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <Mail className="w-4 h-4" />
                                {inviting ? 'Sending...' : 'Send Invite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
