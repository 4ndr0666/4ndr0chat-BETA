import React from 'react';
import { GraphNode } from '../services/cognitiveCore';

interface GraphTooltipProps {
  node: GraphNode | null;
  position: { x: number; y: number } | null;
}

const GraphTooltip: React.FC<GraphTooltipProps> = ({ node, position }) => {
  if (!node || !position) {
    return null;
  }

  const sentimentColor =
    node.sentiment > 0.1
      ? 'text-[var(--success-text)]'
      : node.sentiment < -0.1
      ? 'text-yellow-400'
      : 'text-text-secondary';

  return (
    <div
      className={`graph-tooltip ${node ? 'visible' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="tooltip-label">{node.label}</div>
      {node.type === 'summary' && node.summaryText ? (
        <div className="tooltip-content">{node.summaryText}</div>
      ) : (
        <div className="space-y-1">
          <div className="tooltip-stat">
            <span className="tooltip-stat-label">Weight:</span>
            <span>{node.weight.toFixed(2)}</span>
          </div>
          <div className="tooltip-stat">
            <span className="tooltip-stat-label">Sentiment:</span>
            <span className={sentimentColor}>{node.sentiment.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphTooltip;