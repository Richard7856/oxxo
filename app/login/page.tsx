'use client';

import { login, signup } from './actions';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [success, setSuccess] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const result = mode === 'login'
            ? await login(formData)
            : await signup(formData);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else if (mode === 'signup') {
            setSuccess('¡Cuenta creada exitosamente! Redirigiendo...');
        }
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel — brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1D6B2A] to-[#0f4019] flex-col items-center justify-center p-12">
                <Image
                    src="/logo-verdefrut.jpeg"
                    alt="Verdefrut"
                    width={320}
                    height={200}
                    className="object-contain mb-8"
                    priority
                />
                <p className="text-green-100 text-lg text-center max-w-sm">
                    Sistema de Gestión de Entregas e Incidencias
                </p>
            </div>

            {/* Right panel — form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
                <div className="max-w-md w-full">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Image
                            src="/logo-verdefrut.jpeg"
                            alt="Verdefrut"
                            width={200}
                            height={120}
                            className="object-contain mx-auto"
                            priority
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            {mode === 'login' ? 'Bienvenido' : 'Crear cuenta'}
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                            {mode === 'login'
                                ? 'Ingresa tus credenciales para continuar'
                                : 'Completa el formulario para registrarte'}
                        </p>

                        {/* Tabs */}
                        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                                className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                                    mode === 'login'
                                        ? 'bg-white text-[#1D6B2A] shadow font-semibold'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Iniciar Sesión
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                                className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                                    mode === 'signup'
                                        ? 'bg-white text-[#1D6B2A] shadow font-semibold'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Crear Cuenta
                            </button>
                        </div>

                        <form action={handleSubmit} className="space-y-5">
                            {/* Success */}
                            {success && (
                                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                                    <p className="text-sm text-green-700">{success}</p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D6B2A] focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
                                    placeholder="tu@email.com"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D6B2A] focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
                                    placeholder="••••••••"
                                />
                                {mode === 'signup' && (
                                    <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1D6B2A] hover:bg-[#155120] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                            >
                                {loading
                                    ? (mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...')
                                    : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                            </button>
                        </form>

                        {mode === 'signup' && (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-xs text-orange-800">
                                    💡 Al crear una cuenta tendrás rol de <strong>conductor</strong> por defecto. Un administrador puede cambiar tu rol después.
                                </p>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                                ← Volver al inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
