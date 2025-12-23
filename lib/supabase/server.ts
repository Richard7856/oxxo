/**
 * Supabase client for server components and route handlers
 * Uses cookies for authentication state management
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                // Legacy methods for @supabase/ssr v0.0.10
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    try {
                        console.log('🍪 Setting cookie (legacy):', name);
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        console.error('❌ Error setting cookie:', error);
                    }
                },
                remove(name: string, options: any) {
                    try {
                        console.log('🍪 Removing cookie (legacy):', name);
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        console.error('❌ Error removing cookie:', error);
                    }
                },
                // New methods (keep just in case)
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: any) {
                    try {
                        console.log('🍪 Setting cookies (new):', cookiesToSet.map((c: any) => c.name).join(', '));
                        cookiesToSet.forEach(({ name, value, options }: any) =>
                            cookieStore.set(name, value, options)
                        );
                        console.log('✅ Cookies set successfully');
                    } catch (error) {
                        console.error('❌ Error setting cookies:', error);
                    }
                },
            },
        }
    );
}

/**
 * Service role client for admin operations
 * ONLY use in server components/API routes, NEVER expose to client
 * Uses @supabase/supabase-js directly for service role (bypasses RLS)
 */
export function createServiceRoleClient() {
    // Dynamic import to avoid bundling issues
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
    }
    
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}
