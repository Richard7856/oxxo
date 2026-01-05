'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Verificar si el usuario ya cerró el botón
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }

        // Verificar si ya está instalado
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Verificar si el navegador soporta instalación PWA
        if ('serviceWorker' in navigator) {
            setIsSupported(true);
        }

        // Escuchar el evento beforeinstallprompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Escuchar cuando se instala
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            localStorage.setItem('pwa-install-dismissed', 'true');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // Si no hay prompt, mostrar instrucciones
            alert('Para instalar:\n\nChrome/Edge: Menú → "Instalar aplicación"\nSafari iOS: Compartir → "Añadir a pantalla de inicio"\nFirefox: Menú → "Instalar"');
            return;
        }

        // Mostrar el prompt de instalación
        deferredPrompt.prompt();

        // Esperar a que el usuario responda
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('Usuario aceptó la instalación');
        } else {
            console.log('Usuario rechazó la instalación');
        }

        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    // No mostrar si está instalado, no soportado, o fue cerrado
    if (isInstalled || isDismissed || (!isSupported && !deferredPrompt)) {
        return null;
    }

    // Botón pequeño y discreto flotante
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
                <div className="flex items-start gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="flex-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Instalar App</span>
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label="Cerrar"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Descarga la app para mejor experiencia
                </p>
            </div>
        </div>
    );
}




