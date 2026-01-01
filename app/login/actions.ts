/**
 * Server Actions para autenticación
 * Maneja login, logout y signup con Supabase
 */

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    console.log('🔑 Attempting login for:', data.email);
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
        console.log('❌ Login error:', error.message);
        return { error: error.message };
    }

    console.log('✅ Login successful, redirecting...');
    revalidatePath('/', 'layout');
    redirect('/');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    };

    const { data: authData, error } = await supabase.auth.signUp(data);

    if (error) {
        return { error: error.message };
    }

    // Create user profile immediately
    if (authData.user) {
        const { error: profileError } = await supabase.from('user_profiles').insert({
            id: authData.user.id,
            email: authData.user.email!,
            role: 'conductor',
            display_name: authData.user.email!.split('@')[0],
        });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Don't fail signup if profile creation fails
        }
    }

    revalidatePath('/', 'layout');
    redirect('/');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
    redirect('/login');
}
