/**
 * Helper functions to determine the current step in the report flow
 * based on evidence and report metadata
 */

export function getNextStepForReport(
    tipoReporte: string,
    evidence: Record<string, string> = {},
    metadata: Record<string, any> = {},
    incidentDetails: any[] | null = null,
    status?: string
): string {
    // Si hay metadata que indica un paso específico después de resolver el chat
    if (metadata.should_return_to_step) {
        return metadata.should_return_to_step;
    }

    // Si hay last_step_before_chat pero el status sigue siendo 'submitted',
    // significa que el usuario todavía está en el chat, redirigir al chat
    if (metadata.last_step_before_chat && status === 'submitted') {
        // El usuario debería estar en el chat, pero como estamos en el flujo,
        // verificamos si realmente necesita volver al chat o continuar
        // En este caso, redirigimos al flujo con un paso especial que luego
        // puede redirigir al chat si es necesario
        return metadata.last_step_before_chat;
    }

    if (tipoReporte === 'tienda_cerrada') {
        // Si ya tiene foto de fachada, verificar si fue al chat
        // El flujo es: foto fachada -> chat -> finish
        if (evidence['facade'] && metadata.last_step_before_chat) {
            // Ya pasó por chat, debería ir a finish
            return 'finish';
        }
        if (evidence['facade']) {
            // Tiene foto pero no ha ido al chat, podría ir al chat o finish
            // Si el status es submitted, probablemente ya pasó por chat
            return 'finish'; // Por defecto finish si ya tiene foto
        }
        return '4b'; // Primer paso: foto de fachada
    }

    if (tipoReporte === 'bascula') {
        // Si ya tiene foto de báscula, debería ir a finish
        if (evidence['scale']) {
            return 'finish';
        }
        return '4c'; // Primer paso: foto de báscula
    }

    if (tipoReporte === 'entrega') {
        // Determinar el siguiente paso basado en evidencia disponible
        if (!evidence['arrival_exhibit']) {
            return '4a'; // Primer paso: foto del exhibidor
        }

        if (!evidence['product_arranged']) {
            // Ya tiene exhibidor, verificar si ya respondió sobre incidencias
            // Si tiene incident_details, ya pasó por el formulario de incidencias
            if (incidentDetails && incidentDetails.length > 0) {
                // Ya reportó incidencias, debe ir a producto acomodado
                return '6';
            }
            // Si no tiene incidencias guardadas pero tampoco producto acomodado,
            // necesita decidir sobre incidencias
            return 'incident_check';
        }

        // Ya tiene producto acomodado, verificar si hay merma
        const hasWaste = evidence['waste_evidence'];
        const hasRemission = evidence['remission'];
        
        if (!hasWaste && !hasRemission) {
            return 'waste_check'; // Necesita decidir sobre merma
        }

        // Ya decidió sobre merma, verificar ticket
        if (!evidence['ticket']) {
            return '8'; // Paso del ticket
        }

        // Ya tiene ticket, verificar devolución
        if (!evidence['return_ticket']) {
            // Necesita decidir si hay devolución
            return 'return_check';
        }

        // Ya tiene todo, debería estar en finish o en confirmación de devolución
        return '11'; // Confirmación de devolución o finish
    }

    // Default: primer paso según tipo
    return '4a';
}

