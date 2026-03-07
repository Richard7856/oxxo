'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface NotificationToggleProps {
    userId: string;
}

export default function NotificationToggle({ userId }: NotificationToggleProps) {
    const [enabled, setEnabled] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        loadNotificationStatus();
    }, [userId]);

    const loadNotificationStatus = async () => {
        try {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('metadata')
                .eq('id', userId)
                .single();

            if (profile?.metadata) {
                const metadata = profile.metadata as Record<string, any>;
                // Para admins, por defecto está desactivado (null o false)
                // Solo se activa si está explícitamente en true
                setEnabled(metadata.notifications_enabled === true);
            } else {
                setEnabled(false);
            }
        } catch (error) {
            console.error('Error loading notification status:', error);
            setEnabled(false);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async () => {
        setSaving(true);
        try {
            // Obtener metadata actual
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('metadata')
                .eq('id', userId)
                .single();

            const currentMetadata = (profile?.metadata as Record<string, any>) || {};
            const newMetadata = {
                ...currentMetadata,
                notifications_enabled: !enabled,
            };

            const { error } = await supabase
                .from('user_profiles')
                .update({ metadata: newMetadata })
                .eq('id', userId);

            if (error) {
                throw error;
            }

            setEnabled(!enabled);
        } catch (error) {
            console.error('Error updating notification status:', error);
            alert('Error al actualizar las notificaciones. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse flex items-center gap-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-5 w-9 bg-gray-200 rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Notificaciones:</span>
                    <button
                        onClick={handleToggle}
                        disabled={saving}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                            enabled ? 'bg-blue-600' : 'bg-gray-200'
                        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        role="switch"
                        aria-checked={enabled ?? false}
                    >
                        <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                    </button>
                    <span className="text-xs text-gray-600">
                        {enabled ? 'Activadas' : 'Desactivadas'}
                    </span>
                </div>
            </div>
        </div>
    );
}

