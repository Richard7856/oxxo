'use client';

import { useEffect, useState } from 'react';

export default function PWAInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
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
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            alert('La instalación no está disponible en este momento. Intenta desde el menú del navegador.');
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

    if (isInstalled) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-800 font-medium">Aplicación instalada</p>
                </div>
            </div>
        );
    }

    if (!isSupported || !deferredPrompt) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    Para instalar esta aplicación:
                </p>
                <ul className="text-xs text-blue-700 mt-2 list-disc list-inside space-y-1">
                    <li>En Chrome/Edge: Menú → "Instalar aplicación"</li>
                    <li>En Safari iOS: Compartir → "Añadir a pantalla de inicio"</li>
                    <li>En Firefox: Menú → "Instalar"</li>
                </ul>
            </div>
        );
    }

    return (
        <button
            onClick={handleInstallClick}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Instalar Aplicación
        </button>
    );
}

