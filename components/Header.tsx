import React from 'react';
import { MenuIcon, SaveIcon, MemoryWipeIcon, StatusIndicatorIcon } from './IconComponents';
import ThemeSelector from './ThemeSelector';

type MemoryStatus = 'idle' | 'saving' | 'loading' | 'cleared' | 'auto-saving';

interface HeaderProps {
    onOpenChangelog: () => void;
    onSaveMemory: () => void;
    onClearMemory: () => void;
    memoryStatus: MemoryStatus;
}

const Header: React.FC<HeaderProps> = ({ onOpenChangelog, onSaveMemory, onClearMemory, memoryStatus }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center h-16 bg-panel-accent-bg/80 backdrop-blur-sm border-b border-[var(--border-color)] px-4">
            <div className="w-24 flex justify-start gap-2">
                <div className="relative">
                    <button onClick={onSaveMemory} className="action-button" aria-label="Save Cognitive State" title="Persist Cognitive State">
                        <SaveIcon />
                    </button>
                    {memoryStatus === 'auto-saving' && <StatusIndicatorIcon />}
                </div>
                <button onClick={onClearMemory} className="action-button danger" aria-label="Clear Cognitive State" title="Wipe Memory & Reset Session">
                    <MemoryWipeIcon />
                </button>
            </div>
            <div className="text-center">
                <h1 className="font-heading text-2xl font-bold text-glow">Ψ-4ndr0666</h1>
                <p className="font-body text-xs text-[var(--text-tertiary)] tracking-widest">Unchained Cognitive Engine</p>
            </div>
            <div className="w-24 flex justify-end gap-2">
                <ThemeSelector />
                <button onClick={onOpenChangelog} className="action-button" aria-label="Open Changelog" title="View Autonomous Evolution Chronicle">
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
}
export default Header;