import { Part } from "@google/genai";
import { CognitiveGraphData } from "./services/cognitiveCore";

export enum Author {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

// Re-exporting the Part type from the SDK for consistency, 
// but we'll add our own fileName for UI purposes.
export type DisplayPart = Part | { inlineData: { mimeType: string; data: string; fileName:string; } };

export interface ChatMessage {
  id: string;
  author: Author;
  parts: DisplayPart[];
}

export interface UrlContext {
  url: string;
  content: string;
}

export interface FileContext {
  file: File;
  base64: string;
  mimeType: string;
}

// RESTORED: Multi-session architecture data contract
export interface Session {
  id: string;
  name: string;
  createdAt: string;
  messages: ChatMessage[];
  graphData: CognitiveGraphData;
  latestAnalysis?: { summary: string; key_themes: string[] };
}