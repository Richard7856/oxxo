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
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Verificar si el navegador soporta notificaciones push
        const checkSupport = async () => {
            if (typeof window === 'undefined') {
                setIsChecking(false);
                return;
            }

            // Verificar soporte básico
            const hasSupport = 'serviceWorker' in navigator && 'PushManager' in window;
            
            if (!hasSupport) {
                console.log('Navegador no soporta notificaciones push');
                setIsSupported(false);
                setIsChecking(false);
                return;
            }

            setIsSupported(true);
            
            // Intentar verificar suscripción, pero no bloquear si falla
            // Usar timeout para asegurar que no se quede pensando
            const checkWithTimeout = Promise.race([
                checkSubscription(),
                new Promise<void>((resolve) => {
                    setTimeout(() => {
                        console.warn('Timeout al verificar suscripción');
                        resolve();
                    }, 3000);
                })
            ]);

            try {
                await checkWithTimeout;
            } catch (error) {
                console.warn('Error al verificar suscripción inicial:', error);
                // No establecer isSubscribed, dejar que el usuario intente activar
            } finally {
                setIsChecking(false);
            }
        };

        checkSupport();
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
        if (typeof window === 'undefined') {
            setIsSubscribed(false);
            return;
        }

        try {
            // Intentar obtener registros (sin timeout, es rápido normalmente)
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            if (registrations.length === 0) {
                console.log('No hay service workers registrados');
                setIsSubscribed(false);
                return;
            }

            // Intentar obtener service worker ready con timeout
            const readyPromise = navigator.serviceWorker.ready;
            
            // Timeout de 5 segundos
            const registration = await Promise.race([
                readyPromise,
                new Promise<ServiceWorkerRegistration>((_, reject) =>
                    setTimeout(() => reject(new Error('Service worker timeout')), 5000)
                )
            ]) as ServiceWorkerRegistration;
            
            if (!registration || !registration.pushManager) {
                console.log('Service worker no tiene pushManager');
                setIsSubscribed(false);
                return;
            }

            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (error: any) {
            console.warn('Error checking subscription:', error?.message || error);
            setIsSubscribed(false);
            // No lanzar error, solo dejar que el usuario intente activar
        }
    }

    async function requestPermission() {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            // Solicitar permiso de notificaciones PRIMERO
            console.log('Solicitando permiso de notificaciones...');
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Los permisos de notificación fueron denegados');
                setIsLoading(false);
                return;
            }
            console.log('Permiso de notificaciones concedido');

            // Simplificar: usar navigator.serviceWorker.ready directamente
            // Este es el método más confiable y recomendado
            console.log('Esperando service worker ready...');
            
            let registration: ServiceWorkerRegistration;
            
            // Estrategia más simple: intentar obtener el service worker ready con timeout largo
            // Si falla, dar una instrucción clara al usuario
            try {
                registration = await Promise.race([
                    navigator.serviceWorker.ready.then(reg => {
                        console.log('✓ Service worker ready obtenido exitosamente');
                        return reg;
                    }),
                    new Promise<ServiceWorkerRegistration>((_, reject) => {
                        setTimeout(() => {
                            console.error('✗ Timeout esperando serviceWorker.ready');
                            reject(new Error('TIMEOUT_READY'));
                        }, 20000); // 20 segundos - tiempo muy generoso para móviles
                    })
                ]);
            } catch (readyError: any) {
                // Si es timeout, dar mensaje más específico
                if (readyError?.message === 'TIMEOUT_READY') {
                    throw new Error('El service worker tardó demasiado en estar listo. Por favor:\n1. Asegúrate de que la app esté instalada como PWA\n2. Recarga la página completamente\n3. Intenta de nuevo');
                }
                
                // Otro error, intentar estrategia alternativa
                console.log('serviceWorker.ready falló, intentando alternativa...', readyError);
                
                // Verificar registros existentes
                const existingRegs = await navigator.serviceWorker.getRegistrations();
                if (existingRegs.length > 0) {
                    console.log('Usando service worker existente...');
                    registration = existingRegs[0];
                    
                    // Si no está activo, esperar un poco más
                    if (!registration.active) {
                        console.log('Service worker no activo, esperando activación...');
                        // Esperar hasta 10 segundos más
                        await new Promise<void>((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                reject(new Error('El service worker no se activó después de esperar. Por favor recarga la página.'));
                            }, 10000);
                            
                            // Intentar activar si está en waiting
                            if (registration.waiting) {
                                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                            }
                            
                            // Escuchar cambios de estado
                            const checkActive = () => {
                                if (registration.active) {
                                    clearTimeout(timeout);
                                    resolve();
                                }
                            };
                            
                            if (registration.installing) {
                                registration.installing.addEventListener('statechange', checkActive);
                            }
                            if (registration.waiting) {
                                registration.waiting.addEventListener('statechange', checkActive);
                            }
                            
                            // Verificar periódicamente
                            const interval = setInterval(() => {
                                if (registration.active) {
                                    clearInterval(interval);
                                    clearTimeout(timeout);
                                    resolve();
                                }
                            }, 500);
                            
                            // Cleanup si se resuelve por timeout
                            setTimeout(() => {
                                clearInterval(interval);
                            }, 10000);
                        });
                    }
                } else {
                    // No hay service worker - esto no debería pasar si next-pwa está funcionando
                    throw new Error('No se encontró un service worker. La app debe estar instalada como PWA. Por favor instala la app desde el navegador y recarga la página.');
                }
            }
            
            // Verificar que tenemos un registration válido
            if (!registration) {
                throw new Error('No se pudo obtener el service worker. Por favor recarga la página e intenta de nuevo.');
            }
            
            // Verificar pushManager
            if (!registration.pushManager) {
                throw new Error('El service worker no soporta push notifications. Por favor verifica que estás usando un navegador moderno.');
            }
            
            if (!registration) {
                throw new Error('No se pudo obtener el service worker');
            }

            // Obtener la clave pública VAPID
            const vapidPublicKey = await getVapidPublicKey();
            if (!vapidPublicKey) {
                throw new Error('No se pudo obtener la clave VAPID');
            }
            
            // Crear suscripción push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
            });

            if (!subscription) {
                throw new Error('No se pudo crear la suscripción push');
            }

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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Error al registrar suscripción');
            }

            setIsSubscribed(true);
            alert('Notificaciones activadas correctamente');
        } catch (error: any) {
            console.error('Error requesting permission:', error);
            const errorMessage = error?.message || 'Error desconocido';
            alert(`Error al activar notificaciones: ${errorMessage}\n\nAsegúrate de que:\n- La app esté instalada como PWA\n- El navegador soporte notificaciones push\n- Tienes conexión a internet`);
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

    // Mostrar estado de carga inicial
    if (isChecking) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-lg mb-2">Notificaciones Push</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Recibe notificaciones cuando haya nuevos mensajes en el chat
                </p>
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-500">Verificando...</p>
                </div>
            </div>
        );
    }

    if (!isSupported) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-lg mb-2">Notificaciones Push</h3>
                <p className="text-sm text-gray-600 mb-2">
                    Tu navegador no soporta notificaciones push.
                </p>
                <p className="text-xs text-gray-500">
                    Para activar notificaciones, asegúrate de usar un navegador moderno y que la app esté instalada como PWA.
                </p>
            </div>
        );
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

