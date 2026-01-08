/**
 * Gemini Ticket Data Extraction
 * Uses Google Gemini Vision to extract structured data from ticket images
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Inicializar con la API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
 * Extract ticket data from an image URL using Gemini
 * With automatic retry for rate limiting
 */
export async function extractTicketData(
    imageUrl: string,
    retryCount: number = 0,
    maxRetries: number = 2
): Promise<ExtractedTicketData> {
    try {
        // Verificar que la API key esté configurada
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
        }

        // Crear el prompt completo con instrucciones
        // Importante: Pedir explícitamente JSON sin markdown ni texto adicional
        const fullPrompt = `Analiza este ticket OXXO detalladamente y devuelve SOLO un objeto JSON válido, sin explicaciones, sin markdown, sin texto adicional.

${EXTRACTION_PROMPT}

INSTRUCCIONES FINALES:
- Devuelve ÚNICAMENTE el objeto JSON sin código markdown
- No uses \`\`\`json ni \`\`\` 
- No agregues texto antes o después del JSON
- El JSON debe ser válido y parseable directamente`;

        // Obtener la imagen en base64 con el tipo MIME correcto
        const { base64, mimeType } = await fetchImageAsBase64(imageUrl);
        
        // Primero, intentar listar los modelos disponibles para ver qué hay
        let availableModels: string[] = [];
        try {
            const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
            if (modelsResponse.ok) {
                const modelsData = await modelsResponse.json();
                availableModels = (modelsData.models || []).map((m: any) => m.name?.replace('models/', '') || '').filter(Boolean);
                console.log('Modelos disponibles:', availableModels);
            }
        } catch (listError) {
            console.warn('No se pudieron listar modelos disponibles:', listError);
        }
        
        // Lista de modelos a intentar, en orden de preferencia
        // Filtrar por los que están disponibles o usar la lista predeterminada
        const preferredModels = [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro-vision',
            'gemini-pro',
        ];
        
        const modelNames = availableModels.length > 0 
            ? preferredModels.filter(m => availableModels.includes(m))
            : preferredModels;
        
        if (modelNames.length === 0 && availableModels.length > 0) {
            // Si ninguno de los preferidos está disponible, usar el primero disponible que tenga "vision" o "flash" o "pro"
            const fallbackModel = availableModels.find((m: string) => 
                m.includes('vision') || m.includes('flash') || m.includes('pro')
            ) || availableModels[0];
            if (fallbackModel) {
                modelNames.push(fallbackModel);
            }
        }
        
        let lastError: any = null;
        let generationResult: any = null;
        let usedModel: string | null = null;
        
        // Intentar con cada modelo hasta que uno funcione
        for (const modelName of modelNames) {
            try {
                console.log(`Intentando con modelo: ${modelName}`);
                
                // Configuración base
                const generationConfig: any = {
                    temperature: 0.1,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 4000,
                };
                
                // Solo agregar responseMimeType para modelos 1.5 que lo soporten
                // gemini-1.5-flash y gemini-1.5-pro deberían soportarlo
                if (modelName.includes('1.5-flash') || modelName.includes('1.5-pro')) {
                    try {
                        generationConfig.responseMimeType = 'application/json';
                        console.log(`Usando responseMimeType: application/json para ${modelName}`);
                    } catch (configError) {
                        console.warn(`No se pudo configurar responseMimeType para ${modelName}:`, configError);
                        // Continuar sin responseMimeType
                    }
                }
                
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    generationConfig: generationConfig,
                });
                
                // Enviar la imagen y el prompt a Gemini
                generationResult = await model.generateContent([
                    {
                        inlineData: {
                            data: base64,
                            mimeType: mimeType,
                        },
                    },
                    { text: fullPrompt },
                ]);
                
                usedModel = modelName;
                console.log(`Modelo ${modelName} funcionó correctamente`);
                break; // Si funcionó, salir del loop
            } catch (error: any) {
                console.log(`Modelo ${modelName} falló:`, error?.message);
                lastError = error;
                continue; // Intentar con el siguiente modelo
            }
        }
        
        if (!generationResult) {
            const errorMessage = `No se pudo usar ningún modelo disponible. Modelos intentados: ${modelNames.join(', ')}. ${availableModels.length > 0 ? `Modelos disponibles en tu cuenta: ${availableModels.join(', ')}.` : 'No se pudieron listar los modelos disponibles.'} Último error: ${lastError?.message || 'Desconocido'}`;
            throw new Error(errorMessage);
        }

        const response = await generationResult.response;
        let content = response.text();
        
        if (!content) {
            console.error('No content in Gemini response');
            throw new Error('No se recibió contenido de la API de Gemini');
        }

        console.log('=== RESPUESTA DE GEMINI ===');
        console.log('Longitud total:', content.length);
        console.log('Primeros 500 caracteres:', content.substring(0, 500));
        console.log('Últimos 500 caracteres:', content.substring(Math.max(0, content.length - 500)));
        console.log('===========================');

        // Limpiar el contenido: remover markdown code blocks si existen
        content = content.trim();
        
        // Si está envuelto en markdown code blocks, extraer el JSON
        if (content.startsWith('```json')) {
            console.log('Encontrado código markdown con ```json, extrayendo...');
            content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        } else if (content.startsWith('```')) {
            console.log('Encontrado código markdown con ```, extrayendo...');
            content = content.replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim();
        }
        
        // Intentar encontrar JSON entre llaves si hay texto adicional
        // Primero, buscar el JSON más completo (puede haber múltiples objetos JSON)
        let jsonContent = content.trim();
        
        // Intentar greedy match primero (obtiene el JSON más grande)
        const greedyMatch = content.match(/\{[\s\S]*\}/);
        if (greedyMatch) {
            jsonContent = greedyMatch[0];
        } else {
            // Si no hay match greedy, intentar non-greedy (puede haber múltiples JSON)
            const jsonMatches = content.match(/\{[\s\S]*?\}/g);
            if (jsonMatches && jsonMatches.length > 0) {
                // Usar el JSON más largo (probablemente el completo)
                jsonContent = jsonMatches.reduce((longest: string, current: string) => 
                    current.length > longest.length ? current : longest
                );
            }
        }
        
        // Si aún no hay JSON, intentar buscar desde la primera llave hasta la última
        if (!jsonContent.includes('{') || !jsonContent.includes('}')) {
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                jsonContent = content.substring(firstBrace, lastBrace + 1);
            }
        }

        // Parse JSON from response
        let extracted;
        console.log('Intentando parsear JSON...');
        console.log('JSON a parsear (primeros 300 caracteres):', jsonContent.substring(0, 300));
        
        try {
            extracted = JSON.parse(jsonContent);
            console.log('✅ JSON parseado exitosamente en el primer intento');
        } catch (parseError: any) {
            console.error('❌ Error parsing JSON response (primer intento):', parseError?.message);
            console.error('JSON extraído completo:', jsonContent);
            
            // Intentar limpiar más agresivamente
            try {
                // Remover texto antes de la primera llave y después de la última
                const firstBrace = content.indexOf('{');
                const lastBrace = content.lastIndexOf('}');
                console.log(`Buscando JSON entre llaves: posición { = ${firstBrace}, posición } = ${lastBrace}`);
                
                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                    const cleaned = content.substring(firstBrace, lastBrace + 1);
                    console.log('Intentando parsear JSON limpiado (desde posición', firstBrace, 'hasta', lastBrace, ')');
                    console.log('JSON limpiado (primeros 300 caracteres):', cleaned.substring(0, 300));
                    extracted = JSON.parse(cleaned);
                    console.log('✅ JSON parseado exitosamente después de limpiar');
                } else {
                    console.error('❌ No se encontraron llaves válidas en la respuesta');
                    console.error('Contenido completo recibido:', content);
                    throw new Error(`No se encontró JSON válido en la respuesta. Contenido recibido: ${content.substring(0, 200)}...`);
                }
            } catch (secondParseError: any) {
                console.error('❌ Segundo intento de parseo falló:', secondParseError?.message);
                console.error('Respuesta completa recibida:', content);
                throw new Error(`Error al procesar la respuesta de la IA. Formato inválido. ${parseError?.message}. Respuesta: ${content.substring(0, 500)}...`);
            }
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
        console.error('Error details:', {
            status: error?.status,
            message: error?.message,
            response: error?.response?.data,
            headers: error?.response?.headers,
        });
        
        // Detectar error 429 o rate limiting de Gemini
        if (error?.status === 429 || error?.statusCode === 429 || error?.message?.includes('429')) {
            const errorMessage = error?.message || '';
            
            // Intentar determinar si es rate limiting
            if (errorMessage.includes('rate_limit') || errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                // Es rate limiting - intentar retry automático
                if (retryCount < maxRetries) {
                    const waitTime = 5000 * (retryCount + 1); // Backoff exponencial: 5s, 10s
                    
                    console.log(`Rate limit alcanzado en Gemini. Esperando ${waitTime / 1000} segundos antes de reintentar... (intento ${retryCount + 1}/${maxRetries})`);
                    
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    
                    // Reintentar
                    return extractTicketData(imageUrl, retryCount + 1, maxRetries);
                } else {
                    throw new Error(`RATE_LIMIT: Demasiadas solicitudes a Gemini. Por favor espera unos minutos antes de intentar de nuevo.`);
                }
            } else {
                // Error 429 genérico - intentar un retry más
                if (retryCount < maxRetries) {
                    console.log(`Error 429 genérico en Gemini. Esperando 10 segundos antes de reintentar... (intento ${retryCount + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    return extractTicketData(imageUrl, retryCount + 1, maxRetries);
                } else {
                    throw new Error(`LÍMITE_EXCEDIDO: Se excedió el límite de la API de Gemini. Por favor, espera unos minutos o verifica tu cuenta en https://aistudio.google.com/app/apikey`);
                }
            }
        }
        
        // Si es un error de la API de Gemini, propagarlo con más detalles
        if (error?.message) {
            console.error('Gemini API Error:', error.message);
            
            if (error.message.includes('API key not valid') || error.message.includes('Invalid API key')) {
                throw new Error('API_KEY_INVALIDA: La clave de API de Gemini no es válida. Por favor, verifica GEMINI_API_KEY en las variables de entorno.');
            }
            
            throw new Error(`Error de la API de Gemini: ${error.message}`);
        }

        // Re-lanzar errores de parsing o otros errores críticos
        if (error?.message && (error.message.includes('Error al procesar') || error.message.includes('CUOTA_EXCEDIDA') || error.message.includes('RATE_LIMIT') || error.message.includes('LÍMITE_EXCEDIDO') || error.message.includes('API_KEY_INVALIDA'))) {
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

/**
 * Fetch image from URL and convert to base64
 * Works in Node.js server environment
 * Returns both base64 string and mime type
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
    try {
        // Usar fetch nativo de Node.js (disponible en Node 18+)
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Error al obtener la imagen: ${response.status} ${response.statusText}`);
        }
        
        // Detectar el tipo MIME de la imagen
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        let mimeType = 'image/jpeg'; // Default
        
        if (contentType.includes('image/png')) {
            mimeType = 'image/png';
        } else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
            mimeType = 'image/jpeg';
        } else if (contentType.includes('image/webp')) {
            mimeType = 'image/webp';
        } else if (contentType.includes('image/gif')) {
            mimeType = 'image/gif';
        } else {
            // Intentar detectar por extensión de URL
            if (imageUrl.toLowerCase().endsWith('.png')) {
                mimeType = 'image/png';
            } else if (imageUrl.toLowerCase().endsWith('.webp')) {
                mimeType = 'image/webp';
            } else if (imageUrl.toLowerCase().endsWith('.gif')) {
                mimeType = 'image/gif';
            }
        }
        
        const arrayBuffer = await response.arrayBuffer();
        // Convertir ArrayBuffer a Buffer y luego a base64
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        
        return { base64, mimeType };
    } catch (error: any) {
        console.error('Error fetching image:', error);
        throw new Error(`Error al obtener la imagen: ${error.message}`);
    }
}
