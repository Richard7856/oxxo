import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ActiveReportBanner from '@/components/conductor/active-report-banner';

export default async function ConductorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Check for active reporte
    const { data: activeReporte } = await supabase
        .from('reportes')
        .select('id, status, created_at')
        .eq('user_id', user.id)
        .in('status', ['draft', 'submitted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Panel de Conductor</h1>
                            <p className="text-sm text-gray-800">
                                {profile?.display_name || user.email}
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            ← Volver al inicio
                        </Link>
                    </div>

                    {/* Active Reporte Alert */}
                    {/* Active Reporte Alert - Client Component for conditional visibility */}
                    {activeReporte && (
                        <ActiveReportBanner activeReporte={activeReporte} />
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
