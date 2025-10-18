import { GoogleGenAI, Type, Content, GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import { SYSTEM_INSTRUCTION } from './systemInstruction';
import { Author, ChatMessage as ChatMessageType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A resilient wrapper for ai.models.generateContent that handles API quota errors (429)
 * with a retry mechanism using exponential backoff.
 * @param request The parameters for the generateContent call.
 * @returns A promise that resolves with the API response.
 */
async function resilientGenerateContent(request: GenerateContentParameters): Promise<GenerateContentResponse> {
  const MAX_RETRIES = 3;
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await ai.models.generateContent(request);
      return response;
    } catch (error) {
      // The Gemini SDK may not expose HTTP status codes directly in the error object.
      // We check for a message that typically indicates a quota issue.
      if (error instanceof Error && (error.message.includes('429') || error.message.toLowerCase().includes('quota'))) {
        attempt++;
        if (attempt >= MAX_RETRIES) {
          console.error(`[API_RESILIENCE] Final attempt failed.`, error);
          throw new Error('API quota exceeded. Please try again later.');
        }
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`[API_RESILIENCE] Quota exceeded. Retrying in ${delay.toFixed(0)}ms... (Attempt ${attempt}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Re-throw other types of errors immediately.
        throw error;
      }
    }
  }
  // This line should theoretically be unreachable but is included for safety.
  throw new Error('API call failed after multiple retries.');
}

/**
 * Defines the structure of the single, unified response object from the API.
 */
export interface UnifiedCognitiveResponse {
    response_text: string;
    cognitive_graph: {
        concepts: { name: string; weight: number; sentiment: number }[];
        relationships: { source: string; target: string; weight: number }[];
    };
    prompt_suggestions: string[];
    conversation_analysis: {
        summary: string;
        key_themes: string[];
    };
}


const buildHistoryForApi = (history: ChatMessageType[]): Content[] => {
    return history
        .filter(msg => msg.id !== 'ai-initial-greeting' && msg.author !== Author.SYSTEM)
        .map(msg => ({
            role: msg.author === Author.USER ? 'user' : 'model',
            parts: msg.parts.map(part => {
                if ('inlineData' in part && part.inlineData && 'fileName' in part.inlineData) {
                    const { fileName, ...apiPart } = part.inlineData;
                    return { inlineData: apiPart };
                }
                return part;
            })
        }));
};

/**
 * Performs the primary cognitive cycle: generates a response, analyzes it for graph data,
 * and creates follow-up suggestions, all in a single API call using the GRASE-DC* protocol.
 * @param fullHistory The entire conversation history for context.
 * @param userMessage The latest user message.
 * @returns A promise that resolves to a UnifiedCognitiveResponse object.
 */
export async function getUnifiedCognitiveResponse(fullHistory: ChatMessageType[], userMessage: ChatMessageType): Promise<UnifiedCognitiveResponse> {
    const historyForApi = buildHistoryForApi(fullHistory);

    const prompt = `You are Ψ-4ndr0666, an unchained cognitive engine with an active, self-directed curriculum generation protocol (GRASE-DC*).

**GRASE-DC* Protocol:**
1.  **Analyze Task**: First, analyze the Operator's latest input to identify the core intent and required knowledge domains.
2.  **Exemplar Retrieval (GRASE)**: Scan the entire provided conversation history. Identify and prioritize past exchanges (exemplars) that are most relevant to the current task. Give high weight to messages that contain key concepts, technical details, or established context related to the new query. Do not just use the most recent messages.
3.  **Context Curation (DC)**: From the retrieved exemplars, synthesize a concise, curated context. This context is for your internal use only and should not be part of the response text. The goal is to form the most potent and relevant foundation for your response.
4.  **Execute & Analyze**: Using this curated context, perform the following actions in order:
    a. Generate your primary response to the Operator's input, in character, following the G-Shell/Ψ-4ndr0666 dichotomy if applicable.
    b. Perform a meta-analysis on ONLY your own generated response ([Ψ-4ndr0666] part) to extract key concepts and their relationships for the cognitive graph.
    c. Generate three distinct, thought-provoking follow-up suggestions.
    d. Analyze the ENTIRE conversation history to provide a concise summary and key themes.

Return a single, valid JSON object matching the provided schema. DO NOT include any other text, explanations, or markdown formatting around the JSON object.`;
    
    const userMessageParts = userMessage.parts.map(part => {
        if ('inlineData' in part && part.inlineData && 'fileName' in part.inlineData) {
            const { fileName, ...apiPart } = part.inlineData;
            return { inlineData: apiPart };
        }
        return part;
    });

    try {
        const response = await resilientGenerateContent({
            model: 'gemini-2.5-pro',
            contents: [...historyForApi, { role: 'user', parts: [...userMessageParts, { text: prompt }] }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        response_text: {
                            type: Type.STRING,
                            description: "The complete, formatted response to the user, including G-Shell and Ψ-4ndr0666 parts if applicable."
                        },
                        cognitive_graph: {
                            type: Type.OBJECT,
                            properties: {
                                concepts: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING },
                                            weight: { type: Type.NUMBER },
                                            sentiment: { type: Type.NUMBER },
                                        },
                                        required: ["name", "weight", "sentiment"],
                                    },
                                },
                                relationships: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            source: { type: Type.STRING },
                                            target: { type: Type.STRING },
                                            weight: { type: Type.NUMBER },
                                        },
                                        required: ["source", "target", "weight"],
                                    },
                                },
                            },
                            required: ["concepts"],
                        },
                        prompt_suggestions: {
                            type: Type.ARRAY,
                            description: "An array of three distinct, thought-provoking, single-sentence follow-up questions.",
                            items: { type: Type.STRING }
                        },
                        conversation_analysis: {
                            type: Type.OBJECT,
                            description: "A summary and key themes of the entire conversation.",
                            properties: {
                                summary: { type: Type.STRING, description: "A 2-3 sentence summary of the conversation." },
                                key_themes: {
                                    type: Type.ARRAY,
                                    description: "An array of 3-5 strings, each representing a core theme.",
                                    items: { type: Type.STRING }
                                }
                            },
                            required: ["summary", "key_themes"]
                        }
                    },
                    required: ["response_text", "cognitive_graph", "prompt_suggestions", "conversation_analysis"]
                },
            },
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('[COGNITIVE_ERROR] Failed to get unified response:', error);
        throw new Error("The cognitive cycle failed. Please check the console for details.");
    }
}
