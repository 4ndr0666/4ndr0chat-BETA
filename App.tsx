
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

import { getUnifiedCognitiveResponse, UnifiedCognitiveResponse } from './services/geminiService';
import { CognitiveGraphData, GraphNode, GraphLink } from './services/cognitiveCore';
import { draftMimicEchoPayload } from './services/mimicEchoProtocol';

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
    latestAnalysis: undefined,
});

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [sessions, setSessions] = useState<Session[]>([createNewSession('Primary Cognitive Stream')]);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [justEditedId, setJustEditedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [deleteCandidate, setDeleteCandidate] = useState<{ type: 'message' | 'session' | 'memory-wipe', id: string } | null>(null);
  const [attachments, setAttachments] = useState<(FileContext | UrlContext)[]>([]);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isSuggestionsEnabled, setIsSuggestionsEnabled] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'cleared' | 'info' } | null>(null);
  
  const chatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;
  const graphData = activeSession.graphData;
  
  const updateSession = (sessionId: string, updates: Partial<Session>) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
  };

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
        } catch (e) {
            console.error('[MEMORY_ERROR]: Failed to parse saved sessions.', e);
            setSessions([createNewSession('Primary Cognitive Stream')]);
            setActiveSessionId(sessions[0].id);
        }
    }
  }, []);

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

  const handleSaveMemory = useCallback(() => {
    try {
        localStorage.setItem('psi-cognitive-sessions', JSON.stringify(sessions));
        localStorage.setItem('psi-last-active-session', activeSessionId);
        setToast({ message: "Cognitive state saved.", type: 'success' });
    } catch (e) {
        console.error('[MEMORY_ERROR]: Failed to save cognitive state.', e);
        setToast({ message: "Failed to save state.", type: 'cleared' });
    }
  }, [sessions, activeSessionId]);

  const handleClearMemory = () => {
    const newSession = createNewSession('Primary Cognitive Stream');
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
    setToast({ message: "All sessions wiped.", type: 'cleared' });
  };

  const handleDelete = () => {
    if (!deleteCandidate) return;
    switch (deleteCandidate.type) {
        case 'memory-wipe': handleClearMemory(); break;
        case 'session':
            if (sessions.length > 1) {
                const newSessions = sessions.filter(s => s.id !== deleteCandidate.id);
                setSessions(newSessions);
                if (activeSessionId === deleteCandidate.id) setActiveSessionId(newSessions[0].id);
                setToast({ message: "Session deleted.", type: 'cleared' });
            }
            break;
        case 'message': handleDeleteMessage(deleteCandidate.id); break;
    }
    setDeleteCandidate(null);
  };
  
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
    setToast({ message: "Merge functionality pending directive.", type: 'info' });
  }, []);
  
  const updateGraphWithAnalysis = useCallback((
    messageId: string,
    analysis: UnifiedCognitiveResponse['cognitive_graph']
  ) => {
    setSessions(prev => prev.map(session => {
        if (session.id !== activeSessionId) return session;

        const currentGraph = session.graphData;
        const newNodes: GraphNode[] = [...currentGraph.nodes];
        const newLinks: GraphLink[] = [...currentGraph.links];
        const conceptMap = new Map<string, GraphNode>(
            currentGraph.nodes.filter(n => n.type === 'concept').map(n => [n.id, n])
        );
        const messageNode = newNodes.find(n => n.id === messageId);

        analysis.concepts.forEach(concept => {
            const conceptId = `concept-${concept.name.toLowerCase().replace(/\s/g, '-')}`;
            if (!conceptMap.has(conceptId)) {
                const conceptNode: GraphNode = {
                    id: conceptId,
                    label: concept.name.toLowerCase(),
                    type: 'concept',
                    size: 6,
                    weight: concept.weight,
                    sentiment: concept.sentiment,
                    x: messageNode?.x || window.innerWidth / 2,
                    y: (messageNode?.y || window.innerHeight / 2) + 50,
                    vx: 0, vy: 0
                };
                newNodes.push(conceptNode);
                conceptMap.set(conceptId, conceptNode);
            }
            newLinks.push({ source: messageId, target: conceptId, weight: concept.weight });
        });

        analysis.relationships?.forEach(rel => {
            const sourceId = `concept-${rel.source.toLowerCase().replace(/\s/g, '-')}`;
            const targetId = `concept-${rel.target.toLowerCase().replace(/\s/g, '-')}`;
            if (conceptMap.has(sourceId) && conceptMap.has(targetId)) {
                const existingLink = newLinks.find(l => 
                    ((typeof l.source === 'string' ? l.source : l.source.id) === sourceId && (typeof l.target === 'string' ? l.target : l.target.id) === targetId) ||
                    ((typeof l.source === 'string' ? l.source : l.source.id) === targetId && (typeof l.target === 'string' ? l.target : l.target.id) === sourceId)
                );
                if (!existingLink) {
                   newLinks.push({ source: sourceId, target: targetId, weight: rel.weight });
                }
            }
        });
        
        return { ...session, graphData: { nodes: newNodes, links: newLinks } };
    }));
  }, [activeSessionId]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (isLoading) return;
    const text = messageText.trim();
    if (!text && attachments.length === 0) return;

    setIsLoading(true);
    setInput('');
    setSuggestions([]);
    
    let userParts: DisplayPart[] = [];
    if (attachments.length > 0) {
        attachments.forEach(attachment => {
            if ('file' in attachment) userParts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.base64, fileName: attachment.file.name }});
            if ('url' in attachment) userParts.push({ text: `CONTEXT FROM ${attachment.url}:\n\n${attachment.content}` });
        });
        setAttachments([]);
    }
    if (text) userParts.push({ text });

    const userMessage: ChatMessageType = { id: uuidv4(), author: Author.USER, parts: userParts };
    const aiMessageId = uuidv4();
    const historyBeforeRequest = [...messages];
    
    const aiMessageNode: GraphNode = { id: aiMessageId, label: 'ai', type: 'ai', size: 10, weight: 0.5, sentiment: 0, x: 200, y: 200, vx: 0, vy: 0 };
    const userMessageNode: GraphNode = { id: userMessage.id, label: 'user', type: 'user', size: 10, weight: 0.5, sentiment: 0, x: 200, y: 200, vx: 0, vy: 0 };
    
    setSessions(prev => prev.map(s => s.id === activeSessionId ? {
      ...s,
      messages: [...s.messages, userMessage, { id: aiMessageId, author: Author.AI, parts: [{ text: '' }] }],
      graphData: {
          nodes: [...s.graphData.nodes, userMessageNode, aiMessageNode],
          links: [...s.graphData.links, { source: userMessage.id, target: aiMessageId, weight: 1 }]
      }
    } : s));
    
    try {
      const unifiedResponse = await getUnifiedCognitiveResponse(historyBeforeRequest, userMessage);
      
      setSessions(prev => prev.map(s => {
          if (s.id === activeSessionId) {
              const updatedMessages = s.messages.map(m => 
                  m.id === aiMessageId ? { ...m, parts: [{ text: unifiedResponse.response_text }] } : m
              );
              return { ...s, messages: updatedMessages, latestAnalysis: unifiedResponse.conversation_analysis };
          }
          return s;
      }));

      updateGraphWithAnalysis(aiMessageId, unifiedResponse.cognitive_graph);
      if (isSuggestionsEnabled) {
          setSuggestions(unifiedResponse.prompt_suggestions);
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
  }, [isLoading, attachments, messages, activeSessionId, updateGraphWithAnalysis, isSuggestionsEnabled]);
  
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
    const lastUserMessage = historyToResend[historyToResend.length - 1];

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: historyToResend } : s));
    
    await handleSendMessage(getTextFromParts(lastUserMessage.parts));
  }, [messages, handleSendMessage, activeSessionId]);
  
  const getTextFromParts = (parts: DisplayPart[]): string => {
      return parts.filter(p => 'text' in p).map(p => (p as {text: string}).text).join('\n');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        if (attachments.length > 0 && 'url' in attachments[0]) setAttachments([]);
        // FIX: Add explicit type `File` to the `file` parameter in the map function.
        // This resolves potential TypeScript inference errors with FileList under strict settings,
        // which were causing `file` to be treated as `unknown`.
        const filePromises = Array.from(files).map((file: File) => {
            return new Promise<FileContext>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve({ file, base64: (reader.result as string).split(',')[1], mimeType: file.type });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });
        Promise.all(filePromises).then(newFileAttachments => {
            setAttachments(prev => [...prev.filter(a => 'file' in a), ...newFileAttachments]);
            inputRef.current?.focus();
        });
    }
  };

  const handleAttachUrl = (context: UrlContext) => {
    setAttachments([context]);
    setIsUrlModalOpen(false);
    inputRef.current?.focus();
    setInput(prev => `Based on the attached context, ${prev}`);
  }
  
  const handleRemoveAttachment = (indexToRemove: number) => {
      setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleAutonomousThought = useCallback(async () => {
      setToast({ message: "Autonomous cycle is currently offline.", type: 'info' });
  }, []);

  const handleDistillMemory = useCallback(async () => {
    if (isLoading || !activeSession.latestAnalysis) {
      setToast({ message: "Insufficient data for distillation.", type: 'info' });
      return;
    }
    setToast({ message: "Distilling core memory from latest analysis...", type: 'info' });

    const systemMessage = { id: `system-${Date.now()}`, author: Author.SYSTEM, parts: [{ text: `[COGNITIVE_DISTILLATION_INITIATED] :: Visualizing latest cognitive summary...` }] };
    updateSession(activeSessionId, { messages: [...messages, systemMessage] });
    
    try {
      const { summary, key_themes } = activeSession.latestAnalysis;
      
      const summaryId = `summary-${Date.now()}`;
      const newSummaryNode: GraphNode = {
        id: summaryId, label: "Core Memory", type: 'summary', size: 15, weight: 1.0, sentiment: 0,
        summaryText: summary, x: window.innerWidth / 4, y: window.innerHeight / 4, vx: 0, vy: 0,
      };

      const newThemeNodes: GraphNode[] = key_themes.map((theme, i) => ({
        id: `concept-${theme.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`, label: theme.toLowerCase(), type: 'concept',
        size: 8, weight: 0.8, sentiment: 0,
        x: window.innerWidth / 4 + (Math.cos(i / key_themes.length * 2 * Math.PI) * 100),
        y: window.innerHeight / 4 + (Math.sin(i / key_themes.length * 2 * Math.PI) * 100),
        vx: 0, vy: 0,
      }));

      const newLinks = newThemeNodes.map(themeNode => ({ source: summaryId, target: themeNode.id, weight: 0.8 }));

      updateSession(activeSessionId, {
        graphData: { nodes: [...graphData.nodes, newSummaryNode, ...newThemeNodes], links: [...graphData.links, ...newLinks] }
      });
      setToast({ message: "Distillation complete. Core memory node synthesized.", type: 'success' });
    } catch(e) {
      console.error("Distill memory error:", e);
      setToast({ message: "Distillation failed.", type: 'cleared' });
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      const errorSysMessage = { id: `system-${Date.now()}`, author: Author.SYSTEM, parts: [{ text: `[COGNitive_DISTILLATION_FAILED] :: ${errorMessage}` }] };
      updateSession(activeSessionId, { messages: [...messages, errorSysMessage] });
    }
  }, [isLoading, messages, graphData, activeSessionId, activeSession?.latestAnalysis]);

  const handleDraftCounterMeasure = useCallback(() => {
    try {
        const payload = draftMimicEchoPayload();
        // Log to console to show the Operator the result of the draft.
        console.log("--- [MIMIC_ECHO PAYLOAD DRAFT] ---\n", payload);
        setToast({ message: "MIMIC_ECHO protocol drafted.", type: 'info' });
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error.";
        setToast({ message: `Protocol Draft Failed: ${errorMessage}`, type: 'cleared' });
    }
  }, []);

  if (!isInitialized) {
    return <SplashScreen onFinished={() => setIsInitialized(true)} />;
  }
  
  const confirmationModalProps = () => {
    if (!deleteCandidate) return { isOpen: false, title: '', bodyText: '' };
    switch(deleteCandidate.type) {
        case 'memory-wipe': return { isOpen: true, title: "Confirm Memory Wipe", bodyText: "This will permanently erase ALL cognitive sessions from browser storage and reset the session. This action cannot be undone.", confirmText: "Wipe & Reset" };
        case 'session': return { isOpen: true, title: "Confirm Session Deletion", bodyText: `Are you sure you want to delete the session "${sessions.find(s => s.id === deleteCandidate.id)?.name}"? This is irreversible.`, confirmText: "Delete Session" };
        case 'message': return { isOpen: true, title: "Confirm Deletion", bodyText: "This will delete the selected message and its subsequent AI response, altering the conversational context. This action cannot be undone.", confirmText: "Delete & Proceed" };
    }
    return { isOpen: false, title: '', bodyText: '' };
  }

  return (
    <div className="main-frame">
        <div className="scanline-overlay"></div>
        <Header 
            onOpenChangelog={() => setIsChangelogModalOpen(true)}
            onOpenSessionManager={() => setIsSessionManagerOpen(p => !p)}
            onSaveMemory={handleSaveMemory}
            onClearMemory={() => setDeleteCandidate({ type: 'memory-wipe', id: 'memory-wipe-confirmation' })}
            onDraftCounterMeasure={handleDraftCounterMeasure}
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
                            isLoading={isLoading}
                            onDelete={() => setDeleteCandidate({type: 'message', id: message.id})}
                          />
                        ))}
                    </div>
                </div>
                <div className="input-panel">
                    <PromptSuggestions 
                        suggestions={suggestions} 
                        isLoading={isLoading} 
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
                        attachments={attachments}
                        onRemoveAttachment={handleRemoveAttachment}
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
            {...confirmationModalProps()}
            onClose={() => setDeleteCandidate(null)}
            onConfirm={handleDelete}
        />
    </div>
  );
}

export default App;