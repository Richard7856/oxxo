if(!self.define){let e,a={};const s=(s,i)=>(s=new URL(s+".js",i).href,a[s]||new Promise(a=>{if("document"in self){const e=document.createElement("script");e.src=s,e.onload=a,document.head.appendChild(e)}else e=s,importScripts(s),a()}).then(()=>{let e=a[s];if(!e)throw new Error(`Module ${s} didn’t register its module`);return e}));self.define=(i,t)=>{const c=e||("document"in self?document.currentScript.src:"")||location.href;if(a[c])return;let n={};const f=e=>s(e,c),r={module:{uri:c},exports:n,require:f};a[c]=Promise.all(i.map(e=>r[e]||f(e))).then(e=>(t(...e),n))}}define(["./workbox-cb477421"],function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/HKL3peYqU04FFiSzAgzsc/_buildManifest.js",revision:"5673c70e0083bb9b85a9fcca40f121a9"},{url:"/_next/static/HKL3peYqU04FFiSzAgzsc/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/_next/static/chunks/105-7cf70a064a50eaee.js",revision:"7cf70a064a50eaee"},{url:"/_next/static/chunks/179-e4d15b4c4944229c.js",revision:"e4d15b4c4944229c"},{url:"/_next/static/chunks/302-fb185fb3f3ca09be.js",revision:"fb185fb3f3ca09be"},{url:"/_next/static/chunks/4bd1b696-deba172d32c79f82.js",revision:"deba172d32c79f82"},{url:"/_next/static/chunks/500-b84d19d842172eba.js",revision:"b84d19d842172eba"},{url:"/_next/static/chunks/598-b31017a24dd26a78.js",revision:"b31017a24dd26a78"},{url:"/_next/static/chunks/774-ec2069556fb9356c.js",revision:"ec2069556fb9356c"},{url:"/_next/static/chunks/794-e02d285919b32be1.js",revision:"e02d285919b32be1"},{url:"/_next/static/chunks/886-5d9e7206134c3c78.js",revision:"5d9e7206134c3c78"},{url:"/_next/static/chunks/app/_global-error/page-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/_not-found/page-1eef885f48b5e32b.js",revision:"1eef885f48b5e32b"},{url:"/_next/static/chunks/app/admin/chat/%5Bid%5D/page-278e37f6da16a5a3.js",revision:"278e37f6da16a5a3"},{url:"/_next/static/chunks/app/admin/page-63fff7fd2a700dbe.js",revision:"63fff7fd2a700dbe"},{url:"/_next/static/chunks/app/admin/reporte/%5Bid%5D/page-6a15bb77745780d2.js",revision:"6a15bb77745780d2"},{url:"/_next/static/chunks/app/api/push/send-chat-notification/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/api/push/send/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/api/push/subscribe/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/api/push/vapid-public-key/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/api/reportes/%5Bid%5D/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/api/reportes/create/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/api/stores/validate/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/api/tickets/extract/route-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/app/comercial/chat/%5Bid%5D/page-0c6ac31985a49035.js",revision:"0c6ac31985a49035"},{url:"/_next/static/chunks/app/comercial/page-dd7aa82a11ae7423.js",revision:"dd7aa82a11ae7423"},{url:"/_next/static/chunks/app/comercial/reporte/%5Bid%5D/page-2317ad05f5b198df.js",revision:"2317ad05f5b198df"},{url:"/_next/static/chunks/app/conductor/chat/%5Bid%5D/page-b7a5451e98271729.js",revision:"b7a5451e98271729"},{url:"/_next/static/chunks/app/conductor/layout-3f3036612ce4acd1.js",revision:"3f3036612ce4acd1"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/flujo/page-5016a356913d324f.js",revision:"5016a356913d324f"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/page-9a596fd487d1c802.js",revision:"9a596fd487d1c802"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/ticket-merma-review/page-52e5d666c85ea315.js",revision:"52e5d666c85ea315"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/%5Bid%5D/ticket-review/page-95eb2ed3dd79a205.js",revision:"95eb2ed3dd79a205"},{url:"/_next/static/chunks/app/conductor/nuevo-reporte/page-6039f02fd2c5fccf.js",revision:"6039f02fd2c5fccf"},{url:"/_next/static/chunks/app/conductor/page-4ff088e202bfa345.js",revision:"4ff088e202bfa345"},{url:"/_next/static/chunks/app/layout-b9bce6fbe8ff8006.js",revision:"b9bce6fbe8ff8006"},{url:"/_next/static/chunks/app/login/page-069ca839299d4564.js",revision:"069ca839299d4564"},{url:"/_next/static/chunks/app/page-40826df79c82eb7c.js",revision:"40826df79c82eb7c"},{url:"/_next/static/chunks/app/test-env/page-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/framework-d7de93249215fb06.js",revision:"d7de93249215fb06"},{url:"/_next/static/chunks/main-app-a28a5bf4c58f6ba4.js",revision:"a28a5bf4c58f6ba4"},{url:"/_next/static/chunks/main-bafba84362a31b3b.js",revision:"bafba84362a31b3b"},{url:"/_next/static/chunks/next/dist/client/components/builtin/app-error-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/next/dist/client/components/builtin/forbidden-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/next/dist/client/components/builtin/global-error-13ceb6893f3cfaf5.js",revision:"13ceb6893f3cfaf5"},{url:"/_next/static/chunks/next/dist/client/components/builtin/not-found-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/next/dist/client/components/builtin/unauthorized-ffe82fa7714ab028.js",revision:"ffe82fa7714ab028"},{url:"/_next/static/chunks/polyfills-42372ed130431b0a.js",revision:"846118c33b2c0e922d7b3a7676f81f6f"},{url:"/_next/static/chunks/webpack-b6d996bb3db25032.js",revision:"b6d996bb3db25032"},{url:"/_next/static/css/e596c6ab324df8f4.css",revision:"e596c6ab324df8f4"},{url:"/_next/static/media/4cf2300e9c8272f7-s.p.woff2",revision:"18bae71b1e1b2bb25321090a3b563103"},{url:"/_next/static/media/747892c23ea88013-s.woff2",revision:"a0761690ccf4441ace5cec893b82d4ab"},{url:"/_next/static/media/8d697b304b401681-s.woff2",revision:"cc728f6c0adb04da0dfcb0fc436a8ae5"},{url:"/_next/static/media/93f479601ee12b01-s.p.woff2",revision:"da83d5f06d825c5ae65b7cca706cb312"},{url:"/_next/static/media/9610d9e46709d722-s.woff2",revision:"7b7c0ef93df188a852344fc272fc096b"},{url:"/_next/static/media/ba015fad6dcf6784-s.woff2",revision:"8ea4f719af3312a055caf09f34c89a77"},{url:"/file.svg",revision:"d09f95206c3fa0bb9bd9fefabfd0ea71"},{url:"/globe.svg",revision:"2aaafa6a49b6563925fe440891e32717"},{url:"/icon-192.png",revision:"a400df8a5e0be2a43d60d972258245ff"},{url:"/icon-192.svg",revision:"8f6b145567d23aebd85b65d47e2c725f"},{url:"/icon-512.png",revision:"f4cdeadb9b09cf4097c119c5f5f3ca7b"},{url:"/icon-512.svg",revision:"54a84fb32e094b03d145baed67d06fd8"},{url:"/manifest.json",revision:"d8912cff8329f5cbb6b2fe6a9c66de91"},{url:"/next.svg",revision:"8e061864f388b47f33a1c3780831193e"},{url:"/vercel.svg",revision:"c0af2f507b369b085b35ef4bbe3bcf1e"},{url:"/window.svg",revision:"a2760511c65806022ad20adf74370ff3"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:a,event:s,state:i})=>a&&"opaqueredirect"===a.type?new Response(a.body,{status:200,statusText:"OK",headers:a.headers}):a}]}),"GET"),e.registerRoute(/^https:\/\/.*\.supabase\.co\/.*/i,new e.NetworkFirst({cacheName:"supabase-cache",plugins:[new e.ExpirationPlugin({maxEntries:50,maxAgeSeconds:86400})]}),"GET")});


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
