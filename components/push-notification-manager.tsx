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
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Verificar si el navegador soporta notificaciones push
        const checkSupport = async () => {
            if (typeof window === 'undefined') {
                setIsChecking(false);
                return;
            }

            // Detectar iOS/Safari
            const detectedIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            setIsIOS(detectedIOS);

            console.log('[Push] Detección:', { isIOS: detectedIOS, isSafari, userAgent: navigator.userAgent });

            // Verificar soporte básico
            const hasServiceWorker = 'serviceWorker' in navigator;
            const hasPushManager = 'PushManager' in window;
            const hasSupport = hasServiceWorker && hasPushManager;
            
            console.log('[Push] Soporte:', { hasServiceWorker, hasPushManager, hasSupport });
            
            if (!hasSupport) {
                console.log('[Push] Navegador no soporta notificaciones push');
                setIsSupported(false);
                setIsChecking(false);
                return;
            }

            setIsSupported(true);
            
            // En iOS/Safari, el service worker puede no estar disponible inmediatamente
            // Intentar verificar/registrar después de un breve delay
            if (detectedIOS || isSafari) {
                console.log('[Push] Detectado iOS/Safari, esperando un momento para service worker...');
                setTimeout(async () => {
                    try {
                        await checkSubscription();
                    } catch (error) {
                        console.warn('[Push] Error al verificar suscripción inicial:', error);
                    } finally {
                        setIsChecking(false);
                    }
                }, 1000);
            } else {
                // Otros navegadores: verificar inmediatamente
                try {
                    await checkSubscription();
                } catch (error) {
                    console.warn('[Push] Error al verificar suscripción inicial:', error);
                } finally {
                    setIsChecking(false);
                }
            }
        };

        checkSupport();
    }, []);

    async function getVapidPublicKey(): Promise<string> {
        try {
            const response = await fetch('/api/push/vapid-public-key');
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[Push] Error en respuesta VAPID:', response.status, errorData);
                throw new Error(errorData.error || `Error del servidor: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.publicKey) {
                console.error('[Push] No se recibió publicKey en la respuesta:', data);
                throw new Error('El servidor no devolvió la clave VAPID');
            }
            
            return data.publicKey;
        } catch (error: any) {
            console.error('[Push] Error getting VAPID key:', error);
            if (error.message) {
                throw error;
            }
            throw new Error('Error al obtener la clave VAPID del servidor');
        }
    }

    async function checkSubscription() {
        if (typeof window === 'undefined') {
            setIsSubscribed(false);
            return;
        }

        try {
            console.log('[Push] Verificando suscripción existente...');
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            if (registrations.length === 0) {
                console.log('[Push] No hay service workers registrados');
                setIsSubscribed(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            console.log('[Push] Service worker ready para verificar suscripción');
            
            if (!registration?.pushManager) {
                console.log('[Push] Service worker no tiene pushManager');
                setIsSubscribed(false);
                return;
            }

            const subscription = await registration.pushManager.getSubscription();
            const isSubscribed = !!subscription;
            console.log('[Push] Estado de suscripción:', isSubscribed ? 'suscrito' : 'no suscrito');
            setIsSubscribed(isSubscribed);
        } catch (error: any) {
            console.warn('[Push] Error verificando suscripción:', error?.message || error);
            setIsSubscribed(false);
        }
    }

    async function requestPermission() {
        if (!isSupported) return;

        setIsLoading(true);
        try {
            // Paso 1: Solicitar permiso de notificaciones
            console.log('[Push] Solicitando permiso de notificaciones...');
            const permission = await Notification.requestPermission();
            console.log('[Push] Permiso:', permission);
            
            if (permission !== 'granted') {
                alert('Los permisos de notificación fueron denegados. Por favor, habilita las notificaciones en la configuración del navegador.');
                setIsLoading(false);
                return;
            }

            // Paso 2: Verificar que hay service workers registrados
            console.log('[Push] Verificando service workers...');
            let registrations = await navigator.serviceWorker.getRegistrations();
            console.log('[Push] Service workers encontrados:', registrations.length);
            
            // Si no hay registros, intentar registrar el service worker manualmente
            if (registrations.length === 0) {
                console.log('[Push] No hay service workers, intentando registrar...');
                try {
                    // next-pwa registra el service worker en /sw.js
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                    });
                    console.log('[Push] Service worker registrado manualmente:', registration.scope);
                    registrations = [registration];
                    
                    // Esperar a que esté listo
                    await navigator.serviceWorker.ready;
                    console.log('[Push] Service worker listo después de registro manual');
                } catch (regError: any) {
                    console.error('[Push] Error al registrar service worker:', regError);
                    throw new Error(
                        'No se encontró ningún service worker y no se pudo registrar uno automáticamente. ' +
                        'Asegúrate de que la app esté instalada como PWA (desde el menú de compartir > Añadir a pantalla de inicio) ' +
                        'y que estés usando una versión construida (npm run build && npm start), no en modo desarrollo.'
                    );
                }
            }

            // Paso 3: Obtener el service worker listo
            console.log('[Push] Esperando service worker ready...');
            let registration: ServiceWorkerRegistration;
            
            try {
                registration = await navigator.serviceWorker.ready;
                console.log('[Push] Service worker ready:', registration.active ? 'activo' : 'no activo');
            } catch (readyError: any) {
                console.error('[Push] Error esperando service worker ready:', readyError);
                // Si falla, usar el primer registro disponible
                if (registrations.length > 0) {
                    registration = registrations[0];
                    console.log('[Push] Usando service worker de registros disponibles');
                } else {
                    throw new Error('No se pudo obtener el service worker. Por favor recarga la página.');
                }
            }
            
            if (!registration) {
                throw new Error('No se pudo obtener el service worker. Por favor recarga la página.');
            }

            // Paso 4: Verificar pushManager
            if (!registration.pushManager) {
                throw new Error('El service worker no soporta push notifications. Usa un navegador moderno (Chrome, Firefox, Edge).');
            }

            // Paso 5: Obtener la clave pública VAPID
            console.log('[Push] Obteniendo clave VAPID...');
            const vapidPublicKey = await getVapidPublicKey();
            console.log('[Push] Clave VAPID obtenida:', vapidPublicKey ? '✓' : '✗');
            
            if (!vapidPublicKey) {
                throw new Error('No se pudo obtener la clave VAPID del servidor.');
            }
            
            // Paso 6: Verificar si ya existe una suscripción
            console.log('[Push] Verificando suscripción existente...');
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('[Push] Ya existe una suscripción, desuscribiendo...');
                await existingSubscription.unsubscribe();
            }
            
            // Paso 7: Crear nueva suscripción push
            console.log('[Push] Creando nueva suscripción...');
            const vapidKeyArray = urlBase64ToUint8Array(vapidPublicKey);
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKeyArray as BufferSource,
            });
            console.log('[Push] Suscripción creada:', subscription.endpoint);

            if (!subscription) {
                throw new Error('No se pudo crear la suscripción push.');
            }

            // Paso 8: Enviar suscripción al servidor
            console.log('[Push] Enviando suscripción al servidor...');
            const p256dh = subscription.getKey('p256dh');
            const auth = subscription.getKey('auth');
            
            if (!p256dh || !auth) {
                throw new Error('La suscripción no contiene las claves necesarias.');
            }

            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: arrayBufferToBase64(p256dh),
                        auth: arrayBufferToBase64(auth),
                    },
                }),
            });

            const responseData = await response.json().catch(() => ({}));
            console.log('[Push] Respuesta del servidor:', response.status, responseData);

            if (!response.ok) {
                throw new Error(responseData.error || `Error del servidor: ${response.status}`);
            }

            // Paso 9: Actualizar estado
            setIsSubscribed(true);
            console.log('[Push] ✓ Notificaciones activadas correctamente');
            alert('✓ Notificaciones activadas correctamente');
        } catch (error: any) {
            console.error('[Push] Error completo:', error);
            const errorMessage = error?.message || 'Error desconocido';
            console.error('[Push] Mensaje de error:', errorMessage);
            console.error('[Push] Stack:', error?.stack);
            
            alert(`Error al activar notificaciones:\n\n${errorMessage}\n\nVerifica la consola para más detalles.`);
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
                {isIOS ? (
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>
                            <strong>Nota sobre iOS/Safari:</strong> Las notificaciones push en PWAs de iOS requieren iOS 16.4+ y tienen limitaciones.
                        </p>
                        <p>
                            Para usar notificaciones push, considera usar Chrome, Firefox o Edge en lugar de Safari.
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">
                        Para activar notificaciones, asegúrate de usar un navegador moderno (Chrome, Firefox, Edge) y que la app esté instalada como PWA.
                    </p>
                )}
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

