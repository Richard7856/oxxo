/**
 * OpenAI Ticket Data Extraction
 * Uses GPT-4 Vision to extract structured data from ticket images
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface TicketProduct {
    clave_articulo: string; // Ejemplo: 55559, 55560, 55561
    descripcion: string; // Ejemplo: "LIMON CON SEMILLA KG", "AGUACATE HASS KG"
    costo: number; // Ejemplo: 38.51, 81.00, 34.90
    peso: number; // Ejemplo: 4.08, 4.10, 2.19 (en kg o unidades según el producto)
}

export interface ExtractedTicketData {
    codigo_tienda: string | null; // Ejemplo: "10PCK"
    tienda: string | null; // Ejemplo: "Nardo MEX"
    fecha: string | null; // Formato: "13/10/2025" o "YYYY-MM-DD"
    orden_compra: string | null; // Ejemplo: "945358"
    productos: TicketProduct[];
    subtotal: number | null; // Ejemplo: 1184.97
    total: number | null; // Ejemplo: 1077.44
    confidence: number; // 0.0 to 1.0
    rawResponse: string;
}

const EXTRACTION_PROMPT = `Eres un asistente experto en extraer datos de tickets de compra OXXO (Cadena Comercial Oxxo, S.A. de C.V.).

Extrae la siguiente información del ticket en formato JSON estricto:

{
  "codigo_tienda": "código de la tienda (ejemplo: 10PCK)",
  "tienda": "nombre de la tienda (ejemplo: Nardo MEX)",
  "fecha": "fecha en formato DD/MM/YYYY (ejemplo: 13/10/2025)",
  "orden_compra": "número de orden de compra (ejemplo: 945358)",
  "productos": [
    {
      "clave_articulo": "clave del artículo (ejemplo: 55559, 55560)",
      "descripcion": "descripción completa del producto (ejemplo: LIMON CON SEMILLA KG)",
      "costo": número del precio/costo del producto (ejemplo: 38.51),
      "peso": número del peso o unidades (ejemplo: 4.08, puede ser en kg o unidades según el producto)
    }
  ],
  "subtotal": número del subtotal (ejemplo: 1184.97),
  "total": número del total (ejemplo: 1077.44),
  "confidence": número entre 0.0 y 1.0 indicando tu confianza en la extracción
}

IMPORTANTE:
- Extrae TODOS los productos listados en el ticket
- El campo "costo" debe ser el precio/costo del producto (columna COSTO o PRECIO)
- El campo "peso" debe ser el peso o unidades (columna UDS. o U.COM)
- Si no puedes extraer algún dato con confianza, usa null
- Si la imagen no es un ticket de OXXO o no puedes leer los datos, establece confidence en 0.0
- Solo devuelve JSON válido, sin explicaciones adicionales
- La fecha debe estar en formato DD/MM/YYYY`;

/**
 * Extract ticket data from an image URL
 */
export async function extractTicketData(
    imageUrl: string
): Promise<ExtractedTicketData> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o', // Modelo con visión
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
                            text: 'Extrae todos los datos de este ticket OXXO. Asegúrate de incluir TODOS los productos listados en el ticket con sus claves, descripciones, costos y pesos.',
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
            max_tokens: 4000,
            temperature: 0.1, // Low temperature for more deterministic output
            response_format: { type: 'json_object' },
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No content in OpenAI response');
        }

        // Parse JSON from response
        const extracted = JSON.parse(content);

        return {
            codigo_tienda: extracted.codigo_tienda || null,
            tienda: extracted.tienda || null,
            fecha: extracted.fecha || null,
            orden_compra: extracted.orden_compra || null,
            productos: extracted.productos || [],
            subtotal: extracted.subtotal || null,
            total: extracted.total || null,
            confidence: extracted.confidence || 0.0,
            rawResponse: content,
        };
    } catch (error) {
        console.error('Error extracting ticket data:', error);

        // Return empty result with low confidence
        return {
            codigo_tienda: null,
            tienda: null,
            fecha: null,
            orden_compra: null,
            productos: [],
            subtotal: null,
            total: null,
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

    if (!data.codigo_tienda) {
        errors.push('Código de tienda no encontrado');
    }

    if (!data.tienda) {
        errors.push('Nombre de tienda no encontrado');
    }

    if (!data.fecha) {
        errors.push('Fecha no encontrada');
    }

    if (!data.orden_compra) {
        errors.push('Orden de compra no encontrada');
    }

    if (data.productos.length === 0) {
        errors.push('No se encontraron productos');
    }

    if (data.subtotal === null || data.subtotal <= 0) {
        errors.push('Subtotal inválido');
    }

    if (data.total === null || data.total <= 0) {
        errors.push('Total inválido');
    }

    if (data.confidence < 0.5) {
        errors.push(`Confianza baja (${(data.confidence * 100).toFixed(0)}%)`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
