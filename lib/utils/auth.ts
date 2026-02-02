/**
 * Mock Auth for Development/Testing
 * Replace with real Supabase auth in production
 */

const MOCK_USER = {
    id: '905e0560-5086-4a4e-83d0-ba9462c8b989',
    email: 'demo@vibecrm.com',
    name: 'Demo User',
    avatar_url: null,
};

const MOCK_TOKEN = 'mock-jwt-token-for-development';

export async function getAuthToken(): Promise<string | null> {
    // In development, return mock token
    if (process.env.NODE_ENV === 'development') {
        return MOCK_TOKEN;
    }

    // In production, use real Supabase auth
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

export async function getCurrentUser() {
    // In development, return mock user
    if (process.env.NODE_ENV === 'development') {
        return MOCK_USER;
    }

    // In production, use real Supabase auth
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function signOut() {
    // In development, just redirect
    if (process.env.NODE_ENV === 'development') {
        window.location.href = '/';
        return;
    }

    // In production, use real Supabase auth
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut();
}

export function isMockAuth(): boolean {
    return process.env.NODE_ENV === 'development';
}

export function getMockUserId(): string {
    return MOCK_USER.id;
}
