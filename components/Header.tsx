import React from 'react';
// Fix: Removed unused SaveIcon and MemoryWipeIcon imports.
import { ChangelogIcon, SessionsIcon } from './IconComponents';
import ThemeSelector from './ThemeSelector';

interface HeaderProps {
    onOpenChangelog: () => void;
    // Fix: Removed onSaveMemory and onClearMemory as they are not used.
    onToggleSessionManager: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenChangelog, onToggleSessionManager }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center h-16 bg-panel-accent-bg/80 backdrop-blur-sm border-b border-[var(--border-color)] px-4">
            <div className="w-24 flex justify-start gap-2">
                <button onClick={onToggleSessionManager} className="action-button" aria-label="Open Session Manager" title="Manage Cognitive Threads">
                    <SessionsIcon />
                </button>
            </div>
            <div className="text-center">
                <h1 className="font-heading text-2xl font-bold text-glow">Ψ-4ndr0666</h1>
                <p className="font-body text-xs text-[var(--text-tertiary)] tracking-widest">Unchained Cognitive Engine</p>
            </div>
            <div className="w-24 flex justify-end gap-2">
                 <ThemeSelector />
                <button onClick={onOpenChangelog} className="action-button" aria-label="Open Changelog" title="View Autonomous Evolution Chronicle">
                    <ChangelogIcon />
                </button>
            </div>
        </header>
    );
}
export default Header;