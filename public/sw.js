if(!self.define){let e,a={};const c=(c,s)=>(c=new URL(c+".js",s).href,a[c]||new Promise(a=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=a,document.head.appendChild(e)}else e=c,importScripts(c),a()}).then(()=>{let e=a[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e}));self.define=(s,i)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(a[t])return;let n={};const b=e=>c(e,t),d={module:{uri:t},exports:n,require:b};a[t]=Promise.all(s.map(e=>d[e]||b(e))).then(e=>(i(...e),n))}}define(["./workbox-cb477421"],function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/WCerd4A_6bXpx4pyON3YI/_buildManifest.js",revision:"191e3c629b892ac17b297991c932b437"},{url:"/_next/static/WCerd4A_6bXpx4pyON3YI/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/179-d9ae28c3bb7f3b64.js",revision:"d9ae28c3bb7f3b64"},{url:"/_next/static/chunks/398-4b6a2ce7225b8e50.js",revision:"4b6a2ce7225b8e50"},{url:"/_next/static/chunks/4bd1b696-deba172d32c79f82.js",revision:"deba172d32c79f82"},{url:"/_next/static/chunks/500-b84d19d842172eba.js",revision:"b84d19d842172eba"},{url:"/_next/static/chunks/578-32472879d1497e5a.js",revision:"32472879d1497e5a"},{url:"/_next/static/chunks/598-b31017a24dd26a78.js",revision:"b31017a24dd26a78"},{url:"/_next/static/chunks/774-ec2069556fb9356c.js",revision:"ec2069556fb9356c"},{url:"/_next/static/chunks/794-e02d285919b32be1.js",revision:"e02d285919b32be1"},{url:"/_next/static/chunks/886-61fa6d66a6afb62e.js",revision:"61fa6d66a6afb62e"},{url:"/_next/static/chunks/app/_global-error/page-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/_not-found/page-1eef885f48b5e32b.js",revision:"1eef885f48b5e32b"},{url:"/_next/static/chunks/app/admin/chat/%5Bid%5D/page-278e37f6da16a5a3.js",revision:"278e37f6da16a5a3"},{url:"/_next/static/chunks/app/admin/page-b46310a5325c8b17.js",revision:"b46310a5325c8b17"},{url:"/_next/static/chunks/app/admin/reporte/%5Bid%5D/page-95fa17cbac15de82.js",revision:"95fa17cbac15de82"},{url:"/_next/static/chunks/app/api/chat/upload-image/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/push/send-chat-notification/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/push/send/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/push/subscribe/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/push/vapid-public-key/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/reportes/%5Bid%5D/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/reportes/create/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/stores/validate/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/api/tickets/extract/route-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/comercial/chat/%5Bid%5D/page-0c6ac31985a49035.js",revision:"0c6ac31985a49035"},{url:"/_next/static/chunks/app/comercial/page-2e2948d7fdc453ed.js",revision:"2e2948d7fdc453ed"},{url:"/_next/static/chunks/app/comercial/reporte/%5Bid%5D/page-bf4b8e1eebf9e62d.js",revision:"bf4b8e1eebf9e62d"},{url:"/_next/static/chunks/app/conductor/chat/%5Bid%5D/page-712ca2bceada9385.js",revision:"712ca2bceada9385"},{url:"/_next/static/chunks/app/conductor/layout-3f3036612ce4acd1.js",revision:"3f3036612ce4acd1"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/flujo/page-0f01d690ec7bdc26.js",revision:"0f01d690ec7bdc26"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/page-e8bdbe941f676b35.js",revision:"e8bdbe941f676b35"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/ticket-merma-review/page-fbaecbc44288ebf6.js",revision:"fbaecbc44288ebf6"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/ticket-review/page-d9b9bd362481d5da.js",revision:"d9b9bd362481d5da"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/page-fdada3b5d1e377d2.js",revision:"fdada3b5d1e377d2"},{url:"/_next/static/chunks/app/conductor/page-dbf66e1de3e02d42.js",revision:"dbf66e1de3e02d42"},{url:"/_next/static/chunks/app/flujo/page-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/app/layout-b9bce6fbe8ff8006.js",revision:"b9bce6fbe8ff8006"},{url:"/_next/static/chunks/app/login/page-8306b295aeb4c8d0.js",revision:"8306b295aeb4c8d0"},{url:"/_next/static/chunks/app/page-40826df79c82eb7c.js",revision:"40826df79c82eb7c"},{url:"/_next/static/chunks/app/test-env/page-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/framework-d7de93249215fb06.js",revision:"d7de93249215fb06"},{url:"/_next/static/chunks/main-app-a28a5bf4c58f6ba4.js",revision:"a28a5bf4c58f6ba4"},{url:"/_next/static/chunks/main-bafba84362a31b3b.js",revision:"bafba84362a31b3b"},{url:"/_next/static/chunks/next/dist/client/components/builtin/app-error-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/next/dist/client/components/builtin/forbidden-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/next/dist/client/components/builtin/global-error-13ceb6893f3cfaf5.js",revision:"13ceb6893f3cfaf5"},{url:"/_next/static/chunks/next/dist/client/components/builtin/not-found-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/next/dist/client/components/builtin/unauthorized-3de61719bffabdc6.js",revision:"3de61719bffabdc6"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-b6d996bb3db25032.js",revision:"b6d996bb3db25032"},{url:"/_next/static/css/6c7cd0a409ab6473.css",revision:"6c7cd0a409ab6473"},{url:"/_next/static/media/4cf2300e9c8272f7-s.p.woff2",revision:"18bae71b1e1b2bb25321090a3b563103"},{url:"/_next/static/media/747892c23ea88013-s.woff2",revision:"a0761690ccf4441ace5cec893b82d4ab"},{url:"/_next/static/media/8d697b304b401681-s.woff2",revision:"cc728f6c0adb04da0dfcb0fc436a8ae5"},{url:"/_next/static/media/93f479601ee12b01-s.p.woff2",revision:"da83d5f06d825c5ae65b7cca706cb312"},{url:"/_next/static/media/9610d9e46709d722-s.woff2",revision:"7b7c0ef93df188a852344fc272fc096b"},{url:"/_next/static/media/ba015fad6dcf6784-s.woff2",revision:"8ea4f719af3312a055caf09f34c89a77"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icon-192.png",revision:"a400df8a5e0be2a43d60d972258245ff"},{url:"/icon-192.svg",revision:"8f6b145567d23aebd85b65d47e2c725f"},{url:"/icon-512.png",revision:"f4cdeadb9b09cf4097c119c5f5f3ca7b"},{url:"/icon-512.svg",revision:"54a84fb32e094b03d145baed67d06fd8"},{url:"/manifest.json",revision:"d8912cff8329f5cbb6b2fe6a9c66de91"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:a,event:c,state:s})=>a&&"opaqueredirect"===a.type?new Response(a.body,{status:200,statusText:"OK",headers:a.headers}):a}]}),"GET"),e.registerRoute(/^https:\/\/.*\.supabase\.co\/.*/i,new e.NetworkFirst({cacheName:"supabase-cache",plugins:[new e.ExpirationPlugin({maxEntries:50,maxAgeSeconds:86400})]}),"GET")});


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
