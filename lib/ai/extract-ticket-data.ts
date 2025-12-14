/**
 * OpenAI Ticket Data Extraction
 * Uses GPT-4 Vision to extract structured data from ticket images
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface TicketItem {
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
}

export interface ExtractedTicketData {
    numero: string | null;
    fecha: string | null; // YYYY-MM-DD
    total: number | null;
    items: TicketItem[];
    confidence: number; // 0.0 to 1.0
    rawResponse: string;
}

const EXTRACTION_PROMPT = `Eres un asistente experto en extraer datos de tickets de compra OXXO.

Extrae la siguiente información en formato JSON:
- numero: número de ticket (string)
- fecha: fecha en formato YYYY-MM-DD (string)
- total: monto total (number)
- items: array de productos, cada uno con:
  - descripcion: nombre del producto (string)
  - cantidad: cantidad comprada (number)
  - precioUnitario: precio por unidad (number)
  - subtotal: total del item (number)
- confidence: tu nivel de confianza en la extracción de 0.0 a 1.0 (number)

Si no puedes extraer algún dato con confianza, usa null.
Si la imagen no es un ticket de OXXO o no puedes leer los datos, establece confidence en 0.0.

IMPORTANTE: Solo devuelve JSON válido, no incluyas explicaciones adicionales.`;

/**
 * Extract ticket data from an image URL
 */
export async function extractTicketData(
    imageUrl: string
): Promise<ExtractedTicketData> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-vision-preview',
            messages: [
                {
                    role: 'system',
                    content: EXTRACTION_PROMPT,
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Extrae los datos de este ticket OXXO:',
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                                detail: 'high',
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
            temperature: 0.1, // Low temperature for more deterministic output
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No content in OpenAI response');
        }

        // Parse JSON from response
        const extracted = JSON.parse(content);

        return {
            numero: extracted.numero,
            fecha: extracted.fecha,
            total: extracted.total,
            items: extracted.items || [],
            confidence: extracted.confidence || 0.0,
            rawResponse: content,
        };
    } catch (error) {
        console.error('Error extracting ticket data:', error);

        // Return empty result with low confidence
        return {
            numero: null,
            fecha: null,
            total: null,
            items: [],
            confidence: 0.0,
            rawResponse: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Validate extracted ticket data
 */
export function validateTicketData(data: ExtractedTicketData): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!data.numero) {
        errors.push('Número de ticket no encontrado');
    }

    if (!data.fecha) {
        errors.push('Fecha no encontrada');
    }

    if (data.total === null || data.total <= 0) {
        errors.push('Total inválido');
    }

    if (data.items.length === 0) {
        errors.push('No se encontraron items');
    }

    if (data.confidence < 0.7) {
        errors.push(`Confianza baja (${(data.confidence * 100).toFixed(0)}%)`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
