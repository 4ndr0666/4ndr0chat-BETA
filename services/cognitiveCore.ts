

// Fix: The 'd3-force' module does not export 'GraphNode'. The correct type for simulation nodes is 'SimulationNodeDatum'.
import { SimulationNodeDatum as D3GraphNode } from 'd3-force';

export interface GraphNode extends D3GraphNode {
    id: string;
    label: string;
    type: 'user' | 'ai' | 'concept' | 'system' | 'summary';
    messageId?: string;
    size: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fixed?: boolean;
    fx?: number | null;
    fy?: number | null;
    weight: number;
    sentiment: number;
    summaryText?: string;
}

export interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    weight: number;
}

export interface CognitiveGraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}