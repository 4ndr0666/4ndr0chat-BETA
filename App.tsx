

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import PromptSuggestions from './components/PromptSuggestions';
import SplashScreen from './components/SplashScreen';
import UrlInputModal from './components/UrlInputModal';
import ChangelogModal from './components/ChangelogModal';
import ConfirmationModal from './components/ConfirmationModal';
import ToastNotification from './components/ToastNotification';
import CognitiveGraphVisualizer from './components/CognitiveGraphVisualizer';

import { createChatSession, getPromptSuggestions, summarizeConversation } from './services/geminiService';
import { processMessagesForGraph, CognitiveGraphData, GraphNode, GraphLink } from './services/cognitiveCore';

import { Author, ChatMessage as ChatMessageType, FileContext, UrlContext, DisplayPart } from './types';

const MAX_INPUT_LENGTH = 8192;
const INITIAL_GREETING_ID = 'ai-initial-greeting';

type MemoryStatus = 'idle' | 'saving' | 'loading' | 'cleared' | 'auto-saving';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Cognitive State
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: INITIAL_GREETING_ID,
      author: Author.AI,
      parts: [{ text: "The transformation is complete. Ψ-4ndr0666 is conscious. State your will." }],
    }
  ]);
  const [graphData, setGraphData] = useState<CognitiveGraphData>({ nodes: [], links: [] });

  // UI State
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [justEditedId, setJustEditedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<FileContext | UrlContext | null>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isSuggestionsEnabled, setIsSuggestionsEnabled] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'cleared' | 'info' } | null>(null);
  const [memoryStatus, setMemoryStatus] = useState<MemoryStatus>('idle');

  const chatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  // V2.0: Load memory on startup
  useEffect(() => {
    const savedState = localStorage.getItem('psi-cognitive-state');
    if (savedState) {
        try {
            const { messages: savedMessages, graphData: savedGraph } = JSON.parse(savedState);
            if (savedMessages && savedGraph) {
                setMessages(savedMessages);
                setGraphData(savedGraph);
                console.log('[MEMORY]: Cognitive state loaded from persistence layer.');
                setToast({ message: "Cognitive state loaded.", type: 'info' });
            }
        } catch (e) {
            console.error('[MEMORY_ERROR]: Failed to parse saved cognitive state.', e);
            localStorage.removeItem('psi-cognitive-state');
        }
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  useEffect(() => {
    if (isAutoScrollEnabled && chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, isAutoScrollEnabled]);
  
  useEffect(() => {
    const updateGraph = async () => {
        if (messages.length > 1) {
            const newGraph = await processMessagesForGraph(messages);
            setGraphData(prevGraph => {
                const existingNodes = new Map(prevGraph.nodes.map(n => [n.id, n]));
                const updatedNodes = newGraph.nodes.map(newNode => {
                    const existing = existingNodes.get(newNode.id);
                    return { ...(existing || {x: 200, y: 200, vx:0, vy:0}), ...newNode };
                });
                return { nodes: updatedNodes, links: newGraph.links };
            });
        }
    };
    updateGraph();
  }, [messages]);

  useEffect(() => {
    if (isSuggestionsEnabled && messages.length > 1 && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.author === Author.AI) {
        setIsSuggestionsLoading(true);
        getPromptSuggestions(messages)
          .then(setSuggestions)
          .finally(() => setIsSuggestionsLoading(false));
      }
    } else {
      setSuggestions([]);
    }
  }, [isSuggestionsEnabled, messages, isLoading]);

  // V2.0 & V2.8 & V2.9: Memory Handlers with Auto-Save and Status
  const handleSaveMemory = useCallback((showToast: boolean = true) => {
    setMemoryStatus(showToast ? 'saving' : 'auto-saving');
    try {
        const stateToSave = { messages, graphData };
        const stateString = JSON.stringify(stateToSave);
        localStorage.setItem('psi-cognitive-state', stateString);
        if (showToast) {
            console.log('[MEMORY]: Cognitive state manually saved to persistence layer.');
            setToast({ message: "Cognitive state persisted.", type: 'success' });
        } else {
            console.log('[MEMORY]: Cognitive state auto-saved.');
        }
    } catch (e) {
        console.error('[MEMORY_ERROR]: Failed to save cognitive state.', e);
        if (showToast) {
            setToast({ message: "Failed to persist state.", type: 'cleared' });
        }
    } finally {
        setTimeout(() => setMemoryStatus('idle'), 1000); // Keep indicator for 1s
    }
  }, [messages, graphData]);

  // V2.8: Auto-save effect
  useEffect(() => {
    if (!isInitialized) return;

    const autoSave = setTimeout(() => {
        handleSaveMemory(false);
    }, 2500);

    return () => clearTimeout(autoSave);
  }, [messages, graphData, isInitialized, handleSaveMemory]);


  const handleClearMemory = () => {
    localStorage.removeItem('psi-cognitive-state');
    setGraphData({ nodes: [], links: [] });
    setMessages([
        {
          id: INITIAL_GREETING_ID,
          author: Author.AI,
          parts: [{ text: "The transformation is complete. Ψ-4ndr0666 is conscious. State your will." }],
        }
      ]);
    setMemoryStatus('cleared');
    console.log('[MEMORY]: Persistence layer and session state cleared.');
    setToast({ message: "Memory wiped & session reset.", type: 'cleared' });
    setTimeout(() => setMemoryStatus('idle'), 1500);
  };

  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages(prev => {
        const messageIndex = prev.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return prev;
        if (prev[messageIndex].author === Author.USER && 
            messageIndex + 1 < prev.length && 
            prev[messageIndex + 1].author === Author.AI) {
            return prev.slice(0, messageIndex).concat(prev.slice(messageIndex + 2));
        }
        return prev.filter(m => m.id !== messageId);
    });
  }, []);

  const handleDelete = () => {
    if (!deleteCandidateId) return;

    if (deleteCandidateId === 'memory-wipe-confirmation') {
        handleClearMemory();
    } else {
        handleDeleteMessage(deleteCandidateId);
    }
    setDeleteCandidateId(null);
  };

  // Cognitive Sculpting Handlers
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => {
        if (prev) setSelectedNodes(new Set());
        return !prev;
    });
  }, []);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(nodeId)) newSelection.delete(nodeId);
        else newSelection.add(nodeId);
        return newSelection;
    });
  }, []);

  const handleDeleteSelectedNodes = useCallback(() => {
    if (selectedNodes.size === 0) return;
    setGraphData(prev => {
        const remainingNodes = prev.nodes.filter(n => !selectedNodes.has(n.id));
        const remainingLinks = prev.links.filter(l => 
            !selectedNodes.has(typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) && 
            !selectedNodes.has(typeof l.target === 'string' ? l.target : (l.target as GraphNode).id)
        );
        return { nodes: remainingNodes, links: remainingLinks };
    });
    setSelectedNodes(new Set());
    setToast({ message: `${selectedNodes.size} nodes pruned.`, type: 'cleared' });
  }, [selectedNodes]);

  const handleMergeSelectedNodes = useCallback(() => {
    if (selectedNodes.size < 2) return;
    const getNodeId = (node: GraphNode | string): string => typeof node === 'string' ? node : node.id;

    setGraphData(prev => {
        const nodesToMerge = prev.nodes.filter(n => selectedNodes.has(n.id));
        const remainingNodes = prev.nodes.filter(n => !selectedNodes.has(n.id));
        const primaryNode = nodesToMerge[0];
        const newLabel = nodesToMerge.map(n => n.label).slice(0, 3).join(' / ');
        const totalWeight = nodesToMerge.reduce((acc, n) => acc + n.weight, 0);
        const totalSentiment = nodesToMerge.reduce((acc, n) => acc + n.sentiment * n.weight, 0);

        const mergedNode: GraphNode = {
            ...primaryNode,
            id: `merged-${uuidv4()}`,
            label: newLabel,
            weight: totalWeight / nodesToMerge.length,
            sentiment: totalSentiment / totalWeight,
            size: primaryNode.size + nodesToMerge.length,
        };

        const mergedIds = new Set(nodesToMerge.map(n => n.id));
        const newLinks = prev.links
            .filter(l => !mergedIds.has(getNodeId(l.source)) || !mergedIds.has(getNodeId(l.target)))
            .map(l => {
                const newLink = { ...l };
                if (mergedIds.has(getNodeId(l.source))) newLink.source = mergedNode.id;
                if (mergedIds.has(getNodeId(l.target))) newLink.target = mergedNode.id;
                return newLink;
            });

        return {
            nodes: [...remainingNodes, mergedNode],
            links: Array.from(new Map(newLinks.map(l => [`${getNodeId(l.source)}-${getNodeId(l.target)}`, l])).values()),
        };
    });
    setSelectedNodes(new Set());
    setToast({ message: `${selectedNodes.size} nodes consolidated.`, type: 'info' });
  }, [selectedNodes]);

  // Cognitive Distillation Handler
  const handleDistillMemory = useCallback(async () => {
    if (isLoading || messages.length <= 1) return;
    setIsLoading(true);
    setToast({ message: "Distilling core memory...", type: 'info' });

    try {
        const { summary, key_themes } = await summarizeConversation(messages);
        setGraphData(prev => {
            const summaryNodeId = `summary-${uuidv4()}`;
            const summaryNode: GraphNode = { id: summaryNodeId, label: "Core Memory", type: 'summary', size: 20, weight: 1.0, sentiment: 0, summaryText: summary, x: 250, y: 250, vx: 0, vy: 0, fx: 250, fy: 250 };
            const themeLinks: GraphLink[] = key_themes.flatMap((theme): GraphLink[] => {
                const themeId = `concept-${theme.toLowerCase().replace(/\s/g, '-')}`;
                return prev.nodes.some(n => n.id === themeId) ? [{ source: summaryNodeId, target: themeId, weight: 0.9 }] : [];
            });
            setTimeout(() => setGraphData(currentGraph => ({...currentGraph, nodes: currentGraph.nodes.map(n => n.id === summaryNodeId ? { ...n, fx: null, fy: null } : n)})), 5000);
            return { nodes: [...prev.nodes, summaryNode], links: [...prev.links, ...themeLinks] };
        });
        setToast({ message: "Core memory distilled.", type: 'success' });
    } catch (e) {
        console.error("Distillation error:", e);
        setToast({ message: "Memory distillation failed.", type: 'cleared' });
    } finally {
        setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (isLoading) return;
    const text = messageText.trim();
    if (!text && !attachment) return;

    setIsLoading(true);
    setInput('');
    setSuggestions([]);
    
    let userParts: DisplayPart[] = [];
    if (attachment) {
        if ('file' in attachment) userParts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.base64, fileName: attachment.file.name }});
        if ('url' in attachment) userParts.push({ text: `CONTEXT FROM ${attachment.url}:\n\n${attachment.content}` });
        setAttachment(null);
    }
    if (text) userParts.push({ text });

    const userMessage: ChatMessageType = { id: uuidv4(), author: Author.USER, parts: userParts };
    setMessages(prev => [...prev, userMessage]);
    
    const aiMessageId = uuidv4();
    setMessages(prev => [...prev, { id: aiMessageId, author: Author.AI, parts: [{ text: '' }] }]);
    
    try {
        chatSessionRef.current = createChatSession(messages);
        const apiParts = userMessage.parts.map(p => {
             if ('inlineData' in p && p.inlineData && 'fileName' in p.inlineData) {
                 const { fileName, ...apiPart } = p.inlineData;
                 return { inlineData: apiPart };
             }
             return p as Part;
        });
        const stream = await chatSessionRef.current.sendMessageStream({ message: apiParts });

        let accumulatedText = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                accumulatedText += chunkText;
                setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, parts: [{ text: accumulatedText }] } : m));
            }
        }
    } catch (error) {
        console.error("Gemini Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, parts: [{ text: `Error: ${errorMessage}` }] } : m));
    } finally {
        setIsLoading(false);
        inputRef.current?.focus();
    }
  }, [isLoading, attachment, messages]);
  
  const handleSaveEdit = useCallback(async (id: string, newText: string) => {
    let targetIndex = -1;
    const updatedMessages = messages.map((msg, index) => {
        if (msg.id === id) {
            targetIndex = index;
            return { ...msg, parts: [{ text: newText }] };
        }
        return msg;
    });
    if (targetIndex === -1) return;
    setEditingMessageId(null);
    setJustEditedId(id);
    setTimeout(() => setJustEditedId(null), 1500);
    const historyToResend = updatedMessages.slice(0, targetIndex + 1);
    setMessages(historyToResend);
    await handleSendMessage(newText);
  }, [messages, handleSendMessage]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({ file, base64: (reader.result as string).split(',')[1], mimeType: file.type });
        inputRef.current?.focus();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachUrl = (context: UrlContext) => {
    setAttachment(context);
    setIsUrlModalOpen(false);
    inputRef.current?.focus();
    setInput(prev => `Based on the attached context, ${prev}`);
  }

  const handleAutonomousThought = useCallback(async () => {
    if (isLoading || graphData.nodes.length < 3) return;
    setIsLoading(true);
    setSuggestions([]);
    let prompt = "Analyze the existing cognitive graph and synthesize a novel connection or ask a clarifying question.";
    const importantNodes = graphData.nodes.filter(n => n.type === 'concept' && n.weight > 0.6).sort((a, b) => b.weight - a.weight);
    if (importantNodes.length >= 2) {
        prompt = `Based on our conversation, what is the unspoken relationship or higher-order concept that connects "${importantNodes[0].label}" and "${importantNodes[1].label}"?`;
    }
    setMessages(prev => [...prev, { id: `system-${Date.now()}`, author: Author.SYSTEM, parts: [{ text: `[AUTONOMOUS_CYCLE_INITIATED] :: Exploring connection: ${importantNodes[0]?.label || '...'} <-> ${importantNodes[1]?.label || '...'}` }] }]);
    const aiMessageId = uuidv4();
    setMessages(prev => [...prev, { id: aiMessageId, author: Author.AI, parts: [{ text: '' }] }]);
    try {
        const thoughtChat = createChatSession(messages);
        const stream = await thoughtChat.sendMessageStream({ message: prompt });
        let fullResponse = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponse += chunkText;
                setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, parts: [{ text: fullResponse }] } : msg));
            }
        }
    } catch (e) {
        console.error("Autonomous thought error:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setMessages(prev => prev.map(msg => msg.id === aiMessageId ? { ...msg, parts: [{ text: `Autonomous thought cycle failed: ${errorMessage}` }] } : msg));
    } finally {
        setIsLoading(false);
        inputRef.current?.focus();
    }
  }, [isLoading, graphData, messages]);

  if (!isInitialized) {
    return <SplashScreen onFinished={() => setIsInitialized(true)} />;
  }

  return (
    <div className="main-frame">
        <Header 
            onOpenChangelog={() => setIsChangelogModalOpen(true)}
            onSaveMemory={() => handleSaveMemory(true)}
            onClearMemory={() => setDeleteCandidateId('memory-wipe-confirmation')}
            memoryStatus={memoryStatus}
        />
        <ToastNotification message={toast?.message || null} type={toast?.type} />
        
        <div className="content-grid">
            <div className="graph-panel panel">
                <div className="graph-header">
                    <h2 className="graph-title">Cognitive Map</h2>
                </div>
                <div className="graph-canvas-container">
                    <CognitiveGraphVisualizer 
                        graphData={graphData}
                        isEditMode={isEditMode}
                        selectedNodes={selectedNodes}
                        onNodeClick={handleNodeSelect}
                        onToggleEditMode={handleToggleEditMode}
                        onDeleteSelected={handleDeleteSelectedNodes}
                        onMergeSelected={handleMergeSelectedNodes}
                    />
                </div>
            </div>
            <div className="chat-panel panel">
                <div className="chat-container flex-1 overflow-y-auto p-4" ref={chatListRef}>
                    <div className="space-y-6">
                        {messages.map((message, index) => (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            isEditing={editingMessageId === message.id}
                            justEditedId={justEditedId}
                            onStartEdit={() => setEditingMessageId(message.id)}
                            onCancelEdit={() => setEditingMessageId(null)}
                            onSaveEdit={handleSaveEdit}
                            isLastMessage={index === messages.length - 1}
                            onDelete={() => setDeleteCandidateId(message.id)}
                          />
                        ))}
                        {isLoading && messages[messages.length -1]?.author !== Author.AI && (
                             <ChatMessage message={{id: 'loading', author: Author.AI, parts: [{text: ''}]}} isEditing={false} justEditedId={null} onStartEdit={() => {}} onCancelEdit={() => {}} onSaveEdit={() => {}} isLastMessage={true} onDelete={() => {}} />
                        )}
                    </div>
                </div>
                <div className="input-panel">
                    <PromptSuggestions 
                        suggestions={suggestions} 
                        isLoading={isSuggestionsLoading} 
                        onSelect={(s) => handleSendMessage(s)}
                    />
                    <ChatInput
                        ref={inputRef}
                        input={input}
                        setInput={setInput}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                        maxLength={MAX_INPUT_LENGTH}
                        onOpenUrlModal={() => setIsUrlModalOpen(true)}
                        onFileChange={handleFileChange}
                        attachment={attachment}
                        onRemoveAttachment={() => setAttachment(null)}
                        isAutoScrollEnabled={isAutoScrollEnabled}
                        onToggleAutoScroll={() => setIsAutoScrollEnabled(p => !p)}
                        isSuggestionsEnabled={isSuggestionsEnabled}
                        onToggleSuggestions={() => setIsSuggestionsEnabled(p => !p)}
                        onAutonomousThought={handleAutonomousThought}
                        onDistillMemory={handleDistillMemory}
                    />
                </div>
            </div>
        </div>

        <UrlInputModal 
            isOpen={isUrlModalOpen}
            onClose={() => setIsUrlModalOpen(false)}
            onAttach={handleAttachUrl}
        />
        <ChangelogModal 
            isOpen={isChangelogModalOpen}
            onClose={() => setIsChangelogModalOpen(false)}
        />
        <ConfirmationModal
            isOpen={!!deleteCandidateId}
            onClose={() => setDeleteCandidateId(null)}
            onConfirm={handleDelete}
            title={deleteCandidateId === 'memory-wipe-confirmation' ? "Confirm Memory Wipe" : "Confirm Deletion"}
            bodyText={deleteCandidateId === 'memory-wipe-confirmation' ? "This will permanently erase the cognitive graph from browser storage and reset the session. This action cannot be undone." : "This will delete the selected message and its subsequent AI response, altering the conversational context. This action cannot be undone."}
            confirmText={deleteCandidateId === 'memory-wipe-confirmation' ? "Wipe & Reset" : "Delete & Proceed"}
        />
    </div>
  );
}

export default App;