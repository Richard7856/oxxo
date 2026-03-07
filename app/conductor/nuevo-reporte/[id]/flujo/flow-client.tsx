'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EvidenceUpload from '@/components/conductor/evidence-upload';
import DoubleEvidenceUpload from '@/components/conductor/double-evidence-upload';
import ActionStep from '@/components/conductor/action-step';
import IncidentCart from '@/components/conductor/incident-cart';
import FinishStep from '@/components/conductor/finish-step';
import ReasonUpload from '@/components/conductor/reason-upload';
import OtherIncidentStep from '@/components/conductor/other-incident-step';
import {
    uploadEvidence,
    updateCurrentStep,
    saveMermaStatus,
    saveTiendaAbiertaStatus,
} from '@/app/conductor/actions';

interface FlowClientProps {
    reportId: string;
    reportType: string;
    initialEvidence: Record<string, string>;
    initialStep: string;
    metadata?: Record<string, any>;
}

export default function FlowClient({
    reportId,
    reportType,
    initialEvidence,
    initialStep,
    metadata = {},
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
        if (step === 'chat_redirect' || step === 'chat') {
            router.push(`/conductor/chat/${reportId}`);
            return;
        }
        await updateCurrentStep(reportId, step);
        router.push(`/conductor/nuevo-reporte/${reportId}/flujo?step=${step}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // FLUJO ENTREGA
    // ─────────────────────────────────────────────────────────────────────
    if (reportType === 'entrega') {

        // PASO 1: Fotos del mueble a la llegada (1 obligatoria + 1 opcional)
        if (currentStep === '4a' || currentStep === 'arrival_exhibit') {
            return (
                <DoubleEvidenceUpload
                    title="1. Foto del Mueble a tu Llegada"
                    description="Toma fotos del mueble al llegar a la tienda"
                    stepIndicator="Paso 1"
                    firstLabel="Foto obligatoria"
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

        // PASO 2: ¿Hubo incidencias?
        if (currentStep === 'incident_check') {
            return (
                <ActionStep
                    title="¿Hubo Incidencias?"
                    description="¿Encontraste algún problema con la entrega?"
                    onYes={() => goTo('5')}
                    onNo={() => goTo('6')}
                />
            );
        }

        // PASO 3 (si hay incidencias): Carrito de incidencias → submitIncidentReport → chat
        if (currentStep === '5') {
            return <IncidentCart reportId={reportId} />;
        }

        // PASO 4: Foto del mueble después de acomodar el producto
        // Se llega aquí tanto si no hubo incidencias como después del chat
        if (currentStep === '6' || currentStep === 'product_arranged') {
            return (
                <DoubleEvidenceUpload
                    title="2. Mueble Acomodado"
                    description="Foto del mueble con el producto ya acomodado"
                    stepIndicator="Paso 2"
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

        // PASO 5: ¿Hubo merma?
        if (currentStep === 'waste_check') {
            return (
                <ActionStep
                    title="¿Hubo Merma?"
                    description="¿Retiraste producto caducado o dañado del mueble?"
                    onYes={async () => {
                        await saveMermaStatus(reportId, true);
                        goTo('7_waste_ticket');
                    }}
                    onNo={async () => {
                        await saveMermaStatus(reportId, false);
                        goTo('receipt_check');
                    }}
                />
            );
        }

        // PASO 5a: Foto del ticket de merma → extracción IA
        if (currentStep === '7_waste_ticket' || currentStep === '7a') {
            return (
                <EvidenceUpload
                    title="3. Ticket de Merma"
                    description="Foto del ticket de merma para registrar el retiro de producto"
                    stepIndicator="Paso 3"
                    initialImage={initialEvidence['ticket_merma']}
                    onImageSelected={(file) => handleUpload('ticket_merma', file)}
                    onContinue={() => {
                        router.push(`/conductor/nuevo-reporte/${reportId}/ticket-merma-review`);
                    }}
                />
            );
        }

        // PASO 6: ¿Hay foto del recibo de mercancía?
        if (
            currentStep === 'receipt_check' ||
            currentStep === '8' ||
            currentStep === 'ticket_check'
        ) {
            return (
                <ActionStep
                    title="¿Hay Foto del Recibo de Mercancía?"
                    description="¿Tienes un recibo de mercancía que subir?"
                    onYes={() => goTo('8a_receipt')}
                    onNo={() => goTo('8b_no_reason')}
                />
            );
        }

        // PASO 6a: Foto del recibo → extracción IA
        if (
            currentStep === '8a_receipt' ||
            currentStep === '8a' ||
            currentStep === 'ticket_recibido'
        ) {
            return (
                <EvidenceUpload
                    title="4. Recibo de Mercancía"
                    description="Foto del recibo de mercancía para verificar la entrega"
                    stepIndicator="Paso 4"
                    initialImage={initialEvidence['ticket_recibido']}
                    onImageSelected={async (file) => {
                        await handleUpload('ticket_recibido', file);
                    }}
                    onContinue={() => {
                        router.push(`/conductor/nuevo-reporte/${reportId}/ticket-review`);
                    }}
                />
            );
        }

        // PASO 6b: Sin recibo → motivo (texto requerido + foto opcional)
        if (
            currentStep === '8b_no_reason' ||
            currentStep === '8b' ||
            currentStep === 'ticket_no_reason'
        ) {
            return (
                <ReasonUpload
                    title="4. Sin Recibo de Mercancía"
                    description="Indica el motivo por el que no hay recibo de mercancía"
                    stepIndicator="Paso 4"
                    reportId={reportId}
                    initialReason={null}
                    initialImage={initialEvidence['no_ticket_reason_photo']}
                    onContinue={() => goTo('other_incident_check')}
                />
            );
        }

        // Compatibilidad con el step antiguo 8c (ahora reemplazado por receipt_check y otros pasos)
        // Si llegamos aquí desde un flujo antiguo, redirigir a other_incident_check
        if (currentStep === '8c' || currentStep === 'ticket_merma_check') {
            goTo('other_incident_check');
            return null;
        }

        // PASO 7: ¿Hubo otra incidencia?
        if (currentStep === 'other_incident_check') {
            return (
                <ActionStep
                    title="¿Hubo Otra Incidencia?"
                    description="¿Ocurrió alguna otra incidencia que debas reportar?"
                    onYes={() => goTo('9_other_incident')}
                    onNo={() => goTo('finish')}
                />
            );
        }

        // PASO 7a: Registrar la otra incidencia
        if (currentStep === '9_other_incident') {
            return (
                <OtherIncidentStep
                    reportId={reportId}
                    stepIndicator="Paso 5"
                    onContinue={() => goTo('finish')}
                />
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FLUJO TIENDA CERRADA
    // ─────────────────────────────────────────────────────────────────────
    if (reportType === 'tienda_cerrada') {

        // Foto de fachada → chat
        if (currentStep === '4b' || currentStep === 'facade') {
            return (
                <EvidenceUpload
                    title="4b. Foto de Fachada"
                    description="Foto de la tienda cerrada (fachada)"
                    stepIndicator="Paso único"
                    initialImage={initialEvidence['facade']}
                    onImageSelected={(file) => handleUpload('facade', file)}
                    onContinue={() => goTo('chat_redirect')}
                />
            );
        }

        // Después del chat: ¿Se abrió la tienda?
        // Si sí → convierte a entrega → step 4a
        // Si no → finish
        if (currentStep === 'tienda_abierta_check') {
            return (
                <ActionStep
                    title="¿Se Abrió la Tienda?"
                    description="Después del chat con el agente, ¿se abrió la tienda?"
                    onYes={async () => {
                        const result = await saveTiendaAbiertaStatus(reportId, true);
                        if (result.error) {
                            alert(result.error);
                        } else if (result.flowUrl) {
                            router.push(result.flowUrl);
                        }
                    }}
                    onNo={async () => {
                        const result = await saveTiendaAbiertaStatus(reportId, false);
                        if (result.error) {
                            alert(result.error);
                        } else if (result.flowUrl) {
                            router.push(result.flowUrl);
                        }
                    }}
                    yesLabel="Sí, se abrió"
                    noLabel="No, sigue cerrada"
                />
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FLUJO BÁSCULA
    // ─────────────────────────────────────────────────────────────────────
    if (reportType === 'bascula') {

        // Foto del problema → chat (igual que tienda_cerrada)
        if (currentStep === '4c' || currentStep === 'scale') {
            return (
                <EvidenceUpload
                    title="4c. Evidencia del Problema con Báscula"
                    description="Foto del problema encontrado con la báscula"
                    stepIndicator="Paso único"
                    initialImage={initialEvidence['scale']}
                    onImageSelected={(file) => handleUpload('scale', file)}
                    onContinue={() => goTo('chat_redirect')}
                />
            );
        }

        // Después del chat: ¿Se resolvió el problema?
        // Si sí → convierte a entrega → step 4a
        // Si no → finish
        if (currentStep === 'tienda_abierta_check') {
            return (
                <ActionStep
                    title="¿Se Resolvió el Problema?"
                    description="Después del chat con el agente, ¿se resolvió el problema con la báscula?"
                    onYes={async () => {
                        const result = await saveTiendaAbiertaStatus(reportId, true);
                        if (result.error) {
                            alert(result.error);
                        } else if (result.flowUrl) {
                            router.push(result.flowUrl);
                        }
                    }}
                    onNo={async () => {
                        const result = await saveTiendaAbiertaStatus(reportId, false);
                        if (result.error) {
                            alert(result.error);
                        } else if (result.flowUrl) {
                            router.push(result.flowUrl);
                        }
                    }}
                    yesLabel="Sí, se resolvió"
                    noLabel="No, sigue sin resolver"
                />
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // PASO FINAL: cerrar ticket (compartido por todos los tipos)
    // ─────────────────────────────────────────────────────────────────────
    if (currentStep === 'finish') {
        return (
            <FinishStep
                reportId={reportId}
                onComplete={() => router.push('/conductor')}
            />
        );
    }

    // Fallback
    return (
        <div className="p-4 text-center">
            <h2 className="text-xl text-gray-700">Paso no encontrado: {currentStep}</h2>
            <button
                onClick={() => router.push('/conductor')}
                className="mt-4 text-blue-600 underline"
            >
                Salir
            </button>
        </div>
    );
}
