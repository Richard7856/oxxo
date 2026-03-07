'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type ListType = 'active' | 'completed';

const LIMITS = [10, 20, 30, 50] as const;

interface ReportsLimitSelectProps {
    listType: ListType;
    currentLimit: number;
}

export default function ReportsLimitSelect({ listType, currentLimit }: ReportsLimitSelectProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const paramKey = listType === 'active' ? 'limitActive' : 'limitCompleted';
    const otherKey = listType === 'active' ? 'limitCompleted' : 'limitActive';
    const otherValue = searchParams.get(otherKey) || '10';

    const handleChange = (value: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(paramKey, String(value));
        params.set(otherKey, otherValue);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Mostrar:</span>
            <select
                value={currentLimit}
                onChange={(e) => handleChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                {LIMITS.map((n) => (
                    <option key={n} value={n}>
                        {n}
                    </option>
                ))}
            </select>
            <span className="text-sm text-gray-600">reportes por página</span>
        </div>
    );
}
