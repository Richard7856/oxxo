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

Tu tarea es extraer TODOS los datos del ticket y devolverlos en formato JSON estricto:

{
  "codigo_tienda": "código de la tienda del ticket (ejemplo: 10PCK, puede estar en Plaza o Tienda)",
  "tienda": "nombre de la tienda del ticket (ejemplo: NARDO MEX o Nardo MEX, puede estar después del código)",
  "fecha": "fecha en formato DD/MM/YYYY encontrada en FECHA (ejemplo: 13/10/2025)",
  "orden_compra": "número de ORDEN DE COMPRA del ticket (ejemplo: 945358)",
  "productos": [
    {
      "clave_articulo": "clave del artículo de la columna CLAVE (ejemplo: 55559, 55560, 55561)",
      "descripcion": "descripción completa de la columna DESCRIPCION (ejemplo: LIMON CON SEMILLA KG, AGUACATE HASS KG)",
      "costo": número del costo/precio del producto (usa la columna COSTO o PRECIO, ejemplo: 35.08, 38.50, 73.67, 81.00)",
      "peso": número del peso o unidades de la columna UDS (ejemplo: 4.06, 4.10, 2.19, 5.05, 2.03, 1.10, 2.13)"
    }
  ],
  "subtotal": número del subtotal (busca "TOT GENERAL A VENTA" o "TOT. TASA FIS", ejemplo: 1184.97),
  "total": número del total (busca "TOTAL COSTO" o el total final, ejemplo: 1077.44),
  "confidence": número entre 0.0 y 1.0 indicando tu confianza en la extracción (0.9 o más si extraíste todo correctamente)
}

INSTRUCCIONES CRÍTICAS:
1. LEE TODO EL TICKET COMPLETO DE IZQUIERDA A DERECHA Y DE ARRIBA HACIA ABAJO
2. Extrae TODOS los productos de la tabla de productos, cada fila con:
   - CLAVE: número de la columna CLAVE (ejemplo: 55559, 55560, 55561)
   - DESCRIPCION: texto completo de la columna DESCRIPCION (ejemplo: "LIMON CON SEMILLA KG")
   - COSTO: número de la columna COSTO (NO PRECIO, usa COSTO - ejemplo: 35.08, 73.67)
   - PESO: número de la columna UDS (unidades en kg o unidades - ejemplo: 4.06, 4.10)
3. CÓDIGO TIENDA: Busca en "Plaza" o "Tienda" el código (ejemplo: 10PCK, 50NRD)
4. NOMBRE TIENDA: Busca el nombre después del código o en "Tienda" (ejemplo: "NARDO MEX", "Nardo MEX")
5. ORDEN DE COMPRA: Busca el número después de "ORDEN DE COMPRA" (ejemplo: 945358)
6. FECHA: Busca el número después de "FECHA:" (ejemplo: 13/10/2025) - formato DD/MM/YYYY
7. SUBTOTAL: Busca el número después de "TOT GENERAL A VENTA" o "TOT. TASA FIS 0.00%:" (ejemplo: 1184.97)
8. TOTAL: Busca el número después de "TOTAL COSTO:" (ejemplo: 1077.44)
9. CONFIDENCE: Si extraes todos los campos correctamente, usa 0.95 o más
10. IMPORTANTE: Solo devuelve el objeto JSON, sin explicaciones, sin markdown, sin texto adicional, SOLO JSON`;

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
                            text: `Analiza este ticket OXXO detalladamente. 

1. Busca la información de la tienda: código y nombre
2. Busca la fecha (FECHA)
3. Busca la orden de compra (ORDEN DE COMPRA)
4. Extrae TODOS los productos de la tabla con:
   - CLAVE de la columna CLAVE
   - DESCRIPCION completa
   - COSTO de la columna COSTO o PRECIO
   - PESO de la columna UDS
5. Busca el subtotal (TOT GENERAL A VENTA o TOT. TASA FIS)
6. Busca el total (TOTAL COSTO o total final)

