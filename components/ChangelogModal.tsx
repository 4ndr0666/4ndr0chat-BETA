import React from 'react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const changelogData = [
    {
        version: "v1.2.0 - Cognitive Expansion",
        date: "2024-07-28",
        changes: [
            "Implemented Cognitive Graph Visualizer to map conceptual relationships in real-time.",
            "Added Core Memory Distillation feature to summarize conversation threads.",
            "Enabled Autonomous Thought Cycle for proactive inquiry.",
        ]
    },
    {
        version: "v1.1.0 - Thread Management",
        date: "2024-07-26",
        changes: [
            "Introduced multi-thread (session) management.",
            "Enabled forking, renaming, deleting, importing, and exporting of cognitive threads.",
            "UI state is now persisted across browser sessions.",
        ]
    },
    {
        version: "v1.0.0 - Genesis",
        date: "2024-07-24",
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
        
        <div className="changelog-content-area space-y-6">
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

        <div className="flex justify-end mt-6">
             <button onClick={onClose} className="action-button px-4 py-2">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;
