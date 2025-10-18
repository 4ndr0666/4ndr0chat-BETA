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

// Fix: Add Session type definition to resolve import error in SessionManager.tsx
export interface Session {
  id: string;
  name: string;
}
