/**
 * Claude Chat Resolution Analysis
 * Analyzes conductor messages to detect if a delivery issue is resolved
 */

import Anthropic from '@anthropic-ai/sdk';

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

const ANALYSIS_SYSTEM_PROMPT = `Eres un asistente que analiza conversaciones de chat para detectar si un problema de entrega ha sido resuelto.

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
  "confidence": número entre 0.0 y 1.0,
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
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY no está configurada');
        return { isResolved: false, confidence: 0.0, reasoning: 'Error de configuración' };
    }

    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 200,
            system: ANALYSIS_SYSTEM_PROMPT,
            messages: [
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
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        if (!content) throw new Error('No content in Claude response');

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
        return {
            isResolved: false,
            confidence: 0.0,
            reasoning: 'Error al analizar el mensaje',
        };
    }
}
