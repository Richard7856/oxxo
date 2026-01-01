'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EvidenceUpload from '@/components/conductor/evidence-upload';
import ActionStep from '@/components/conductor/action-step';
import IncidentCart from '@/components/conductor/incident-cart';
import { uploadEvidence, updateCurrentStep } from '@/app/conductor/actions';

interface FlowClientProps {
    reportId: string;
    reportType: string;
    initialEvidence: Record<string, string>;
    initialStep: string;
}

export default function FlowClient({
    reportId,
    reportType,
    initialEvidence,
    initialStep,
}: FlowClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentStep = searchParams.get('step') || initialStep;

    async function handleUpload(key: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadEvidence(reportId, key, formData);
        if (result.error) throw new Error(result.error);
    }

    async function goTo(step: string) {
        // No guardar pasos de redirección como paso válido
        if (step === 'chat_redirect' || step === 'chat') {
            // Redirigir directamente sin guardar el paso
            router.push(`/conductor/chat/${reportId}`);
            return;
        }
        
        // Guardar el paso actual antes de navegar
        await updateCurrentStep(reportId, step);
        router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=${step}`);
    }

    // --- Steps Logic ---

    if (reportType === 'entrega') {
        // Flow: Arrival -> Incident? -> (Form) -> Product -> Waste? -> (Waste/Remission) -> Ticket -> TicketConfirm -> Return? -> ReturnTicket -> ReturnConfirm -> Finish

        if (currentStep === '4a' || currentStep === 'arrival_exhibit') {
            return (
                <EvidenceUpload
                    title="4. Foto del Exhibidor"
                    description="Toma una foto del exhibidor a tu llegada"
                    stepIndicator="Paso 1 de 8"
                    initialImage={initialEvidence['arrival_exhibit']}
                    onImageSelected={(file) => handleUpload('arrival_exhibit', file)}
                    onContinue={() => goTo('incident_check')}
                />
            );
        }

        if (currentStep === 'incident_check') {
            return (
                <ActionStep
                    title="¿Hubo Incidencias?"
                    description="¿Encontraste algún problema al llegar o durante la entrega?"
                    onYes={() => goTo('5')} // Incident Form
                    onNo={() => goTo('6')} // Product Arranged
                />
            );
        }

        if (currentStep === '5') {
            return (
                <IncidentCart reportId={reportId} />
            );
        }

        if (currentStep === '6' || currentStep === 'product_arranged') {
            return (
                <EvidenceUpload
                    title="6. Producto Acomodado"
                    description="Foto del producto ya acomodado en el exhibidor"
                    stepIndicator="Paso 3 de 8"
                    initialImage={initialEvidence['product_arranged']}
                    onImageSelected={(file) => handleUpload('product_arranged', file)}
                    onContinue={() => goTo('waste_check')}
                />
            );
        }

        if (currentStep === 'waste_check') {
            return (
                <ActionStep
                    title="¿Hay Merma?"
                    description="¿Retiraste producto caducado o dañado?" // "Merma" means waste/spoilage
                    onYes={() => goTo('7a')}
                    onNo={() => goTo('7b')}
                />
            );
        }

        if (currentStep === '7a') { // Waste Evidence
            return (
                <EvidenceUpload
                    title="7. Evidencia de Merma"
                    description="Foto del producto retirado (merma)"
                    stepIndicator="Paso 5 de 8"
                    initialImage={initialEvidence['waste_evidence']}
                    onImageSelected={(file) => handleUpload('waste_evidence', file)}
                    onContinue={() => goTo('8')}
                />
            );
        }

        if (currentStep === '7b') { // Remission (No Waste)
            return (
                <EvidenceUpload
                    title="7. Remisión"
                    description="Foto de la remisión firmada"
                    stepIndicator="Paso 5 de 8"
                    initialImage={initialEvidence['remission']}
                    onImageSelected={(file) => handleUpload('remission', file)}
                    onContinue={() => goTo('8')}
                />
            );
        }

        if (currentStep === '8' || currentStep === 'ticket') {
            return (
                <EvidenceUpload
                    title="8. Ticket de Entrega"
                    description="Foto del ticket de entrega impreso"
                    stepIndicator="Paso 6 de 8"
                    initialImage={initialEvidence['ticket']}
                    onImageSelected={(file) => handleUpload('ticket', file)}
                    onContinue={() => goTo('9')}
                />
            );
        }

        if (currentStep === '9') { // Ticket Confirm
            return (
                <div className="max-w-md mx-auto text-center py-8">
                    <h2 className="text-2xl font-bold mb-4">9. Confirmar Ticket</h2>
                    <p className="text-gray-600 mb-8">Datos extraídos del ticket...</p>
                    <button onClick={() => goTo('return_check')} className="bg-red-600 text-white px-8 py-3 rounded-lg w-full">
                        Confirmar y Continuar
                    </button>
                </div>
            );
        }

        if (currentStep === 'return_check') {
            return (
                <ActionStep
                    title="¿Hay Ticket de Devolución?"
                    description="¿La tienda generó un ticket de devolución?"
                    onYes={() => goTo('10')}
                    onNo={() => goTo('finish')}
                />
            );
        }

        if (currentStep === '10') { // Return Ticket
            return (
                <EvidenceUpload
                    title="10. Ticket de Devolución"
                    description="Foto del ticket de devolución"
                    stepIndicator="Paso 8 de 8"
                    initialImage={initialEvidence['return_ticket']}
                    onImageSelected={(file) => handleUpload('return_ticket', file)}
                    onContinue={() => goTo('11')}
                />
            );
        }

        if (currentStep === '11') { // Return Confirm
            return (
                <div className="max-w-md mx-auto text-center py-8">
                    <h2 className="text-2xl font-bold mb-4">11. Confirmar Devolución</h2>
                    <p className="text-gray-600 mb-8">Datos extraídos de la devolución...</p>
                    <button onClick={() => goTo('finish')} className="bg-red-600 text-white px-8 py-3 rounded-lg w-full">
                        Confirmar y Finalizar
                    </button>
                </div>
            );
        }
    }

    if (reportType === 'tienda_cerrada') {
        if (currentStep === '4b' || currentStep === 'facade') {
            return (
                <EvidenceUpload
                    title="4b. Evidencia Fachada"
                    description="Foto de la tienda cerrada (fachada)"
                    stepIndicator="Paso único"
                    initialImage={initialEvidence['facade']}
                    onImageSelected={(file) => handleUpload('facade', file)}
                    onContinue={() => goTo('chat_redirect')}
                />
            );
        }

    }

    if (reportType === 'bascula') {
        if (currentStep === '4c' || currentStep === 'scale') {
            return (
                <EvidenceUpload
                    title="4c. Evidencia Báscula"
                    description="Foto del problema con la báscula"
                    stepIndicator="Paso único"
                    initialImage={initialEvidence['scale']}
                    onImageSelected={(file) => handleUpload('scale', file)}
                    onContinue={() => goTo('finish')}
                />
            );
        }
    }

    if (currentStep === 'finish') {
        return (
            <div className="max-w-md mx-auto text-center py-12">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Reporte Enviado!</h2>
                <p className="text-gray-600 mb-8">Tu reporte ha sido registrado exitosamente.</p>
                <button
                    onClick={() => router.push('/conductor')}
                    className="bg-gray-900 text-white px-8 py-3 rounded-lg w-full hover:bg-gray-800 transition-colors"
                >
                    Volver al Inicio
                </button>
            </div>
        );
    }

    // Default Fallback
    return (
        <div className="p-4 text-center">
            <h2 className="text-xl">Paso no encontrado: {currentStep}</h2>
            <button onClick={() => router.push('/conductor')} className="mt-4 text-blue-600 underline">
                Salir
            </button>
        </div>
    );
}

function getDefaultStep(type: string) {
    if (type === 'entrega') return '4a';
    if (type === 'tienda_cerrada') return '4b';
    if (type === 'bascula') return '4c';
    return 'unknown';
}
