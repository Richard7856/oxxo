'use client';

import { login, signup } from './actions';
import { useState } from 'react';
import Link from 'next/link';

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
        <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">OXXO Logistics</h1>
                    <p className="text-red-100">
                        {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {/* Tabs */}
                    <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setError(null);
                                setSuccess(null);
                            }}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${mode === 'login'
                                ? 'bg-white text-red-600 shadow'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMode('signup');
                                setError(null);
                                setSuccess(null);
                            }}
                            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${mode === 'signup'
                                ? 'bg-white text-red-600 shadow'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Crear Cuenta
                        </button>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border-l-4 border-green-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-green-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg
                                            className="h-5 w-5 text-red-400"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-600"
                                placeholder="tu@email.com"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-600"
                                placeholder="••••••••"
                            />
                            {mode === 'signup' && (
                                <p className="mt-1 text-xs text-gray-700">
                                    Mínimo 6 caracteres
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? (mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...')
                                : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
                        </button>
                    </form>

                    {/* Info Text */}
                    {mode === 'signup' && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-800">
                                💡 Al crear una cuenta, podrás acceder al sistema inmediatamente.
                                Por defecto tendrás rol de <strong>conductor</strong>.
                                Un administrador puede cambiar tu rol después.
                            </p>
                        </div>
                    )}

                    {/* Divider */}
                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white text-sm">
                    <p className="text-center">
                        🔐 Autenticación segura con <strong>Supabase</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
