'use client';

import { cancelReport } from '@/app/conductor/actions';
import { useTransition } from 'react';

export default function CancelReportButton({ reportId }: { reportId: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            onClick={() => {
                if (confirm('¿Estás seguro de cancelar este reporte? Se perderá el progreso.')) {
                    startTransition(async () => {
                        await cancelReport(reportId);
                    });
                }
            }}
            disabled={isPending}
            className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 rounded transition-colors"
        >
            {isPending ? 'Cancelando...' : 'Cancelar Reporte'}
        </button>
    );
}
