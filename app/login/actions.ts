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

    // The trigger handle_new_user() will automatically create the profile
    // But we verify it was created as a fallback (in case trigger fails)
    if (authData.user) {
        // Wait a bit for trigger to execute (trigger is async)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify profile was created, if not, create it manually as fallback
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', authData.user.id)
            .maybeSingle();
        
        if (!existingProfile) {
            console.warn('Profile not created by trigger, creating manually...');
            const { error: profileError } = await supabase.from('user_profiles').insert({
                id: authData.user.id,
                email: authData.user.email!,
                role: 'conductor',
                display_name: authData.user.email!.split('@')[0],
            });

            if (profileError) {
                console.error('Error creating profile (fallback):', profileError);
                // Still allow signup to proceed - user can be fixed manually
            }
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
