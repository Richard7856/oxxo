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
            <div className="bg-white rounded-lg shadow p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Notificaciones Push
                    </h3>
                    <p className="text-sm text-gray-600">
                        {enabled
                            ? 'Recibirás notificaciones cuando los conductores envíen mensajes o creen reportes.'
                            : 'Las notificaciones están desactivadas. No recibirás alertas.'}
                    </p>
                </div>
                <button
                    onClick={handleToggle}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    role="switch"
                    aria-checked={enabled}
                >
                    <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
        </div>
    );
}

