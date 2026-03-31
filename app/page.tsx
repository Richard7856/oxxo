import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let userRole: string | null = null;
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  userRole = profile?.role || null;

  const showConductor = !userRole || userRole === 'conductor' || userRole === 'administrador';
  const showComercial = !userRole || userRole === 'comercial' || userRole === 'administrador';
  const showAdmin = !userRole || userRole === 'administrador';

  const cardCount = [showConductor, showComercial, showAdmin].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1D6B2A] via-[#155120] to-[#0f3a17]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 max-w-5xl mx-auto">
        <Image
          src="/logo-verdefrut.png"
          alt="Verdefrut"
          width={100}
          height={40}
          className="object-contain"
          priority
        />
        {user && <LogoutButton />}
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Sistema de Gestión
          </h1>
          <p className="text-green-200 text-base">
            Entregas e Incidencias — selecciona tu área
          </p>
        </div>

        {/* Role Cards */}
        <div className={`grid gap-6 ${cardCount === 3 ? 'md:grid-cols-3' : cardCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'} max-w-3xl mx-auto`}>

          {/* Conductor */}
          {showConductor && (
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#1D6B2A]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Conductor</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Crear reportes de entrega y gestionar incidencias
                </p>
                <Link
                  href="/conductor"
                  className="w-full bg-[#1D6B2A] hover:bg-[#155120] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
                >
                  Acceder
                </Link>
              </div>
            </div>
          )}

          {/* Comercial */}
          {showComercial && (
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#E85D04]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Comercial</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Monitorear reportes por zona y dar soporte
                </p>
                <Link
                  href="/comercial"
                  className="w-full bg-[#E85D04] hover:bg-[#c94e03] text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
                >
                  Acceder
                </Link>
              </div>
            </div>
          )}

          {/* Admin */}
          {showAdmin && (
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Administrador</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Gestión completa de usuarios, zonas y reportes
                </p>
                <Link
                  href="/admin"
                  className="w-full bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
                >
                  Acceder
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
