import React from 'react';

interface GraphControlsProps {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onToggleSim: () => void;
    isSimulating: boolean;
}

const GraphControls: React.FC<GraphControlsProps> = ({ onZoomIn, onZoomOut, onReset, onToggleSim, isSimulating }) => {
    return (
        <div className="graph-controls-container">
            <button onClick={onZoomIn} className="graph-control-button" title="Zoom In">+</button>
            <button onClick={onZoomOut} className="graph-control-button" title="Zoom Out">-</button>
            <button onClick={onReset} className="graph-control-button" title="Reset View">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                </svg>
            </button>
            <button onClick={onToggleSim} className="graph-control-button" title={isSimulating ? "Pause Simulation" : "Resume Simulation"}>
                {isSimulating ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5"/>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/>
                    </svg>
                )}
            </button>
        </div>
    );
};

export default GraphControls;
