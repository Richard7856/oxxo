'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PushNotificationManagerProps {
    userId: string;
}

export default function PushNotificationManager({ userId }: PushNotificationManagerProps) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Verificar si el navegador soporta notificaciones push
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            'PushManager' in window
        ) {
            setIsSupported(true);
            checkSubscription();
        }
    }, []);

    async function getVapidPublicKey(): Promise<string> {
        try {
            const response = await fetch('/api/push/vapid-public-key');
            const data = await response.json();
            return data.publicKey;
        } catch (error) {
            console.error('Error getting VAPID key:', error);
            throw error;
        }
    }

    async function checkSubscription() {
        if (typeof window === 'undefined') return;

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }

    async function requestPermission() {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            // Solicitar permiso de notificaciones
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Los permisos de notificación fueron denegados');
                setIsLoading(false);
                return;
            }

            // Registrar service worker si no está registrado
            let registration = await navigator.serviceWorker.ready;
            if (!registration) {
                registration = await navigator.serviceWorker.register('/sw.js');
            }

            // Obtener la clave pública VAPID
            const vapidPublicKey = await getVapidPublicKey();
            
            // Crear suscripción push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
            });

            // Enviar suscripción al servidor
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
                        auth: arrayBufferToBase64(subscription.getKey('auth')!),
                    },
                }),
            });

            if (response.ok) {
                setIsSubscribed(true);
                alert('Notificaciones activadas correctamente');
            } else {
                throw new Error('Error al registrar suscripción');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            alert('Error al activar notificaciones. Asegúrate de que la app esté instalada como PWA.');
        } finally {
            setIsLoading(false);
        }
    }

    async function unsubscribe() {
        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                alert('Notificaciones desactivadas');
            }
        } catch (error) {
            console.error('Error unsubscribing:', error);
            alert('Error al desactivar notificaciones');
        } finally {
            setIsLoading(false);
        }
    }

    if (!isSupported) {
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-lg mb-2">Notificaciones Push</h3>
            <p className="text-sm text-gray-600 mb-4">
                Recibe notificaciones cuando haya nuevos mensajes en el chat
            </p>
            {isSubscribed ? (
                <div className="space-y-2">
                    <p className="text-sm text-green-600">✓ Notificaciones activadas</p>
                    <button
                        onClick={unsubscribe}
                        disabled={isLoading}
                        className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                        {isLoading ? 'Desactivando...' : 'Desactivar Notificaciones'}
                    </button>
                </div>
            ) : (
                <button
                    onClick={requestPermission}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Activando...' : 'Activar Notificaciones'}
                </button>
            )}
        </div>
    );
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

