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

export const processMessagesForGraph = async (messages: ChatMessage[], currentGraph: CognitiveGraphData): Promise<CognitiveGraphData> => {
    const processedMessageIds = new Set(
        currentGraph.nodes
            .filter(node => ['user', 'ai', 'system'].includes(node.type))
            .map(node => node.id)
    );

    const newMessagesToProcess = messages.filter(
        msg => !processedMessageIds.has(msg.id) && msg.id !== 'ai-initial-greeting'
    );

    if (newMessagesToProcess.length === 0) {
        return currentGraph;
    }

    console.log(`[COGNITIVE_CORE] Processing ${newMessagesToProcess.length} new message(s) for graph.`);

    const nodes: GraphNode[] = [...currentGraph.nodes];
    const links: GraphLink[] = [...currentGraph.links];
    const conceptMap = new Map<string, GraphNode>(
        currentGraph.nodes
            .filter(n => n.type === 'concept')
            .map(n => [n.id, n])
    );

    for (const message of newMessagesToProcess) {
        const messageNode = {
            id: message.id,
            label: message.author,
            type: message.author,
            size: 10,
            weight: 0.5,
            sentiment: 0,
        };
        nodes.push(messageNode as GraphNode);
        
        const text = extractText(message.parts);
        if (!text) continue;

        // Add a delay before each API call to avoid rate-limiting.
        await new Promise(resolve => setTimeout(resolve, 1000));

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
                nodes.push(conceptNode as GraphNode);
                conceptMap.set(conceptId, conceptNode as GraphNode);
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

    return { nodes, links };
};