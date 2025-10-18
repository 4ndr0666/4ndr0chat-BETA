
import { ChatMessage, DisplayPart, Author } from '../types';
import { extractGraphDataFromText } from './geminiService';

export interface GraphNode {
    id: string;
    label: string;
    type: 'user' | 'ai' | 'concept' | 'system' | 'summary';
    messageId?: string;
    size: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    fixed?: boolean;
    // Fix: Add fx and fy for d3-force simulation fixed nodes.
    fx?: number | null;
    fy?: number | null;
    weight: number;
    sentiment: number;
    summaryText?: string;
}

export interface GraphLink {
    // Fix: Allow source and target to be a string (ID) or a GraphNode object,
    // which is what d3-force simulation does after initialization.
    source: string | GraphNode;
    target: string | GraphNode;
    weight: number;
}

export interface CognitiveGraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

const extractText = (parts: DisplayPart[]): string => {
    return parts.filter(p => 'text' in p).map(p => (p as {text: string}).text).join(' ');
}

export const processMessagesForGraph = async (messages: ChatMessage[]): Promise<CognitiveGraphData> => {
    const nodes: Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy'>[] = [];
    const links: GraphLink[] = [];
    const conceptMap = new Map<string, Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy'>>();
    
    for (const message of messages) {
        if (message.id === 'ai-initial-greeting') continue;

        const messageNode = {
            id: message.id,
            label: message.author,
            type: message.author,
            size: 10,
            weight: 0.5,
            sentiment: 0,
        };
        nodes.push(messageNode);
        
        const text = extractText(message.parts);
        if (!text) continue;

        const graphData = await extractGraphDataFromText(text);

        graphData.concepts.forEach(concept => {
            const conceptId = `concept-${concept.name.toLowerCase().replace(/\s/g, '-')}`;
            if (!conceptMap.has(conceptId)) {
                const conceptNode = {
                    id: conceptId,
                    label: concept.name.toLowerCase(),
                    type: 'concept' as const,
                    size: 6,
                    weight: concept.weight,
                    sentiment: concept.sentiment,
                };
                nodes.push(conceptNode);
                conceptMap.set(conceptId, conceptNode);
            }
            links.push({ source: message.id, target: conceptId, weight: concept.weight });
        });

        graphData.relationships?.forEach(rel => {
            const sourceId = `concept-${rel.source.toLowerCase().replace(/\s/g, '-')}`;
            const targetId = `concept-${rel.target.toLowerCase().replace(/\s/g, '-')}`;
            if(conceptMap.has(sourceId) && conceptMap.has(targetId)) {
                links.push({
                    source: sourceId,
                    target: targetId,
                    weight: rel.weight,
                });
            }
        });
    }
    
    // Deduplicate nodes and links
    const uniqueNodes = Array.from(new Map(nodes.map(n => [n.id, n])).values());
    const uniqueLinks = Array.from(new Map(links.map(l => [`${l.source}-${l.target}`, l])).values());

    return { nodes: uniqueNodes as GraphNode[], links: uniqueLinks };
};
