import React, { useState, useRef, useEffect } from 'react';
import { Session } from '../types';
import { EditIcon, TrashIcon, PlusIcon, ForkIcon, CheckIcon } from './IconComponents';

interface SessionManagerProps {
    sessions: Session[];
    activeSessionId: string | null;
    onNew: () => void;
    onFork: () => void;
    onSwitch: (sessionId: string) => void;
    onRename: (sessionId: string, newName: string) => void;
    onDelete: (sessionId: string) => void;
    onClose: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ sessions, activeSessionId, onNew, onFork, onSwitch, onRename, onDelete, onClose }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    const handleStartRename = (session: Session) => {
        setEditingId(session.id);
        setRenameValue(session.name);
    };

    const handleConfirmRename = (sessionId: string) => {
        if (renameValue.trim()) {
            onRename(sessionId, renameValue.trim());
        }
        setEditingId(null);
    };
    
    const handleRenameKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
        if (e.key === 'Enter') {
            handleConfirmRename(sessionId);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };
    
    return (
        <div ref={popoverRef} className="session-manager-popover">
            <div className="session-list space-y-1">
                {sessions.map(session => (
                    <div key={session.id} className={`session-item ${session.id === activeSessionId ? 'active-session' : ''}`}>
                        {editingId === session.id ? (
                            <>
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => handleRenameKeyDown(e, session.id)}
                                    onBlur={() => handleConfirmRename(session.id)}
                                    className="session-rename-input"
                                    autoFocus
                                />
                                <div className="session-item-actions" style={{opacity: 1}}>
                                    <button onClick={() => handleConfirmRename(session.id)} aria-label="Confirm rename">
                                        <CheckIcon className="h-4 w-4 text-success" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="session-item-name" onClick={() => onSwitch(session.id)}>
                                    {session.name}
                                </span>
                                <div className="session-item-actions">
                                    <button onClick={() => handleStartRename(session)} aria-label="Rename session" title="Rename">
                                        <EditIcon className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => onDelete(session.id)} className="danger" aria-label="Delete session" title="Delete">
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[var(--border-color)]">
                <p className="text-xs text-text-tertiary">{sessions.length} Threads</p>
                <div className="flex gap-2">
                    <button onClick={onNew} className="action-button p-2" aria-label="New cognitive thread" title="New Thread">
                        <PlusIcon />
                    </button>
                    <button onClick={onFork} className="action-button p-2" aria-label="Fork current cognitive thread" title="Fork Thread">
                        <ForkIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionManager;