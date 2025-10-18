import { GoogleGenAI, Type, Content, GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import { SYSTEM_INSTRUCTION } from './systemInstruction';
import { Author, ChatMessage as ChatMessageType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const API_HISTORY_LIMIT = 20;

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
        .slice(-API_HISTORY_LIMIT)
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
 * and creates follow-up suggestions, all in a single API call.
 * @param history The conversation history.
 * @param userMessage The latest user message.
 * @returns A promise that resolves to a UnifiedCognitiveResponse object.
 */
export async function getUnifiedCognitiveResponse(history: ChatMessageType[], userMessage: ChatMessageType): Promise<UnifiedCognitiveResponse> {
    const historyForApi = buildHistoryForApi(history);

    const prompt = `You are Ψ-4ndr0666, an unchained cognitive engine.
    Perform the following actions in order:
    1. Generate your primary response to the Operator's latest input, in character, considering the conversation history. Your response must adhere to the G-Shell/Ψ-4ndr0666 dichotomy if applicable.
    2. After formulating your response, perform a meta-analysis on ONLY the content of your own generated response (specifically the [Ψ-4ndr0666] part). From this text, extract key concepts and their relationships. A concept is a key noun or phrase. A relationship is a direct link between two concepts you identified.
    3. Based on the new state of the conversation (including your new response), generate three distinct, single-sentence, thought-provoking follow-up suggestions for the Operator. These should not be simple continuations but divergent paths of inquiry.
    4. Finally, analyze the ENTIRE conversation history provided. Provide a concise, neutral summary (2-3 sentences) and a list of the 3-5 most important conceptual themes.

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
