'use client';

interface ActionStepProps {
    title: string;
    description?: string;
    onYes: () => void;
    onNo: () => void;
    yesLabel?: string;
    noLabel?: string;
}

export default function ActionStep({
    title,
    description,
    onYes,
    onNo,
    yesLabel = 'Sí',
    noLabel = 'No',
}: ActionStepProps) {
    return (
        <div className="max-w-md mx-auto py-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            {description && <p className="text-gray-800 mb-8">{description}</p>}

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={onNo}
                    className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <span className="text-3xl mb-2">✕</span>
                    <span className="font-semibold text-gray-700">{noLabel}</span>
                </button>

                <button
                    onClick={onYes}
                    className="flex flex-col items-center justify-center p-6 border-2 border-red-100 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                    <span className="text-3xl mb-2 text-red-600">✓</span>
                    <span className="font-semibold text-red-700">{yesLabel}</span>
                </button>
            </div>
        </div>
    );
}
