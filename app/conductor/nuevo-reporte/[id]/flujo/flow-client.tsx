'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EvidenceUpload from '@/components/conductor/evidence-upload';
import ActionStep from '@/components/conductor/action-step';
import IncidentCart from '@/components/conductor/incident-cart';
import TicketConfirmation from '@/components/conductor/ticket-confirmation';
import { uploadEvidence } from '@/app/conductor/actions';
import { ExtractedTicketData } from '@/lib/ai/extract-ticket-data';
import { createClient } from '@/lib/supabase/client';

interface FlowClientProps {
    reportId: string;
    reportType: string;
    initialEvidence: Record<string, string>;
    ticketData?: ExtractedTicketData | null;
    returnTicketData?: ExtractedTicketData | null;
}

export default function FlowClient({
    reportId,
    reportType,
    initialEvidence,
    ticketData: initialTicketData,
    returnTicketData: initialReturnTicketData,
}: FlowClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Get step from URL, fallback to default for tipo
    const stepFromUrl = searchParams.get('step');
    let currentStep = stepFromUrl || getDefaultStep(reportType);
    
    // Validate that the step exists for this report type
    const validSteps = getValidStepsForType(reportType);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [ticketData, setTicketData] = useState<ExtractedTicketData | null>(initialTicketData);
    const [returnTicketData, setReturnTicketData] = useState<ExtractedTicketData | null>(initialReturnTicketData);
    
    useEffect(() => {
        // Validate step on mount and when step changes
        if (currentStep && !validSteps.includes(currentStep) && currentStep !== 'finish') {
            console.error(`Invalid step "${currentStep}" for report type "${reportType}". Valid steps: ${validSteps.join(', ')}`);
            // Fallback to first valid step
            const fallbackStep = validSteps[0] || getDefaultStep(reportType);
            setIsRedirecting(true);
            router.replace(`/conductor/nuevo-reporte/${reportId}/flujo?step=${fallbackStep}`);
        }
    }, [currentStep, reportType, validSteps.join(','), reportId, router]);
    
    // Show loading while redirecting or if step is invalid
    if (isRedirecting || (currentStep && !validSteps.includes(currentStep) && currentStep !== 'finish')) {
        return (
            <div className="p-4 text-center">
                <p>Redirigiendo al paso correcto...</p>
            </div>
        );
    }

    async function handleUpload(key: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadEvidence(reportId, key, formData);
        if (result.error) throw new Error(result.error);
        
        // If it's a ticket upload, extract data automatically
        if (key === 'ticket' || key === 'return_ticket') {
            const supabase = createClient();
            const { data: report } = await supabase
                .from('reportes')
                .select('evidence')
                .eq('id', reportId)
                .single();
            
            const evidence = (report?.evidence as Record<string, string>) || {};
            const imageUrl = evidence[key];
            
            if (imageUrl) {
                try {
                    const extractResponse = await fetch('/api/tickets/extract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            imageUrl,
                            reportId,
                            ticketType: key === 'return_ticket' ? 'return_ticket' : 'ticket',
                        }),
                    });
                    
                    if (extractResponse.ok) {
                        const { data } = await extractResponse.json();
                        // Data is saved to report automatically by the API
                        console.log('Ticket data extracted:', data);
                    }
                } catch (error) {
                    console.error('Error extracting ticket data:', error);
                }
            }
        }
    }
    
    async function handleConfirmTicket(data: ExtractedTicketData, ticketType: 'ticket' | 'return_ticket' = 'ticket') {
        const supabase = createClient();
        const updateField = ticketType === 'return_ticket' ? 'return_ticket_data' : 'ticket_data';
        const confirmField = ticketType === 'return_ticket' ? 'return_ticket_extraction_confirmed' : 'ticket_extraction_confirmed';
        
        await supabase
            .from('reportes')
            .update({
                [updateField]: data,
                [confirmField]: true,
            })
            .eq('id', reportId);
        
        // Navigate to next step
        if (ticketType === 'return_ticket') {
            await goTo('finish');
        } else {
            await goTo('return_check');
        }
    }

    async function goTo(step: string) {
        // Save current_step to database
        try {
            await fetch(`/api/reportes/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_step: step,
                }),
            });
        } catch (error) {
            console.error('Error saving current step:', error);
            // Continue even if save fails
        }
        
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
                    allowSecondImage={true}
                    onSecondImageSelected={(file) => handleUpload('arrival_exhibit_2', file)}
                    initialSecondImage={initialEvidence['arrival_exhibit_2']}
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
                    allowSecondImage={true}
                    onSecondImageSelected={(file) => handleUpload('product_arranged_2', file)}
                    initialSecondImage={initialEvidence['product_arranged_2']}
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
                    onImageSelected={async (file) => {
                        await handleUpload('ticket', file);
                        // Wait a bit for extraction, then go to confirmation
                        setTimeout(() => {
                            goTo('ticket_confirm');
                        }, 2000);
                    }}
                    onContinue={() => {
                        // If ticket data exists, go to confirmation, otherwise go to upload
                        if (initialTicketData) {
                            goTo('ticket_confirm');
                        } else {
                            // Try to extract first
                            goTo('ticket_confirm');
                        }
                    }}
                />
            );
        }

        if (currentStep === 'ticket_confirm' || currentStep === '9') {
            // Fetch latest ticket data if needed
            useEffect(() => {
                if (!ticketData) {
                    // Fetch from report
                    const fetchData = async () => {
                        const supabase = createClient();
                        const { data: report } = await supabase
                            .from('reportes')
                            .select('ticket_data, evidence')
                            .eq('id', reportId)
                            .single();
                        
                        if (report?.ticket_data) {
                            setTicketData(report.ticket_data as ExtractedTicketData);
                        }
                    };
                    fetchData();
                }
            }, [currentStep]);
            
            if (!ticketData) {
                return (
                    <div className="max-w-md mx-auto text-center py-8">
                        <p className="text-gray-800">Extrayendo datos del ticket...</p>
                    </div>
                );
            }
            
            return (
                <TicketConfirmation
                    reportId={reportId}
                    ticketData={ticketData}
                    ticketType="ticket"
                    ticketImageUrl={initialEvidence['ticket']}
                    onConfirm={(data) => handleConfirmTicket(data, 'ticket')}
                    onCancel={() => goTo('8')}
                />
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
                    onImageSelected={async (file) => {
                        await handleUpload('return_ticket', file);
                        // Wait a bit for extraction, then go to confirmation
                        setTimeout(() => {
                            goTo('return_ticket_confirm');
                        }, 2000);
                    }}
                    onContinue={() => {
                        if (initialReturnTicketData) {
                            goTo('return_ticket_confirm');
                        } else {
                            goTo('return_ticket_confirm');
                        }
                    }}
                />
            );
        }

        if (currentStep === 'return_ticket_confirm' || currentStep === '11') {
            // Fetch latest return ticket data if needed
            useEffect(() => {
                if (!returnTicketData) {
                    // Fetch from report
                    const fetchData = async () => {
                        const supabase = createClient();
                        const { data: report } = await supabase
                            .from('reportes')
                            .select('return_ticket_data, evidence')
                            .eq('id', reportId)
                            .single();
                        
                        if (report?.return_ticket_data) {
                            setReturnTicketData(report.return_ticket_data as ExtractedTicketData);
                        }
                    };
                    fetchData();
                }
            }, [currentStep]);
            
            if (!returnTicketData) {
                return (
                    <div className="max-w-md mx-auto text-center py-8">
                        <p className="text-gray-800">Extrayendo datos del ticket de devolución...</p>
                    </div>
                );
            }
            
            return (
                <TicketConfirmation
                    reportId={reportId}
                    ticketData={returnTicketData}
                    ticketType="return_ticket"
                    ticketImageUrl={initialEvidence['return_ticket']}
                    onConfirm={(data) => handleConfirmTicket(data, 'return_ticket')}
                    onCancel={() => goTo('10')}
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
                    onContinue={async () => {
                        // Save current_step as 'chat' and metadata before going to chat
                        const supabase = (await import('@/lib/supabase/client')).createClient();
                        const { data: report } = await supabase
                            .from('reportes')
                            .select('metadata')
                            .eq('id', reportId)
                            .single();
                        
                        const currentMetadata = (report?.metadata as Record<string, any>) || {};
                        await supabase
                            .from('reportes')
                            .update({
                                current_step: 'chat',
                                metadata: {
                                    ...currentMetadata,
                                    last_step_before_chat: '4b',
                                    should_return_to_step: 'finish', // For closed store, finish after chat
                                },
                            })
                            .eq('id', reportId);
                        
                        router.push(`/conductor/chat/${reportId}`);
                    }}
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
                <p className="text-gray-800 mb-8">Tu reporte ha sido registrado exitosamente.</p>
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

function getDefaultStep(type: string): string {
    if (type === 'entrega') return '4a';
    if (type === 'tienda_cerrada') return '4b';
    if (type === 'bascula') return '4c';
    // For unknown types, default to entrega flow
    return '4a';
}

function getValidStepsForType(type: string): string[] {
    if (type === 'entrega') {
        return ['4a', 'arrival_exhibit', 'incident_check', '5', '6', 'product_arranged', 'waste_check', '7a', '7b', '8', 'ticket', 'ticket_confirm', '9', 'return_check', '10', 'return_ticket_confirm', '11', 'finish'];
    }
    if (type === 'tienda_cerrada') {
        return ['4b', 'facade', 'chat', 'finish'];
    }
    if (type === 'bascula') {
        return ['4c', 'scale', 'finish'];
    }
    // Default: entrega steps
    return ['4a', 'arrival_exhibit', 'incident_check', '5', '6', 'product_arranged', 'waste_check', '7a', '7b', '8', 'ticket', 'ticket_confirm', '9', 'return_check', '10', 'return_ticket_confirm', '11', 'finish'];
}
