import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay sesión, redirigir a login
  if (!user) {
    redirect('/login');
  }

  // Obtener el perfil del usuario para determinar su rol
  let userRole: string | null = null;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  userRole = profile?.role || null;

  // Determinar qué tarjetas mostrar según el rol
  const showConductor = !userRole || userRole === 'conductor' || userRole === 'administrador';
  const showComercial = !userRole || userRole === 'comercial' || userRole === 'administrador';
  const showAdmin = !userRole || userRole === 'administrador';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            OXXO Logistics
          </h1>
          <p className="text-red-100 text-xl">
            Sistema de Gestión de Entregas e Incidencias
          </p>

          {/* User Info */}
          {user && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
                ✅ Sesión activa: {user.email}
              </div>
              <LogoutButton />
            </div>
          )}
        </div>

        {/* Role Cards */}
        <div className={`grid gap-6 ${showConductor && showComercial && showAdmin ? 'md:grid-cols-3' : (showConductor && showComercial) || (showComercial && showAdmin) || (showConductor && showAdmin) ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
          {/* Conductor Card */}
          {showConductor && (
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-red-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Conductor
              </h2>
              <p className="text-gray-600 mb-6">
                Crear reportes de entrega y gestionar incidencias
              </p>
              <Link
                href="/conductor"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Acceder
              </Link>
            </div>
          </div>
          )}

          {/* Comercial Card */}
          {showComercial && (
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Comercial
              </h2>
              <p className="text-gray-600 mb-6">
                Monitorear reportes por zona y dar soporte
              </p>
              <Link
                href="/comercial"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Acceder
              </Link>
            </div>
          </div>
          )}

          {/* Admin Card */}
          {showAdmin && (
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Administrador
              </h2>
              <p className="text-gray-600 mb-6">
                Gestión completa de usuarios, zonas y reportes
              </p>
              <Link
                href="/admin"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Acceder
              </Link>
            </div>
          </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="font-semibold mb-2">Estado del Sistema</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-sm">
                Autenticación activa - Login implementado ✅
              </p>
            </div>
            <p className="text-xs mt-2 text-red-100">
              Base de datos: 14 migraciones | Auth: Supabase
            </p>
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-6 text-center text-red-100 text-sm">
          <p>
            📋{" "}
            <Link href="/docs" className="underline hover:text-white">
              Documentación
            </Link>{" "}
            | 🔧{" "}
            <code className="bg-white/10 px-2 py-1 rounded">
              Next.js 15 + Supabase + OpenAI
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
