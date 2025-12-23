'use server';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/lib/types/database.types';

export async function updateUserRole(userId: string, role: UserRole) {
    const supabase = await createClient();

    // If changing to comercial, zona is required, but we'll handle that in the UI
    const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user role:', error);
        return { error: 'Error al actualizar el rol del usuario' };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
}

export async function updateUserZona(userId: string, zona: string | null) {
    const supabase = await createClient();

    // First check if user is comercial - if so, zona is required
    const { data: user } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (user?.role === 'comercial' && !zona) {
        return { error: 'Los comerciales deben tener una zona asignada' };
    }

    const { error } = await supabase
        .from('user_profiles')
        .update({ zona })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user zona:', error);
        return { error: 'Error al actualizar la zona del usuario' };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
}

export async function updateUserRoleAndZona(
    userId: string,
    role: UserRole,
    zona: string | null
) {
    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient();

    // If changing to comercial, zona is required
    if (role === 'comercial' && !zona) {
        return { error: 'Los comerciales deben tener una zona asignada' };
    }

    // If changing from comercial to another role, clear zona if not needed
    const updateData: { role: UserRole; zona: string | null } = { role, zona };
    
    // If not comercial and zona is set, we can keep it or clear it - for now we'll update both
    const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        console.error('Error updating user:', error);
        return { error: 'Error al actualizar el usuario' };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
    // Use service role client to bypass RLS for admin operations
    const supabase = createServiceRoleClient();

    const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user active status:', error);
        return { error: 'Error al actualizar el estado del usuario' };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
}

