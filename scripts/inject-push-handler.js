#!/usr/bin/env node

/**
 * Script para inyectar handlers de push notifications en el service worker generado por next-pwa
 * Este script se ejecuta después del build para agregar los event listeners de push
 */

const fs = require('fs');
const path = require('path');

const pushHandlerCode = `
// Push notification handlers (injected by inject-push-handler.js)
self.addEventListener('push', function(event) {
    console.log('[SW] Push event received');
    
    let notificationData = {
        title: 'Nueva notificación',
        body: 'Tienes una nueva notificación',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'default',
        requireInteraction: false,
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[SW] Push data:', data);
            
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                tag: data.tag || notificationData.tag,
                data: data.data || {},
                requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
                urgency: data.urgency || 'normal',
            };
        } catch (error) {
            console.error('[SW] Error parsing push data:', error);
            notificationData.body = event.data.text();
        }
    }
    
    // Asegurar que el service worker se mantenga activo
    // Esto es crítico para Android cuando la app está cerrada
    const promiseChain = self.registration.showNotification(notificationData.title, {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: notificationData.data,
        requireInteraction: notificationData.requireInteraction,
        urgency: notificationData.urgency,
        vibrate: [200, 100, 200],
        silent: false,
        renotify: true,
    }).catch(function(error) {
        console.error('[SW] Error showing notification:', error);
        // Re-throw para que waitUntil capture el error
        throw error;
    });
    
    // waitUntil asegura que el service worker se mantenga activo
    // hasta que la notificación se muestre completamente
    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked');
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    const promiseChain = self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
    }).then(function(windowClients) {
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === urlToOpen && 'focus' in client) {
                return client.focus();
            }
        }
        if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
        }
    });
    
    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclose', function(event) {
    console.log('[SW] Notification closed');
});
`;

const publicDir = path.join(__dirname, '..', 'public');
const swPath = path.join(publicDir, 'sw.js');

// Verificar que el archivo sw.js existe
if (!fs.existsSync(swPath)) {
    console.log('⚠️  sw.js no encontrado. Asegúrate de ejecutar npm run build primero.');
    process.exit(0);
}

// Leer el archivo sw.js
let swContent = fs.readFileSync(swPath, 'utf8');

// Verificar si ya tiene el código inyectado
if (swContent.includes('Push notification handlers (injected by inject-push-handler.js)')) {
    console.log('ℹ️  Los handlers de push ya están inyectados en sw.js');
    process.exit(0);
}

// El código de workbox está minificado en una sola línea dentro de un define()
// Necesitamos agregar nuestro código AL FINAL del archivo, después de todo el código de workbox
// Simplemente agregamos nuestro código al final del archivo
swContent = swContent.trim() + '\n\n' + pushHandlerCode;

// Escribir el archivo modificado
fs.writeFileSync(swPath, swContent, 'utf8');
console.log('✅ Handlers de push notifications inyectados en sw.js');
