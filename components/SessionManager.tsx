import React, { useState, useRef, useEffect } from 'react';
import { Session } from '../types';
import { PlusIcon, EditIcon, CheckIcon, TrashIcon, ExportIcon, ImportIcon } from './IconComponents';

interface SessionManagerProps {
    sessions: Session[];
    activeSessionId: string;
    onSelectSession: (id: string) => void;
    onAddSession: () => void;
    onDeleteSession: (id: string) => void;
    onRenameSession: (id: string, newName: string) => void;
    onClose: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({
    sessions,
    activeSessionId,
    onSelectSession,
    onAddSession,
    onDeleteSession,
    onRenameSession,
    onClose,
}) => {
    const [renamingId, setRenamingId] = useState<string | null>(null);
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
        setRenamingId(session.id);
        setRenameValue(session.name);
    };

    const handleConfirmRename = () => {
        if (renamingId && renameValue.trim()) {
            onRenameSession(renamingId, renameValue.trim());
        }
        setRenamingId(null);
        setRenameValue('');
    };
    
    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConfirmRename();
        if (e.key === 'Escape') setRenamingId(null);
    }

    return (
        <div className="session-manager-popover" ref={popoverRef}>
            <div className="flex justify-between items-center">
                <h3 className="font-heading text-lg text-glow">Cognitive Streams</h3>
                <div className="flex gap-2">
                    {/* Placeholder for future import/export */}
                    <button className="action-button" disabled title="Export All (Coming Soon)"><ExportIcon /></button>
                    <button className="action-button" disabled title="Import (Coming Soon)"><ImportIcon /></button>
                    <button onClick={onAddSession} className="action-button" title="New Session"><PlusIcon /></button>
                </div>
            </div>
            <div className="session-list">
                {sessions.map(session => (
                    <div
                        key={session.id}
                        className={`session-item ${session.id === activeSessionId ? 'active-session' : ''}`}
                    >
                        {renamingId === session.id ? (
                            <input
                                type="text"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onBlur={handleConfirmRename}
                                onKeyDown={handleRenameKeyDown}
                                className="session-rename-input"
                                autoFocus
                            />
                        ) : (
                            <span
                                className="session-item-name"
                                onClick={() => onSelectSession(session.id)}
                            >
                                {session.name}
                            </span>
                        )}
                        <div className="session-item-actions">
                             {renamingId === session.id ? (
                                <button onClick={handleConfirmRename} title="Confirm"><CheckIcon /></button>
                            ) : (
                                <button onClick={() => handleStartRename(session)} title="Rename"><EditIcon /></button>
                            )}
                            <button onClick={() => onDeleteSession(session.id)} className="danger" title="Delete" disabled={sessions.length <= 1}><TrashIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SessionManager;