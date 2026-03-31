/**
 * Claude Ticket Data Extraction
 * Uses Anthropic Claude Vision to extract structured data from Verdefrut ticket images
 */

import Anthropic from '@anthropic-ai/sdk';

export interface TicketProduct {
    clave_articulo: string; // Ejemplo: 55559, 55560, 55561
    descripcion: string;    // Ejemplo: "LIMON CON SEMILLA KG", "AGUACATE HASS KG"
    costo: number;          // Ejemplo: 38.51, 81.00, 34.90
    peso: number;           // Ejemplo: 4.08, 4.10, 2.19 (kg o unidades según producto)
}

export interface ExtractedTicketData {
    codigo_tienda: string | null; // Ejemplo: "10PCK"
    tienda: string | null;        // Ejemplo: "Nardo MEX"
    fecha: string | null;         // Formato: "DD/MM/YYYY"
    orden_compra: string | null;  // Ejemplo: "945358"
    productos: TicketProduct[];
    subtotal: number | null;      // Ejemplo: 1184.97
    total: number | null;         // Ejemplo: 1077.44
    confidence: number;           // 0.0 to 1.0
    rawResponse: string;
}

const EXTRACTION_SYSTEM_PROMPT = `Eres un asistente experto en extraer datos de tickets de compra y entrega de productos Verdefrut.

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
      "costo": número del costo/precio del producto,
      "peso": número del peso o unidades de la columna UDS
    }
  ],
  "subtotal": número del subtotal (busca "TOT GENERAL A VENTA" o "TOT. TASA FIS"),
  "total": número del total (busca "TOTAL COSTO" o el total final),
  "confidence": número entre 0.0 y 1.0 indicando tu confianza en la extracción
}

INSTRUCCIONES CRÍTICAS:
1. LEE TODO EL TICKET COMPLETO DE IZQUIERDA A DERECHA Y DE ARRIBA HACIA ABAJO
2. Extrae TODOS los productos: CLAVE, DESCRIPCION, COSTO (no PRECIO), UDS (peso/unidades)
3. CÓDIGO TIENDA: Busca en "Plaza" o "Tienda" el código (ejemplo: 10PCK, 50NRD)
4. NOMBRE TIENDA: Busca el nombre después del código (ejemplo: "NARDO MEX")
5. ORDEN DE COMPRA: Busca el número después de "ORDEN DE COMPRA"
6. FECHA: Busca el número después de "FECHA:" - formato DD/MM/YYYY
7. SUBTOTAL: Busca "TOT GENERAL A VENTA" o "TOT. TASA FIS 0.00%:"
8. TOTAL: Busca "TOTAL COSTO:"
9. CONFIDENCE: Usa 0.95 o más si extraes todos los campos correctamente
10. Devuelve SOLO el objeto JSON, sin explicaciones ni markdown`;

/**
 * Extract ticket data from an image URL using Claude Vision
 */
export async function extractTicketData(
    imageUrl: string,
    retryCount: number = 0,
    maxRetries: number = 2
): Promise<ExtractedTicketData> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY no está configurada en las variables de entorno');
    }

    // 60-second total timeout for the Anthropic SDK — vision requests with large images can take 30-45s
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        timeout: 60_000,
    });

    try {
        const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4000,
            system: EXTRACTION_SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                                data: base64,
                            },
                        },
                        {
                            type: 'text',
                            text: 'Analiza este ticket Verdefrut y devuelve SOLO el objeto JSON con los datos extraídos, sin markdown ni texto adicional.',
                        },
                    ],
                },
            ],
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';

        if (!content) {
            throw new Error('No se recibió contenido de la API de Claude');
        }

        return parseAndNormalizeResponse(content);
    } catch (error: any) {
        console.error('Error extracting ticket data:', error);

        const isRateLimit =
            error?.status === 429 ||
            error?.error?.type === 'rate_limit_error' ||
            error?.message?.includes('rate_limit');

        const isOverloaded =
            error?.error?.type === 'overloaded_error' ||
            error?.message?.includes('overloaded');

        if ((isRateLimit || isOverloaded) && retryCount < maxRetries) {
            const waitMs = 5000 * (retryCount + 1);
            console.log(`Rate limit/overloaded. Esperando ${waitMs}ms (intento ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            return extractTicketData(imageUrl, retryCount + 1, maxRetries);
        }

        if (isRateLimit) throw new Error('RATE_LIMIT: Demasiadas solicitudes. Intenta en unos minutos.');
        if (isOverloaded) throw new Error('CUOTA_EXCEDIDA: El servicio está sobrecargado temporalmente.');

        if (error?.status === 401 || error?.error?.type === 'authentication_error') {
            throw new Error('API_KEY_INVALIDA: La ANTHROPIC_API_KEY no es válida.');
        }

        throw error;
    }
}

function parseAndNormalizeResponse(content: string): ExtractedTicketData {
    let jsonContent = content.trim();

    if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    }

    const greedyMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (greedyMatch) jsonContent = greedyMatch[0];

    let extracted: any;
    try {
        extracted = JSON.parse(jsonContent);
    } catch {
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            extracted = JSON.parse(content.substring(firstBrace, lastBrace + 1));
        } else {
            throw new Error(`No se encontró JSON válido en la respuesta. Contenido: ${content.substring(0, 200)}`);
        }
    }

    return {
        codigo_tienda: extracted.codigo_tienda || null,
        tienda: extracted.tienda || null,
        fecha: extracted.fecha || null,
        orden_compra: extracted.orden_compra || null,
        productos: Array.isArray(extracted.productos)
            ? extracted.productos
                .filter((p: any) => p && (p.clave_articulo || p.clave))
                .map((p: any) => ({
                    clave_articulo: String(p.clave_articulo || p.clave || '').trim(),
                    descripcion: String(p.descripcion || p.descripción || '').trim(),
                    costo: parseNumeric(p.costo ?? p.precio),
                    peso: parseNumeric(p.peso ?? p.uds),
                }))
            : [],
        subtotal: parseNumericOrNull(extracted.subtotal),
        total: parseNumericOrNull(extracted.total),
        confidence: typeof extracted.confidence === 'number' ? extracted.confidence : 0.0,
        rawResponse: content,
    };
}

function parseNumeric(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value.replace(/,/g, '').replace(/\s/g, '')) || 0;
    return 0;
}

function parseNumericOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    return parseNumeric(value);
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
    // 30-second timeout — large ticket images from Supabase Storage can be slow on cold start
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
        response = await fetch(imageUrl, { signal: controller.signal });
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Timeout al obtener la imagen (>30s)');
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        throw new Error(`Error al obtener la imagen: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    let mimeType = 'image/jpeg';

    if (contentType.includes('image/png') || imageUrl.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
    } else if (contentType.includes('image/webp') || imageUrl.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
    } else if (contentType.includes('image/gif') || imageUrl.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif';
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return { base64, mimeType };
}
