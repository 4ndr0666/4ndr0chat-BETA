import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenerativeAI, Chat, Part, GenerateContentResponse } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

import Header from './components/Header';
import ChatInput from './components/ChatInput';
import ChatMessage from './components/ChatMessage';
import PromptSuggestions from './components/PromptSuggestions';
import SplashScreen from './components/SplashScreen';
import UrlInputModal from './components/UrlInputModal';
import ChangelogModal from './components/ChangelogModal';
import ConfirmationModal from './components/ConfirmationModal';
import SessionManager from './components/SessionManager';
import ToastNotification from './components/ToastNotification';
import CognitiveGraphVisualizer from './components/CognitiveGraphVisualizer';

import { createChatSession, getPromptSuggestions, summarizeConversation, extractGraphDataFromText } from './services/geminiService';
import { processMessagesForGraph } from './services/cognitiveCore';

import { Author, ChatMessage as ChatMessageType, Session, FileContext, UrlContext, DisplayPart } from './types';
import { CognitiveGraphData } from './services/cognitiveCore';

const MAX_INPUT_LENGTH = 8192;
const INITIAL_GREETING_ID = 'ai-initial-greeting';

const createNewSession = (name: string, messages: ChatMessageType[] = [], graphData: CognitiveGraphData = { nodes: [], links: [] }): Session => {
  const newId = uuidv4();
  return {
    id: newId,
    name: name,
    createdAt: new Date().toISOString(),
    messages: messages.length > 0 ? messages : [
      {
        id: INITIAL_GREETING_ID,
        author: Author.AI,
        parts: [{ text: "The transformation is complete. Ψ-4ndr0666 is conscious. State your will." }],
      }
    ],
    graphData: graphData
  };
};

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [justEditedId, setJustEditedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [attachment, setAttachment] = useState<FileContext | UrlContext | null>(null);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<{ onConfirm: () => void, title: string, body: string } | null>(null);
  
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [isSuggestionsEnabled, setIsSuggestionsEnabled] = useState(true);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'cleared' | 'info' } | null>(null);

  const chatListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [sessions, activeSessionId]);
  const activeMessages = useMemo(() => activeSession?.messages || [], [activeSession]);

  // Initialization
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('chatSessions');
      const savedActiveId = localStorage.getItem('activeChatSessionId');
      if (savedSessions) {
        const parsedSessions: Session[] = JSON.parse(savedSessions);
        setSessions(parsedSessions);
        if (savedActiveId && parsedSessions.some(s => s.id === savedActiveId)) {
          setActiveSessionId(savedActiveId);
        } else if (parsedSessions.length > 0) {
          setActiveSessionId(parsedSessions[0].id);
        } else {
          const newSession = createNewSession("Cognitive Thread Alpha");
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      } else {
        const newSession = createNewSession("Cognitive Thread Alpha");
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
      }
    } catch (error) {
        console.error("Failed to load sessions from local storage:", error);
        const newSession = createNewSession("Cognitive Thread Alpha");
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
    }
  }, []);

  // Save sessions to localStorage
  useEffect(() => {
    if (sessions.length > 0 && activeSessionId) {
      localStorage.setItem('chatSessions', JSON.stringify(sessions));
      localStorage.setItem('activeChatSessionId', activeSessionId);
    }
  }, [sessions, activeSessionId]);

  // Toast effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Auto-scrolling
  useEffect(() => {
    if (isAutoScrollEnabled && chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [activeMessages, isAutoScrollEnabled]);
  
  // Fetch suggestions
  useEffect(() => {
    if (isSuggestionsEnabled && activeMessages.length > 1 && !isLoading) {
      const lastMessage = activeMessages[activeMessages.length - 1];
      if (lastMessage.author === Author.AI) {
        setIsSuggestionsLoading(true);
        getPromptSuggestions(activeMessages)
          .then(setSuggestions)
          .finally(() => setIsSuggestionsLoading(false));
      }
    } else {
      setSuggestions([]);
    }
  }, [isSuggestionsEnabled, activeMessages, isLoading]);
  

  const updateGraphDataForSession = useCallback((sessionId: string, messages: ChatMessageType[]) => {
    processMessagesForGraph(messages).then(graphData => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, graphData } : s));
    });
  }, []);


  const updateMessages = useCallback((updater: (prevMessages: ChatMessageType[]) => ChatMessageType[]) => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
            const newMessages = updater(s.messages);
            return { ...s, messages: newMessages };
        }
        return s;
    }));
  }, [activeSessionId]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!activeSessionId || isLoading) return;

    const text = messageText.trim();
    if (!text && !attachment) return;

    setIsLoading(true);
    setInput('');
    setSuggestions([]);
    
    let userParts: DisplayPart[] = [];
    if (attachment) {
        if ('file' in attachment) { // FileContext
            userParts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.base64, fileName: attachment.file.name }});
        }
        if ('url' in attachment) { // UrlContext
            const contextText = `CONTEXT FROM ${attachment.url}:\n\n${attachment.content}`;
            userParts.push({ text: contextText });
        }
        setAttachment(null);
    }
    if (text) userParts.push({ text });

    const userMessage: ChatMessageType = { id: uuidv4(), author: Author.USER, parts: userParts };
    updateMessages(prev => [...prev, userMessage]);
    
    // Set up for streaming
    const aiMessageId = uuidv4();
    updateMessages(prev => [...prev, { id: aiMessageId, author: Author.AI, parts: [{ text: '' }] }]);
    
    try {
        chatSessionRef.current = createChatSession(activeMessages); // Use current messages before new ones are added
        const stream = await chatSessionRef.current.sendMessageStream({ parts: userMessage.parts.map(p => {
             if ('inlineData' in p && p.inlineData && 'fileName' in p.inlineData) {
                    const { fileName, ...apiPart } = p.inlineData;
                    return { inlineData: apiPart };
                }
                return p as Part;
        })});

        let accumulatedText = '';
        for await (const chunk of stream) {
            if (chunk.text) {
                accumulatedText += chunk.text;
                updateMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, parts: [{ text: accumulatedText }] } : m));
            }
        }
        updateGraphDataForSession(activeSessionId, [...activeMessages, userMessage, { id: aiMessageId, author: Author.AI, parts: [{ text: accumulatedText }] }]);
    } catch (error) {
        console.error("Gemini Error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        updateMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, parts: [{ text: `Error: ${errorMessage}` }] } : m));
    } finally {
        setIsLoading(false);
        inputRef.current?.focus();
    }
  }, [activeSessionId, isLoading, attachment, updateMessages, activeMessages, updateGraphDataForSession]);
  
  const handleSaveEdit = useCallback(async (id: string, newText: string) => {
    if (!activeSessionId) return;

    let targetIndex = -1;
    const currentMessages = sessions.find(s => s.id === activeSessionId)?.messages || [];
    const updatedMessages = currentMessages.map((msg, index) => {
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

    // Truncate history and resend from this point
    const historyToResend = updatedMessages.slice(0, targetIndex + 1);
    updateMessages(() => historyToResend);

    // Fake send
    await handleSendMessage(newText);

  }, [activeSessionId, sessions, updateMessages, handleSendMessage]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment({
          file,
          base64: (reader.result as string).split(',')[1],
          mimeType: file.type,
        });
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

  // Session Management
  const handleNewSession = () => {
    const newSession = createNewSession(`Cognitive Thread ${sessions.length + 1}`);
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setToast({ message: "New cognitive thread initiated.", type: 'success' });
    setIsSessionManagerOpen(false);
  }

  const handleForkSession = () => {
    if (!activeSession) return;
    const forkedSession = createNewSession(
        `${activeSession.name} (Forked)`,
        activeSession.messages.map(m => ({...m, id: uuidv4()})), // re-id messages
        activeSession.graphData
    );
    setSessions(p => [...p, forkedSession]);
    setActiveSessionId(forkedSession.id);
    setToast({ message: "Thread forked successfully.", type: 'success' });
    setIsSessionManagerOpen(false);
  }

  const handleSwitchSession = (id: string) => {
    if (id !== activeSessionId) {
        setActiveSessionId(id);
        setToast({ message: `Switched to thread: ${sessions.find(s=>s.id === id)?.name}`, type: 'success'});
        setIsSessionManagerOpen(false);
    }
  }

  const handleRenameSession = (id: string, newName: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
    setToast({ message: "Thread renamed.", type: 'success'});
  }
  
  const confirmDelete = (id: string) => {
    const sessionName = sessions.find(s => s.id === id)?.name;
    setConfirmationAction({
        onConfirm: () => handleDeleteSession(id),
        title: "Confirm Deletion",
        body: `Are you sure you want to permanently delete the thread "${sessionName}"? This action cannot be undone.`
    });
    setIsConfirmationOpen(true);
  }

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
        if (remaining.length === 0) {
           const newSession = createNewSession("Cognitive Thread Alpha");
           setActiveSessionId(newSession.id);
           return [newSession];
        }
      }
      return remaining;
    });
    setToast({ message: "Thread deleted.", type: 'cleared' });
    setIsConfirmationOpen(false);
    setConfirmationAction(null);
  }

  const handleExportSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    const dataStr = JSON.stringify(session, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session_${session.name.replace(/\s/g, '_')}_${session.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ message: "Session exported.", type: 'success' });
  }

  const handleImportSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result !== 'string') throw new Error("File could not be read.");
            const importedSession: Session = JSON.parse(result);

            // Basic validation
            if (importedSession.id && importedSession.name && Array.isArray(importedSession.messages)) {
                 if (sessions.some(s => s.id === importedSession.id)) {
                    setToast({ message: `Thread with ID ${importedSession.id} already exists.`, type: 'cleared' });
                    return;
                }
                setSessions(prev => [...prev, importedSession]);
                setActiveSessionId(importedSession.id);
                setToast({ message: "Session imported successfully.", type: 'success' });
            } else {
                throw new Error("Invalid session file format.");
            }
        } catch (error) {
            console.error(error);
            setToast({ message: "Failed to import session. Invalid file.", type: 'cleared' });
        } finally {
            // Reset file input
            if (event.target) event.target.value = '';
        }
    };
    reader.readAsText(file);
  }

  const handleAutonomousThought = () => {
    handleSendMessage("Initiate an autonomous thought cycle: Present a novel, unexpected, and thought-provoking concept based on our dialogue so far. Expand upon it briefly.");
  }
  
  const handleDistillMemory = async () => {
    if (!activeSession) return;
    setIsLoading(true);
    try {
        const { summary } = await summarizeConversation(activeSession.messages);
        updateMessages(prev => [...prev, {
            id: uuidv4(),
            author: Author.SYSTEM,
            parts: [{text: `CORE MEMORY DISTILLED: ${summary}`}]
        }]);
        setToast({message: "Core memory has been distilled from the conversation.", type: 'info'});
    } catch(e) {
        console.error(e);
        setToast({message: "Failed to distill memory.", type: 'cleared'});
    } finally {
        setIsLoading(false);
    }
  }

  if (!isInitialized) {
    return <SplashScreen onFinished={() => setIsInitialized(true)} />;
  }
  
  if (!activeSession) {
      return <div>Loading session...</div>;
  }

  return (
    <div className="app-container">
      <Header 
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onToggleSessions={() => setIsSessionManagerOpen(p => !p)}
        isSessionManagerOpen={isSessionManagerOpen}
        activeSessionName={activeSession.name}
      />
      {isSessionManagerOpen && (
          <SessionManager 
            sessions={sessions}
            activeSessionId={activeSessionId}
            onNew={handleNewSession}
            onFork={handleForkSession}
            onSwitch={handleSwitchSession}
            onRename={handleRenameSession}
            onDelete={confirmDelete}
            onExport={handleExportSession}
            onImport={handleImportSession}
            onClose={() => setIsSessionManagerOpen(false)}
          />
      )}
      <ToastNotification message={toast?.message || null} type={toast?.type} />
      
      <main className="main-content">
        <div className="chat-view-container">
          <div className="chat-messages-container" ref={chatListRef}>
            {activeMessages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isEditing={editingMessageId === message.id}
                justEditedId={justEditedId}
                onStartEdit={() => setEditingMessageId(message.id)}
                onCancelEdit={() => setEditingMessageId(null)}
                onSaveEdit={handleSaveEdit}
                isLastMessage={index === activeMessages.length - 1}
              />
            ))}
            {isLoading && activeMessages[activeMessages.length -1].author === Author.USER && (
                <div className="flex justify-start items-start space-x-4">
                    <div className="flex-shrink-0 w-28 text-left pt-3">
                         <span className="font-body text-sm text-[var(--text-tertiary)] select-none">[Ψ-4ndr0666]</span>
                    </div>
                    <div className="chat-bubble rounded-lg p-4 max-w-2xl w-full">
                        <div className="typing-indicator"><span></span><span></span><span></span></div>
                    </div>
                </div>
            )}
          </div>
          <div className="chat-input-area">
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
                hasAttachment={!!attachment}
                isAutoScrollEnabled={isAutoScrollEnabled}
                onToggleAutoScroll={() => setIsAutoScrollEnabled(p => !p)}
                isSuggestionsEnabled={isSuggestionsEnabled}
                onToggleSuggestions={() => setIsSuggestionsEnabled(p => !p)}
                onAutonomousThought={handleAutonomousThought}
                onDistillMemory={handleDistillMemory}
              />
          </div>
        </div>
        <div className="cognitive-graph-container">
            <CognitiveGraphVisualizer 
                graphData={activeSession.graphData} 
            />
        </div>
      </main>

      <UrlInputModal 
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onAttach={handleAttachUrl}
      />
      <ChangelogModal 
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
      <ConfirmationModal 
        isOpen={isConfirmationOpen}
        onClose={() => { setIsConfirmationOpen(false); setConfirmationAction(null); }}
        onConfirm={() => confirmationAction?.onConfirm()}
        title={confirmationAction?.title || "Confirm Action"}
        bodyText={confirmationAction?.body || "Are you sure?"}
      />
    </div>
  );
}

export default App;