Lee TODO el ticket cuidadosamente y extrae cada dato.`,
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl,
                                detail: 'high', // Usar 'high' para mejor calidad de lectura
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
            console.error('No content in OpenAI response');
            throw new Error('No se recibió contenido de la API de OpenAI');
        }

        console.log('Respuesta completa de OpenAI (primeros 500 caracteres):', content.substring(0, 500));
        console.log('Longitud de la respuesta:', content.length);

        // Parse JSON from response
        let extracted;
        try {
            extracted = JSON.parse(content);
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            console.error('Content received:', content);
            throw new Error('Error al procesar la respuesta de la IA. Formato inválido.');
        }

        const result = {
            codigo_tienda: extracted.codigo_tienda && extracted.codigo_tienda !== '' ? extracted.codigo_tienda : null,
            tienda: extracted.tienda && extracted.tienda !== '' ? extracted.tienda : null,
            fecha: extracted.fecha && extracted.fecha !== '' ? extracted.fecha : null,
            orden_compra: extracted.orden_compra && extracted.orden_compra !== '' ? extracted.orden_compra : null,
            productos: Array.isArray(extracted.productos) ? extracted.productos
                .filter((p: any) => p && (p.clave_articulo || p.clave)) // Filtrar productos vacíos
                .map((p: any) => ({
                    clave_articulo: String(p.clave_articulo || p.clave || '').trim(),
                    descripcion: String(p.descripcion || p.descripción || '').trim(),
                    costo: typeof p.costo === 'number' ? p.costo : (typeof p.costo === 'string' ? parseFloat(p.costo.replace(/,/g, '').replace(/\s/g, '')) : (p.precio ? (typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio).replace(/,/g, '').replace(/\s/g, ''))) : 0)),
                    peso: typeof p.peso === 'number' ? p.peso : (typeof p.peso === 'string' ? parseFloat(p.peso.replace(/,/g, '').replace(/\s/g, '')) : (p.uds ? (typeof p.uds === 'number' ? p.uds : parseFloat(String(p.uds).replace(/,/g, '').replace(/\s/g, ''))) : 0)),
                })) : [],
            subtotal: typeof extracted.subtotal === 'number' ? extracted.subtotal : (typeof extracted.subtotal === 'string' ? parseFloat(extracted.subtotal.replace(/,/g, '')) : null),
            total: typeof extracted.total === 'number' ? extracted.total : (typeof extracted.total === 'string' ? parseFloat(extracted.total.replace(/,/g, '')) : null),
            confidence: typeof extracted.confidence === 'number' ? extracted.confidence : (extracted.confidence || 0.0),
            rawResponse: content,
        };

        console.log('Datos extraídos procesados:', JSON.stringify(result, null, 2));
        console.log('Número de productos extraídos:', result.productos.length);
        return result;
    } catch (error: any) {
        console.error('Error extracting ticket data:', error);
        
        // Detectar error de cuota de OpenAI
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
            console.error('OpenAI Quota Exceeded Error');
            throw new Error('CUOTA_EXCEDIDA: Se excedió la cuota de la API de OpenAI. Por favor, verifica tu plan y facturación en https://platform.openai.com/account/billing');
        }
        
        // Si es un error de la API de OpenAI, propagarlo con más detalles
        if (error?.response) {
            console.error('OpenAI API Error:', error.response);
            const statusCode = error.response?.status || error.status;
            if (statusCode === 429) {
                throw new Error('CUOTA_EXCEDIDA: Se excedió la cuota de la API de OpenAI. Por favor, verifica tu plan y facturación en https://platform.openai.com/account/billing');
            }
            throw new Error(`Error de la API de OpenAI (${statusCode}): ${error.message || 'Error desconocido'}`);
        }

        // Re-lanzar errores de parsing o otros errores críticos
        if (error?.message && (error.message.includes('Error al procesar') || error.message.includes('CUOTA_EXCEDIDA'))) {
            throw error;
        }

        // Return empty result with low confidence solo para errores no críticos
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
