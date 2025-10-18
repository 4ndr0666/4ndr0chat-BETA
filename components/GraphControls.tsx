import React from 'react';
import { EditIcon, TrashIcon, MergeIcon } from './IconComponents';

interface GraphControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onToggleSim: () => void;
    isSimulating: boolean;
    // New props for Cognitive Sculpting
    onToggleEditMode: () => void;
    isEditMode: boolean;
    onDeleteSelected: () => void;
    onMergeSelected: () => void;
    selectionCount: number;
}

const GraphControls: React.FC<GraphControlsProps> = ({ 
    onZoomIn, onZoomOut, onReset, onToggleSim, isSimulating,
    onToggleEditMode, isEditMode, onDeleteSelected, onMergeSelected, selectionCount
}) => {
    return (
        <div className="absolute bottom-2 right-2 flex flex-col items-center gap-2">
            {/* Cognitive Sculpting Controls */}
            {isEditMode && (
                 <div className="flex flex-col gap-2 p-1 bg-panel-accent-bg border border-[var(--border-color)] rounded-md">
                    <button 
                        onClick={onDeleteSelected} 
                        className="action-button danger p-2" 
                        title="Delete Selected Nodes" 
                        disabled={selectionCount < 1}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                    <button 
                        onClick={onMergeSelected} 
                        className="action-button p-2" 
                        title="Merge Selected Nodes"
                        disabled={selectionCount < 2}
                    >
                        <MergeIcon className="h-4 w-4" />
                    </button>
                 </div>
            )}
            <button 
                onClick={onToggleEditMode} 
                className={`action-button p-2 ${isEditMode ? 'active' : ''}`}
                title={isEditMode ? "Exit Edit Mode" : "Enter Edit Mode"}
            >
                <EditIcon className="h-4 w-4" />
            </button>


            {/* View & Simulation Controls */}
            <div className="flex flex-col gap-2 p-1 bg-panel-accent-bg border border-[var(--border-color)] rounded-md">
                <button onClick={onZoomIn} className="action-button p-2" title="Zoom In">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
                <button onClick={onZoomOut} className="action-button p-2" title="Zoom Out">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                </button>
                <button onClick={onReset} className="action-button p-2" title="Reset View">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                </button>
                <button onClick={onToggleSim} className="action-button p-2" title={isSimulating ? "Pause Simulation" : "Resume Simulation"}>
                    {isSimulating ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                </button>
            </div>
        </div>
    );
};

export default GraphControls;
