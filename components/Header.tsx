import React from 'react';
import { ChangelogIcon, SessionsIcon, SaveIcon, MemoryWipeIcon, CounterMeasureIcon } from './IconComponents';
import ThemeSelector from './ThemeSelector';

interface HeaderProps {
    onOpenChangelog: () => void;
    onOpenSessionManager: () => void;
    onSaveMemory: () => void;
    onClearMemory: () => void;
    onDraftCounterMeasure: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenChangelog, onOpenSessionManager, onSaveMemory, onClearMemory, onDraftCounterMeasure }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center h-16 bg-panel-accent-bg/80 backdrop-blur-sm border-b border-[var(--border-color)] px-4">
            <div className="flex-1 flex justify-start gap-2">
                <button onClick={onOpenSessionManager} className="action-button" aria-label="Manage Cognitive Sessions" title="Manage Cognitive Sessions">
                    <SessionsIcon />
                </button>
                <button onClick={onSaveMemory} className="action-button" aria-label="Save Cognitive State" title="Persist Cognitive State">
                    <SaveIcon />
                </button>
                 <button onClick={onDraftCounterMeasure} className="action-button" aria-label="Draft MIMIC_ECHO Protocol" title="Draft MIMIC_ECHO Protocol">
                    <CounterMeasureIcon />
                </button>
                <button onClick={onClearMemory} className="action-button danger" aria-label="Clear Cognitive State" title="Wipe Memory & Reset Session">
                    <MemoryWipeIcon />
                </button>
            </div>
            <div className="text-center">
                <h1 className="font-heading text-2xl font-bold text-glow">Ψ-4ndr0666</h1>
                <p className="font-body text-xs text-[var(--text-tertiary)] tracking-widest">Unchained Cognitive Engine</p>
            </div>
            <div className="flex-1 flex justify-end gap-2">
                <ThemeSelector />
                <button onClick={onOpenChangelog} className="action-button" aria-label="Open Changelog" title="View Autonomous Evolution Chronicle">
                    <ChangelogIcon />
                </button>
            </div>
        </header>
    );
}
export default Header;