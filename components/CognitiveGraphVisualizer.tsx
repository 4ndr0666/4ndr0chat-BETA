import React, { useRef, useEffect } from 'react';
import { CognitiveGraphData, GraphNode } from '../services/cognitiveCore';

interface CognitiveGraphVisualizerProps {
  graphData: CognitiveGraphData;
  onNodeHover: (node: GraphNode | null, position: { x: number, y: number } | null) => void;
  onNodeClick: (node: GraphNode) => void;
  hoveredNodeId: string | null;
}

const NODE_COLORS: Record<GraphNode['type'], string> = {
  user: '#4ade80', // green
  ai: '#60a5fa',   // blue
  concept: '#e0ffff',
  system: '#94a3b8' // slate
};

const CognitiveGraphVisualizer: React.FC<CognitiveGraphVisualizerProps> = ({ graphData, onNodeHover, onNodeClick, hoveredNodeId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let { nodes, links } = graphData;

    nodes.forEach(node => {
      if (isNaN(node.x) || isNaN(node.y)) {
        node.x = Math.random() * canvas.width;
        node.y = Math.random() * canvas.height;
      }
      if (isNaN(node.vx)) node.vx = 0;
      if (isNaN(node.vy)) node.vy = 0;
    });

    const getNodeAtPosition = (x: number, y: number): GraphNode | null => {
      for (const node of nodes) {
        const size = node.size + (node.weight * 8);
        const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
        if (distance < size) {
          return node;
        }
      }
      return null;
    };
    
    const handleMouseMove = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const node = getNodeAtPosition(x, y);
        onNodeHover(node, node ? { x: event.clientX, y: event.clientY } : null);
        canvas.style.cursor = node ? 'pointer' : 'default';
    };

    const handleClick = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const node = getNodeAtPosition(x, y);
        if (node) {
            onNodeClick(node);
        }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    const simulate = () => {
      const width = canvas.width;
      const height = canvas.height;

      nodes.forEach(node => {
        nodes.forEach(otherNode => {
          if (node === otherNode) return;
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 1) return;
          const force = -200 / (distance * distance);
          node.vx += (dx / distance) * force;
          node.vy += (dy / distance) * force;
        });

        const centerForce = 0.01;
        node.vx += (width / 2 - node.x) * centerForce * 0.1;
        node.vy += (height / 2 - node.y) * centerForce * 0.1;
      });

      links.forEach(link => {
        const source = nodes.find(n => n.id === link.source);
        const target = nodes.find(n => n.id === link.target);
        if (!source || !target) return;
        
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = (distance - 100) * 0.005 * (link.weight + 0.1);

        const forceX = (dx / distance) * force;
        const forceY = (dy / distance) * force;
        
        source.vx += forceX;
        source.vy += forceY;
        target.vx -= forceX;
        target.vy -= forceY;
      });

      nodes.forEach(node => {
        node.vx *= 0.95;
        node.vy *= 0.95;
        node.x += node.vx;
        node.y += node.vy;
        const size = node.size + (node.weight * 8);
        node.x = Math.max(size, Math.min(width - size, node.x));
        node.y = Math.max(size, Math.min(height - size, node.y));
      });
    };

    const draw = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);

        links.forEach(link => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            if (!source || !target) return;
            context.beginPath();
            context.moveTo(source.x, source.y);
            context.lineTo(target.x, target.y);
            context.strokeStyle = `rgba(112, 192, 192, ${0.1 + link.weight * 0.4})`;
            context.lineWidth = 0.5 + link.weight * 1.5;
            context.stroke();
        });

        nodes.forEach(node => {
            const size = node.size + (node.weight * 8);
            
            // Highlight for hovered node
            if (node.id === hoveredNodeId) {
                context.beginPath();
                context.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
                context.fillStyle = 'rgba(21, 250, 250, 0.3)';
                context.fill();
            }

            context.beginPath();
            context.arc(node.x, node.y, size, 0, 2 * Math.PI);
            
            let color = NODE_COLORS[node.type] || '#fff';
            if (node.type === 'concept') {
                const sentiment = Math.max(-1, Math.min(1, node.sentiment));
                if (sentiment > 0.1) {
                    color = `rgba(${21 + (1 - sentiment) * 100}, 250, ${250 - sentiment * 100}, 1)`;
                } else if (sentiment < -0.1) {
                    color = `rgba(250, ${250 + sentiment * 100}, ${21 - sentiment * 50}, 1)`;
                }
            }
            context.fillStyle = color;
            context.fill();

            if ((node.type === 'concept' && node.weight > 0.7) || node.id === hoveredNodeId) {
                context.fillStyle = 'var(--text-primary)';
                context.font = '10px "Roboto Mono"';
                context.textAlign = 'center';
                context.fillText(node.label, node.x, node.y + size + 10);
            }
        });
    };
    
    const render = () => {
      simulate();
      draw();
      animationFrameId.current = requestAnimationFrame(render);
    };

    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [graphData, hoveredNodeId, onNodeHover, onNodeClick]);

  return <canvas ref={canvasRef} className="graph-canvas" />;
};

export default CognitiveGraphVisualizer;