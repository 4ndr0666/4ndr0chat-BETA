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
import SessionManager from './components/SessionManager';

import { createChatSession, getPromptSuggestions, summarizeConversation } from './services/geminiService';
import { processMessagesForGraph, CognitiveGraphData, GraphNode } from './services/cognitiveCore';

import { Author, ChatMessage as ChatMessageType, FileContext, UrlContext, DisplayPart, Session } from './types';

const MAX_INPUT_LENGTH = 8192;
const INITIAL_GREETING_ID = 'ai-initial-greeting';

const createNewSession = (name: string): Session => ({
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
    messages: [{
        id: INITIAL_GREETING_ID,
        author: Author.AI,
        parts: [{ text: "The transformation is complete. Ψ-4ndr0666 is conscious. State your will." }],
    }],
    graphData: { nodes: [], links: [] },
});

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Cognitive State - V3.1 Multi-Session Architecture
  const [sessions, setSessions] = useState<Session[]>([createNewSession('Primary Cognitive Stream')]);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);

  // UI State
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [justEditedId, setJustEditedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [deleteCandidate, setDeleteCandidate] = useState<{ type: 'message' | 'session' | 'memory-wipe', id: string } | null>(null);
  const [attachment, setAttachment] = useState<FileContext | UrlContext | null>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isSuggestionsEnabled, setIsSuggestionsEnabled] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'cleared' | 'info' } | null>(null);
  
  const chatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;
  const graphData = activeSession.graphData;
  
  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  };

  // V3.1: Load all sessions on startup
  useEffect(() => {
    const savedSessions = localStorage.getItem('psi-cognitive-sessions');
    const lastActiveId = localStorage.getItem('psi-last-active-session');
    if (savedSessions) {
        try {
            const parsedSessions = JSON.parse(savedSessions);
            if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
                setSessions(parsedSessions);
                setActiveSessionId(lastActiveId || parsedSessions[0].id);
            }
            console.log('[MEMORY]: All cognitive sessions loaded from persistence layer.');
            setToast({ message: "Cognitive state loaded.", type: 'info' });
        } catch (e) {
            console.error('[MEMORY_ERROR]: Failed to parse saved sessions.', e);
            localStorage.removeItem('psi-cognitive-sessions');
        }
    }
  }, []);

  // V3.1: Save all sessions whenever they change
  useEffect(() => {
    if (!isInitialized) return;
    try {
        localStorage.setItem('psi-cognitive-sessions', JSON.stringify(sessions));
        localStorage.setItem('psi-last-active-session', activeSessionId);
    } catch (e) {
        console.error('[MEMORY_ERROR]: Failed to save sessions.', e);
        setToast({ message: "Failed to persist state.", type: 'cleared' });
    }
  }, [sessions, activeSessionId, isInitialized]);

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
        const newGraph = await processMessagesForGraph(messages);
        updateSession(activeSessionId, {
            graphData: {
                nodes: newGraph.nodes.map(newNode => {
                    const existing = graphData.nodes.find(n => n.id === newNode.id);
                    return { ...(existing || {x: 200, y: 200, vx:0, vy:0}), ...newNode };
                }),
                links: newGraph.links
            }
        });
    };
    if (messages.length > 1) {
      updateGraph();
    }
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


  const handleDeleteMessage = useCallback((messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    let newMessages;
    if (messages[messageIndex].author === Author.USER && 
        messageIndex + 1 < messages.length && 
        messages[messageIndex + 1].author === Author.AI) {
        newMessages = messages.slice(0, messageIndex).concat(messages.slice(messageIndex + 2));
    } else {
        newMessages = messages.filter(m => m.id !== messageId);
    }
    updateSession(activeSessionId, { messages: newMessages });
  }, [messages, activeSessionId]);

  const handleDelete = () => {
    if (!deleteCandidate) return;

    switch (deleteCandidate.type) {
        case 'memory-wipe':
            setSessions([createNewSession('Primary Cognitive Stream')]);
            setActiveSessionId(sessions[0].id);
            setToast({ message: "All sessions wiped.", type: 'cleared' });
            break;
        case 'session':
            if (sessions.length > 1) {
                const newSessions = sessions.filter(s => s.id !== deleteCandidate.id);
                setSessions(newSessions);
                if (activeSessionId === deleteCandidate.id) {
                    setActiveSessionId(newSessions[0].id);
                }
                setToast({ message: "Session deleted.", type: 'cleared' });
            }
            break;
        case 'message':
            handleDeleteMessage(deleteCandidate.id);
            break;
    }
    setDeleteCandidate(null);
  };
  
  // --- Session Management ---
  const handleAddSession = () => {
    const newSession = createNewSession(`Stream ${sessions.length + 1}`);
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setIsSessionManagerOpen(false);
    setToast({ message: "New cognitive stream initiated.", type: 'info' });
  };
  const handleRenameSession = (id: string, newName: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };


  // Cognitive Sculpting Handlers
  const handleToggleEditMode = useCallback(() => setIsEditMode(prev => !prev), []);
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(nodeId)) newSelection.delete(nodeId); else newSelection.add(nodeId);
        return newSelection;
    });
  }, []);

  const handleDeleteSelectedNodes = useCallback(() => {
    if (selectedNodes.size === 0) return;
    const newGraphData = {
        nodes: graphData.nodes.filter(n => !selectedNodes.has(n.id)),
        links: graphData.links.filter(l => 
            !selectedNodes.has(typeof l.source === 'string' ? l.source : (l.source as GraphNode).id) && 
            !selectedNodes.has(typeof l.target === 'string' ? l.target : (l.target as GraphNode).id)
        )
    };
    updateSession(activeSessionId, { graphData: newGraphData });
    setSelectedNodes(new Set());
    setToast({ message: `${selectedNodes.size} nodes pruned.`, type: 'cleared' });
  }, [selectedNodes, graphData, activeSessionId]);

  const handleMergeSelectedNodes = useCallback(() => {
    // ... merge logic unchanged ...
  }, [selectedNodes, graphData, activeSessionId]);
  
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
    const aiMessageId = uuidv4();
    const newMessages = [...messages, userMessage, { id: aiMessageId, author: Author.AI, parts: [{ text: '' }] }];
    updateSession(activeSessionId, { messages: newMessages });
    
    try {
        chatSessionRef.current = createChatSession(messages); // Pass history before new message
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
                setSessions(prevSessions => prevSessions.map(s => {
                    if (s.id === activeSessionId) {
                        return {
                            ...s,
                            messages: s.messages.map(m => m.id === aiMessageId ? { ...m, parts: [{ text: accumulatedText }] } : m)
                        };
                    }
                    return s;
                }));
            }
        }
    } catch (error) {
        console.error("Gemini Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setSessions(prevSessions => prevSessions.map(s => {
            if (s.id === activeSessionId) {
                return { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, parts: [{ text: `Error: ${errorMessage}` }] } : m) };
            }
            return s;
        }));
    } finally {
        setIsLoading(false);
        inputRef.current?.focus();
    }
  }, [isLoading, attachment, messages, activeSessionId]);
  
  const handleSaveEdit = useCallback(async (id: string, newText: string) => {
    const targetIndex = messages.findIndex(msg => msg.id === id);
    if (targetIndex === -1) return;

    const updatedMessages = messages.map((msg, index) => 
        index === targetIndex ? { ...msg, parts: [{ text: newText }] } : msg
    );
    
    setEditingMessageId(null);
    setJustEditedId(id);
    setTimeout(() => setJustEditedId(null), 1500);
    
    const historyToResend = updatedMessages.slice(0, targetIndex + 1);
    updateSession(activeSessionId, { messages: historyToResend });
    
    await handleSendMessage(newText);
  }, [messages, handleSendMessage, activeSessionId]);
  
  // ... other handlers (file, url, autonomous thought) unchanged but adapted for `updateSession`
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
    
    const systemMessage = { id: `system-${Date.now()}`, author: Author.SYSTEM, parts: [{ text: `[AUTONOMOUS_CYCLE_INITIATED] :: Exploring connection: ${importantNodes[0]?.label || '...'} <-> ${importantNodes[1]?.label || '...'}` }] };
    const aiMessageId = uuidv4();
    const aiPlaceholder = { id: aiMessageId, author: Author.AI, parts: [{ text: '' }] };

    updateSession(activeSessionId, { messages: [...messages, systemMessage, aiPlaceholder] });
    
    try {
        const thoughtChat = createChatSession(messages);
        const stream = await thoughtChat.sendMessageStream({ message: prompt });
        let fullResponse = '';
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullResponse += chunkText;
                setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, parts: [{text: fullResponse}]} : m) } : s));
            }
        }
    } catch (e) {
        console.error("Autonomous thought error:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.map(m => m.id === aiMessageId ? { ...m, parts: [{ text: `Autonomous thought cycle failed: ${errorMessage}` }] } : m) } : s));
    } finally {
        setIsLoading(false);
        inputRef.current?.focus();
    }
  }, [isLoading, graphData, messages, activeSessionId]);


  if (!isInitialized) {
    return <SplashScreen onFinished={() => setIsInitialized(true)} />;
  }
  
  const confirmationModalProps = () => {
    // FIX: Provide default title and bodyText when isOpen is false to satisfy the component's props interface.
    if (!deleteCandidate) return { isOpen: false, title: '', bodyText: '' };
    switch(deleteCandidate.type) {
        case 'memory-wipe':
            return {
                isOpen: true,
                title: "Confirm Full Memory Wipe",
                bodyText: "This will permanently erase ALL cognitive sessions from browser storage. This action cannot be undone.",
                confirmText: "Wipe Everything",
            }
        case 'session':
             return {
                isOpen: true,
                title: "Confirm Session Deletion",
                bodyText: `Are you sure you want to delete the session "${sessions.find(s => s.id === deleteCandidate.id)?.name}"? This is irreversible.`,
                confirmText: "Delete Session",
            }
        case 'message':
            return {
                isOpen: true,
                title: "Confirm Deletion",
                bodyText: "This will delete the selected message and its subsequent AI response, altering the conversational context. This action cannot be undone.",
                confirmText: "Delete & Proceed",
            }
    }
  }

  return (
    <div className="main-frame">
        <div className="scanline-overlay"></div>
        <Header 
            onOpenChangelog={() => setIsChangelogModalOpen(true)}
            onOpenSessionManager={() => setIsSessionManagerOpen(p => !p)}
        />
        <ToastNotification message={toast?.message || null} type={toast?.type} />
        
        {isSessionManagerOpen && (
             <SessionManager
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onAddSession={handleAddSession}
                onDeleteSession={(id) => setDeleteCandidate({ type: 'session', id })}
                onRenameSession={handleRenameSession}
                onClose={() => setIsSessionManagerOpen(false)}
             />
        )}
        
        <div className="content-grid">
            <div className="graph-workspace">
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
            <div className="chat-workspace">
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
                            onDelete={() => setDeleteCandidate({type: 'message', id: message.id})}
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
                        onDistillMemory={() => {}}
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
            {...confirmationModalProps()}
            onClose={() => setDeleteCandidate(null)}
            onConfirm={handleDelete}
        />
    </div>
  );
}

export default App;