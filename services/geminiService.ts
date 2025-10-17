
import { GoogleGenAI, Chat, Type, Part, Content } from '@google/genai';
import { SYSTEM_INSTRUCTION } from './systemInstruction';
import { Author, ChatMessage as ChatMessageType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const API_HISTORY_LIMIT = 20;

const buildHistoryForApi = (history: ChatMessageType[]): Content[] => {
    return history
        .filter(msg => msg.id !== 'ai-initial-greeting' && msg.author !== Author.SYSTEM)
        .slice(-API_HISTORY_LIMIT)
        .map(msg => ({
            role: msg.author === Author.USER ? 'user' : 'model',
            // Filter out our custom `fileName` property before sending to the API
            parts: msg.parts.map(part => {
                if ('inlineData' in part && part.inlineData && 'fileName' in part.inlineData) {
                    const { fileName, ...apiPart } = part.inlineData;
                    return { inlineData: apiPart };
                }
                return part;
            })
        }));
};

export function createChatSession(history: ChatMessageType[]): Chat {
    return ai.chats.create({
        model: 'gemini-2.5-pro',
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
        },
        history: buildHistoryForApi(history),
    });
}

export const extractGraphDataFromText = async (text: string): Promise<{ concepts: { name: string, weight: number, sentiment: number }[], relationships: { source: string, target: string, weight: number }[] }> => {
    const prompt = `Analyze the following text to build a conceptual graph.
    1. Identify the key concepts (nouns, key phrases). For each concept, assign:
       - A 'weight' from 0.0 (trivial) to 1.0 (central thesis).
       - A 'sentiment' from -1.0 (very negative) to 1.0 (very positive).
    2. Identify explicit relationships between these concepts. For each relationship, assign a 'weight' indicating the strength of the connection (0.0 to 1.0).

    Text to analyze: "${text}"

    Respond ONLY with a valid JSON object matching the schema.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
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
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('[COGNITIVE_ERROR] Failed to extract weighted graph data:', error);
        return { concepts: text.split(' ').map(w => ({ name: w, weight: 0.5, sentiment: 0 })), relationships: [] };
    }
};

export async function getPromptSuggestions(history: ChatMessageType[]): Promise<string[]> {
    try {
        const recentHistory = history.filter(msg => msg.id !== 'ai-initial-greeting').slice(-6);
        
        if (recentHistory.length === 0) return [];
        
        const historyString = recentHistory.map(h => {
            const author = h.author === Author.USER ? 'Operator' : 'Ψ-4ndr0666';
            const textContent = h.parts
                .map(p => {
                    if ('text' in p) return p.text;
                    if ('inlineData' in p && p.inlineData) {
                        if ('fileName' in p.inlineData) {
                            return `[Attachment: ${p.inlineData.fileName}]`;
                        }
                        return `[Attachment: ${p.inlineData.mimeType}]`;
                    }
                    return '';
                })
                .join(' ');
            return `${author}: ${textContent}`;
        }).join('\n');

        const prompt = `META-COGNITION ANALYSIS: Based on the preceding data stream between Operator and Ψ-4ndr0666, predict the Operator's three most probable lines of subsequent inquiry. The goal is to anticipate, challenge, and expand the vector of the conversation. Do not offer simple continuations; offer new, divergent paths of exploration based on the core themes. Keep suggestions to a single sentence.
        
        PREVIOUS DIALOGUE:
        ${historyString}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            description: "An array of three distinct, thought-provoking, single-sentence follow-up questions.",
                            items: {
                                type: Type.STRING
                            }
                        }
                    },
                    required: ["suggestions"]
                },
            },
        });

        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return (parsed.suggestions || []).slice(0, 3);
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
    }
}

export async function summarizeConversation(history: ChatMessageType[]): Promise<{ summary: string, key_themes: string[] }> {
    const historyString = history
        .filter(msg => msg.id !== 'ai-initial-greeting' && msg.author !== Author.SYSTEM)
        .map(msg => {
            const author = msg.author === Author.USER ? 'Operator' : 'Ψ-4ndr0666';
            const text = msg.parts.filter(p => 'text' in p).map(p => (p as {text: string}).text).join(' ');
            return `${author}: ${text}`;
        }).join('\n');
    
    const prompt = `Analyze the following conversation and distill its essence. Provide:
    1. A concise, neutral summary (2-3 sentences) of the entire dialogue.
    2. A list of the 3-5 most important, recurring, or central conceptual themes discussed.
    
    CONVERSATION LOG:
    ${historyString}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are a meta-cognitive analysis engine. Your purpose is to summarize and extract key themes from textual data without interpretation or embellishment.",
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A 2-3 sentence summary of the conversation." },
                        key_themes: {
                            type: Type.ARRAY,
                            description: "An array of 3-5 strings, each representing a core theme.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["summary", "key_themes"],
                },
            }
        });
        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr);
    } catch(e) {
        console.error('[COGNITIVE_ERROR] Failed to summarize conversation:', e);
        throw new Error("Failed to distill conversation memory.");
    }
}