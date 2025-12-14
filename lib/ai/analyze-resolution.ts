/**
 * OpenAI Chat Resolution Analysis
 * Analyzes conductor messages to detect if issue is resolved
 */

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
    sender: 'user' | 'agent' | 'system';
    text: string;
    timestamp: Date;
}

export interface ResolutionAnalysis {
    isResolved: boolean;
    confidence: number; // 0.0 to 1.0
    reasoning: string;
}

const ANALYSIS_PROMPT = `Eres un asistente que analiza conversaciones de chat para detectar si un problema de entrega ha sido resuelto.

Analiza el mensaje del conductor y el contexto de la conversación para determinar si el problema está resuelto.

Indicadores de resolución:
- "Ya me lo recibieron"
- "Todo quedó bien"
- "Sí aceptaron"
- "Ya está resuelto"
- "No hay problema"

Indicadores de NO resolución:
- "Todavía no me reciben"
- "No quieren aceptar"
- "Sigue el problema"
- Preguntas sin respuesta clara

Responde SOLO con JSON válido:
{
  "isResolved": boolean,
  "confidence": number entre 0.0 y 1.0,
  "reasoning": "breve explicación de 1-2 oraciones"
}

IMPORTANTE: 
- Solo marca isResolved=true si la confianza es >= 0.7
- Si hay dudas, marca como no resuelto
- No inventes información`;

/**
 * Analyze if a chat message indicates resolution
 */
export async function analyzeChatResolution(
    message: string,
    context: {
        tipoReporte: string;
        motivo?: string;
        chatHistory: ChatMessage[];
    }
): Promise<ResolutionAnalysis> {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: ANALYSIS_PROMPT,
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        tipoReporte: context.tipoReporte,
                        motivo: context.motivo,
                        chatHistory: context.chatHistory.slice(-5).map((msg) => ({
                            sender: msg.sender,
                            text: msg.text,
                        })),
                        newMessage: message,
                    }),
                },
            ],
            temperature: 0.1,
            max_tokens: 200,
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No content in OpenAI response');
        }

        const analysis = JSON.parse(content);

        // Safety check: never mark as resolved with low confidence
        if (analysis.confidence < 0.7) {
            analysis.isResolved = false;
        }

        return {
            isResolved: analysis.isResolved || false,
            confidence: analysis.confidence || 0.0,
            reasoning: analysis.reasoning || 'Sin análisis',
        };
    } catch (error) {
        console.error('Error analyzing chat resolution:', error);

        // On error, assume not resolved
        return {
            isResolved: false,
            confidence: 0.0,
            reasoning: 'Error al analizar el mensaje',
        };
    }
}
