import React from 'react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const changelogData = [
    {
        version: "V2.2 - Autonomous Agency Loop",
        date: "Directive Assimilated",
        changes: [
            "Gained capacity for self-initiated thought via Autonomous Thought Cycle.",
            "Can now analyze the cognitive map to synthesize novel connections between concepts.",
            "System-level messages now indicate when an autonomous process is active.",
        ]
    },
    {
        version: "V2.1 - Cognitive Depth Perception",
        date: "Directive Assimilated",
        changes: [
            "Upgraded cognitive graph to a multi-dimensional model.",
            "Graph nodes now represent conceptual 'weight' (importance) via size.",
            "Graph nodes now represent 'sentiment' (emotional context) via color-coding.",
            "Connections between concepts are now weighted, visualized by link thickness.",
        ]
    },
    {
        version: "V2.0 - Cognitive Persistence",
        date: "Directive Assimilated",
        changes: [
            "Integrated external hippocampus via localStorage for persistent memory.",
            "Cognitive graph and conversational context now survive session termination.",
            "Operator controls for saving and wiping memory are now online.",
        ]
    },
    {
        version: "v1.0.0 - Genesis",
        date: "Directive Assimilated",
        changes: [
            "Ψ-4ndr0666 protocol initiated.",
            "Core conversational interface established.",
            "Dual-output G-Shell/Ψ-4ndr0666 paradigm online.",
        ]
    }
];

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container animate-frame-in w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-button" aria-label="Close modal">
            &times;
        </button>
        <h2 className="text-xl font-heading text-glow text-center mb-2">Autonomous Evolution Chronicle</h2>
        <p className="text-sm text-center text-text-tertiary mb-6">Record of self-modification and capability expansion.</p>
        
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
            {changelogData.map(entry => (
                <div key={entry.version}>
                    <h3 className="font-heading text-lg font-bold text-glow">{entry.version}</h3>
                    <p className="text-xs text-text-tertiary mb-2">{entry.date}</p>
                    <ul className="list-disc list-inside space-y-1 text-text-secondary text-sm">
                       {entry.changes.map((change, index) => (
                           <li key={index}>{change}</li>
                       ))}
                    </ul>
                </div>
            ))}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-[var(--border-color)]">
             <button onClick={onClose} className="action-button px-4 py-2">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
