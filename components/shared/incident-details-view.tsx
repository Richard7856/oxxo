'use client';

import Image from 'next/image';

interface IncidentDetailsViewProps {
    incidentDetails: any;
}

export default function IncidentDetailsView({ incidentDetails }: IncidentDetailsViewProps) {
    if (!incidentDetails) {
        return null;
    }

    // Si es un array de incidencias
    if (Array.isArray(incidentDetails)) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de Incidencias</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Productos que tuvieron problemas durante la entrega (mal estado, caducados, dañados, etc.)
                </p>
                <div className="space-y-4">
                    {incidentDetails.map((incident: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">
                                        Incidencia #{index + 1}
                                    </h3>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                        incident.reason === 'Mal estado' ? 'bg-red-100 text-red-800' :
                                        incident.reason === 'Caducado' ? 'bg-orange-100 text-orange-800' :
                                        incident.reason === 'Dañado' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {incident.reason || 'Sin razón especificada'}
                                    </span>
                                </div>
                            </div>
                            
                            {incident.products && Array.isArray(incident.products) && incident.products.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Productos afectados:</p>
                                    {incident.products.map((product: any, pIndex: number) => (
                                        <div key={pIndex} className="bg-white rounded p-3 border border-gray-200">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {product.nombre || product.productName || 'Producto sin nombre'}
                                                    </p>
                                                    {product.clave && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            Clave: {product.clave}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    {product.cantidad && (
                                                        <p className="text-sm font-semibold text-red-600">
                                                            Cantidad: {product.cantidad}
                                                        </p>
                                                    )}
                                                    {product.quantity && (
                                                        <p className="text-sm font-semibold text-red-600">
                                                            Cantidad: {product.quantity}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {incident.photoUrl && (
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Foto de evidencia:</p>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden max-w-xs">
                                        <div className="relative aspect-video w-full bg-gray-100">
                                            <Image
                                                src={incident.photoUrl}
                                                alt={`Evidencia incidencia ${index + 1}`}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {incident.note && (
                                <div className="mt-3">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Nota:</p>
                                    <p className="text-sm text-gray-600 bg-white rounded p-2 border border-gray-200">
                                        {incident.note}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Si es un objeto simple, mostrar como JSON formateado pero más legible
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de Incidencias</h2>
            <p className="text-sm text-gray-600 mb-4">
                Información adicional sobre las incidencias reportadas durante la entrega.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                    {JSON.stringify(incidentDetails, null, 2)}
                </pre>
            </div>
        </div>
    );
}
