import React from 'react';
import { EditIcon, TrashIcon, MergeIcon, ZoomInIcon, ZoomOutIcon, FitToScreenIcon, PauseIcon, PlayIcon } from './IconComponents';

interface GraphControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onToggleSim: () => void;
    isSimulating: boolean;
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
        <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
            <button 
                onClick={onToggleEditMode} 
                className={`action-button p-2 ${isEditMode ? 'active' : ''}`}
                title={isEditMode ? "Exit Cognitive Sculpting" : "Enter Cognitive Sculpting"}
            >
                <EditIcon className="h-5 w-5" />
            </button>
            
            {isEditMode && (
                 <>
                    <div className="w-full h-[1px] bg-[var(--border-color)] my-1"></div>
                    <button 
                        onClick={onDeleteSelected} 
                        className="action-button danger p-2" 
                        title="Delete Selected Nodes" 
                        disabled={selectionCount < 1}
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                    <button 
                        onClick={onMergeSelected} 
                        className="action-button p-2" 
                        title="Merge Selected Nodes"
                        disabled={selectionCount < 2}
                    >
                        <MergeIcon className="h-5 w-5" />
                    </button>
                    <div className="w-full h-[1px] bg-[var(--border-color)] my-1"></div>
                 </>
            )}

            <button onClick={onZoomIn} className="action-button p-2" title="Zoom In">
                <ZoomInIcon className="h-5 w-5" />
            </button>
            <button onClick={onZoomOut} className="action-button p-2" title="Zoom Out">
                <ZoomOutIcon className="h-5 w-5" />
            </button>
            <button onClick={onReset} className="action-button p-2" title="Fit to Screen">
                <FitToScreenIcon className="h-5 w-5" />
            </button>
            <button onClick={onToggleSim} className="action-button p-2" title={isSimulating ? "Pause Simulation" : "Resume Simulation"}>
                {isSimulating ? (
                    <PauseIcon className="h-5 w-5" />
                ) : (
                    <PlayIcon className="h-5 w-5" />
                )}
            </button>
        </div>
    );
};

export default GraphControls;
