/**
 * Auth Middleware for API Routes
 * Handles both development (mock) and production (real Supabase) authentication
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getMockUserId } from '@/lib/utils/auth';

export interface AuthenticatedUser {
    id: string;
    email: string;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return null;
    }

    // Development mode: Accept mock token
    if (process.env.NODE_ENV === 'development' && token === 'mock-jwt-token-for-development') {
        return {
            id: getMockUserId(),
            email: 'demo@vibecrm.com',
        };
    }

    // Production mode: Validate real Supabase token
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return null;
        }

        return {
            id: user.id,
            email: user.email || '',
        };
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}
