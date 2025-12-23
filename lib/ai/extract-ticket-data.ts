/**
 * OpenAI Ticket Data Extraction
 * Uses GPT-4 Vision to extract structured data from ticket images
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface TicketItem {
    clave_articulo: string; // Código del artículo (ej: 55562, 55559)
    descripcion: string; // Nombre del producto (ej: PLATANO TABASCO K, LIMON CON SEMILLA)
    costo: number; // Costo (valor abajo de la clave, ej: 35.50, 38.50)
    peso: number; // Peso/primera cantidad numérica (ej: 5.07, 4.07)
    cantidad: number; // Cantidad comprada
    subtotal: number; // Total del item
}

export interface ExtractedTicketData {
    codigo_tienda: string | null; // Código de la tienda (ej: 50UZH)
    tienda: string | null; // Nombre de la tienda (ej: Plaza diamante II)
    fecha: string | null; // Fecha en formato YYYY-MM-DD (ej: 2025-10-13)
    orden_compra: string | null; // Orden de compra (ej: 4509550)
    subtotal: number | null; // Sub total general (ej: 713.76)
    total: number | null; // Total costo (ej: 649.60)
    items: TicketItem[];
    confidence: number; // 0.0 to 1.0
    rawResponse: string;
}

const EXTRACTION_PROMPT = `Eres un asistente experto en extraer datos de tickets de compra OXXO.

Extrae la siguiente información en formato JSON del ticket:

Información general del ticket:
- codigo_tienda: código de la tienda (ej: "50UZH") - busca en "TIENDA:" (string)
- tienda: nombre completo de la tienda (ej: "Plaza diamante II") - busca en el nombre de la plaza o tienda (string)
- fecha: fecha en formato YYYY-MM-DD (ej: "2025-10-13") - busca en "FECHA:" (string)
- orden_compra: número de orden de compra (ej: "4509550") - busca en "ORDEN DE COMPRA:" (string)
- subtotal: sub total general (ej: 713.76) - busca en "TOT GENERAL A VENTA KG" o similar (number)
- total: total costo (ej: 649.60) - busca en "TOTAL COSTO VE" o similar (number)

items: array de productos, cada uno con:
  - clave_articulo: código del artículo que aparece ANTES del nombre del producto (ej: "55562", "55559", "55560", "55552") (string)
  - descripcion: nombre completo del producto (ej: "PLATANO TABASCO K", "LIMON CON SEMILLA", "AGUACATE HASS KG", "JITOMATE SALADETT") (string)
  - costo: valor numérico que aparece ABAJO de la clave del artículo (ej: 35.50, 38.50, 81.00, 35.90) (number)
  - peso: primer valor numérico que aparece debajo del nombre del producto (ej: 5.07, 4.07, 4.15, 1.14) - este es el peso/precio unitario (number)
  - cantidad: cantidad comprada (ej: 7, 4, 5, 2) - busca en la columna de cantidad (number)
  - subtotal: total del item (ej: 179.98, 156.69, 336.15, 40.93) - busca en "VALTOT" o columna de total (number)

- confidence: tu nivel de confianza en la extracción de 0.0 a 1.0 (number)

INSTRUCCIONES IMPORTANTES:
1. Busca cada campo cuidadosamente en el ticket, los valores pueden estar en diferentes posiciones
2. El costo aparece debajo de la clave del artículo, NO es el precio unitario
3. El peso es el primer valor numérico debajo del nombre del producto (generalmente en la columna de precio/costo)
4. Si no puedes extraer algún dato con confianza, usa null
5. Si la imagen no es un ticket de OXXO o no puedes leer los datos, establece confidence en 0.0
6. Solo devuelve JSON válido, sin explicaciones adicionales

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
            max_tokens: 2000,
            temperature: 0.1, // Low temperature for more deterministic output
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No content in OpenAI response');
        }

        // Parse JSON from response - handle markdown code blocks
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```json')) {
            jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        } else if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/```\n?/g, '').trim();
        }
        
        const extracted = JSON.parse(jsonContent);

        return {
            codigo_tienda: extracted.codigo_tienda || null,
            tienda: extracted.tienda || null,
            fecha: extracted.fecha || null,
            orden_compra: extracted.orden_compra || null,
            subtotal: extracted.subtotal ?? null,
            total: extracted.total ?? null,
            items: (extracted.items || []).map((item: any) => ({
                clave_articulo: item.clave_articulo || '',
                descripcion: item.descripcion || '',
                costo: item.costo ?? null,
                peso: item.peso ?? null,
                cantidad: item.cantidad ?? 0,
                subtotal: item.subtotal ?? 0,
            })),
            confidence: extracted.confidence ?? 0.0,
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
            subtotal: null,
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

    if (data.subtotal === null || data.subtotal <= 0) {
        errors.push('Subtotal inválido');
    }

    if (data.total === null || data.total <= 0) {
        errors.push('Total inválido');
    }

    if (data.items.length === 0) {
        errors.push('No se encontraron productos');
    }

    // Validar items
    data.items.forEach((item, index) => {
        if (!item.clave_articulo) {
            errors.push(`Producto ${index + 1}: clave de artículo no encontrada`);
        }
        if (!item.descripcion) {
            errors.push(`Producto ${index + 1}: descripción no encontrada`);
        }
        if (item.costo === null || item.costo < 0) {
            errors.push(`Producto ${index + 1}: costo inválido`);
        }
        if (item.peso === null || item.peso <= 0) {
            errors.push(`Producto ${index + 1}: peso inválido`);
        }
        if (item.cantidad <= 0) {
            errors.push(`Producto ${index + 1}: cantidad inválida`);
        }
    });

    if (data.confidence < 0.5) {
        errors.push(`Confianza baja (${(data.confidence * 100).toFixed(0)}%)`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
