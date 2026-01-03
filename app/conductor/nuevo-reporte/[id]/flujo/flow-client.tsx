'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EvidenceUpload from '@/components/conductor/evidence-upload';
import DoubleEvidenceUpload from '@/components/conductor/double-evidence-upload';
import ActionStep from '@/components/conductor/action-step';
import IncidentCart from '@/components/conductor/incident-cart';
import FinishStep from '@/components/conductor/finish-step';
import ReasonUpload from '@/components/conductor/reason-upload';
import { uploadEvidence, updateCurrentStep, submitReport } from '@/app/conductor/actions';

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
                <DoubleEvidenceUpload
                    title="1. Foto del Exhibidor"
                    description="Toma fotos del exhibidor a tu llegada"
                    stepIndicator="Paso 1 de 8"
                    firstLabel="Primera foto"
                    secondLabel="Segunda foto"
                    secondOptional={true}
                    initialImages={{
                        first: initialEvidence['arrival_exhibit'] || null,
                        second: initialEvidence['arrival_exhibit_2'] || null,
                    }}
                    onImageSelected={async (key, file) => {
                        const evidenceKey = key === 'first' ? 'arrival_exhibit' : 'arrival_exhibit_2';
                        await handleUpload(evidenceKey, file);
                    }}
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
                <DoubleEvidenceUpload
                    title="2. Producto Acomodado"
                    description="Fotos del producto ya acomodado en el exhibidor"
                    stepIndicator="Paso 2 de 8"
                    firstLabel="Primera foto"
                    secondLabel="Segunda foto"
                    secondOptional={true}
                    initialImages={{
                        first: initialEvidence['product_arranged'] || null,
                        second: initialEvidence['product_arranged_2'] || null,
                    }}
                    onImageSelected={async (key, file) => {
                        const evidenceKey = key === 'first' ? 'product_arranged' : 'product_arranged_2';
                        await handleUpload(evidenceKey, file);
                    }}
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
                    title="3. Evidencia de Merma"
                    description="Foto del producto retirado (merma)"
                    stepIndicator="Paso 3 de 8"
                    initialImage={initialEvidence['waste_evidence']}
                    onImageSelected={(file) => handleUpload('waste_evidence', file)}
                    onContinue={() => goTo('8')}
                />
            );
        }

        if (currentStep === '7b') { // Remission (No Waste)
            return (
                <EvidenceUpload
                    title="3. Remisión"
                    description="Foto de la remisión firmada"
                    stepIndicator="Paso 3 de 8"
                    initialImage={initialEvidence['remission']}
                    onImageSelected={(file) => handleUpload('remission', file)}
                    onContinue={() => goTo('8')}
                />
            );
        }

        // Paso 4: Preguntar si hay ticket de recibido
        if (currentStep === '8' || currentStep === 'ticket_check') {
            return (
                <ActionStep
                    title="¿Hay Ticket de Recibido?"
                    description="¿Tienes un ticket de recibido de la tienda?"
                    onYes={() => goTo('8a')}
                    onNo={() => goTo('8b')}
                />
            );
        }

        // Paso 4a: Si hay ticket, pedir foto del ticket
        if (currentStep === '8a' || currentStep === 'ticket_recibido') {
            return (
                <EvidenceUpload
                    title="4. Ticket de Recibido"
                    description="Foto del ticket de recibido"
                    stepIndicator="Paso 4 de 8"
                    initialImage={initialEvidence['ticket_recibido']}
                    onImageSelected={async (file) => {
                        await handleUpload('ticket_recibido', file);
                    }}
                    onContinue={() => {
                        // Redirigir a la página de revisión del ticket de recibido
                        router.push(`/conductor/nuevo-reporte/${reportId}/ticket-review`);
                    }}
                />
            );
        }

        // Paso 4b: Si no hay ticket, pedir razón y foto opcional
        if (currentStep === '8b' || currentStep === 'ticket_no_reason') {
            return (
                <ReasonUpload
                    title="4. Razón de No Ticket"
                    description="Indica la razón por la que no hay ticket de recibido"
                    stepIndicator="Paso 4 de 8"
                    reportId={reportId}
                    initialReason={null}
                    initialImage={initialEvidence['no_ticket_reason_photo']}
                    onContinue={() => goTo('8c')}
                />
            );
        }

        // Paso 5: Preguntar si hay ticket de merma
        if (currentStep === '8c' || currentStep === 'ticket_merma_check') {
            return (
                <ActionStep
                    title="¿Hay Ticket de Merma?"
                    description="¿Tienes un ticket de merma que necesitas subir?"
                    onYes={() => goTo('8d')}
                    onNo={() => goTo('finish')}
                />
            );
        }

        // Paso 5a: Si hay ticket de merma, pedir foto
        if (currentStep === '8d' || currentStep === 'ticket_merma') {
            return (
                <EvidenceUpload
                    title="5. Ticket de Merma"
                    description="Foto del ticket de merma"
                    stepIndicator="Paso 5 de 8"
                    initialImage={initialEvidence['ticket_merma']}
                    onImageSelected={(file) => handleUpload('ticket_merma', file)}
                    onContinue={() => {
                        // Redirigir a la página de revisión del ticket de merma
                        router.push(`/conductor/nuevo-reporte/${reportId}/ticket-merma-review`);
                    }}
                />
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
            <FinishStep 
                reportId={reportId}
                onComplete={() => router.push('/conductor')}
            />
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
