import React, { useRef, useEffect, useState, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, Simulation, ForceLink, ForceCenter } from 'd3-force';
import { zoom, zoomIdentity, ZoomTransform } from 'd3-zoom';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import 'd3-transition';

import { CognitiveGraphData, GraphNode, GraphLink } from '../services/cognitiveCore';
import GraphTooltip from './GraphTooltip';
import GraphControls from './GraphControls';

interface CognitiveGraphVisualizerProps {
  graphData: CognitiveGraphData;
  isEditMode: boolean;
  selectedNodes: Set<string>;
  onNodeClick: (nodeId: string) => void;
  onToggleEditMode: () => void;
  onDeleteSelected: () => void;
  onMergeSelected: () => void;
}

const NODE_COLORS = {
  user: '#265D80', // blue
  ai: '#7F3F98',   // purple
  concept: '#3E725D', // green
  system: '#8C6D35', // orange
  summary: '#9E453B' // red
};

const CognitiveGraphVisualizer: React.FC<CognitiveGraphVisualizerProps> = ({ 
    graphData, isEditMode, selectedNodes, onNodeClick,
    onToggleEditMode, onDeleteSelected, onMergeSelected
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [tooltip, setTooltip] = useState<{ node: GraphNode; pos: { x: number; y: number } } | null>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const [isSimulating, setIsSimulating] = useState(true);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context || !canvas) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    context.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(transformRef.current.x, transformRef.current.y);
    context.scale(transformRef.current.k, transformRef.current.k);

    context.lineWidth = 1;
    links.forEach(link => {
      if (typeof link.source !== 'string' && typeof link.target !== 'string') {
        const sourceNode = link.source as GraphNode;
        const targetNode = link.target as GraphNode;
        context.beginPath();
        context.moveTo(sourceNode.x, sourceNode.y);
        context.lineTo(targetNode.x, targetNode.y);
        context.strokeStyle = `rgba(112, 192, 192, ${0.1 + (link.weight || 0.5) * 0.4})`;
        context.lineWidth = 0.5 + (link.weight || 0.5) * 1.5;
        context.stroke();
      }
    });

    nodes.forEach(node => {
      const size = node.size + ((node.weight || 0.5) * 8);
      context.beginPath();
      context.arc(node.x, node.y, size, 0, 2 * Math.PI);
      
      let color = NODE_COLORS[node.type] || '#fff';
      if (node.type === 'concept') {
          const sentiment = Math.max(-1, Math.min(1, node.sentiment || 0));
          if (sentiment > 0.1) {
              const r = Math.floor(21 + (1 - sentiment) * 100);
              const b = Math.floor(250 - sentiment * 100);
              color = `rgba(${r}, 250, ${b}, 1)`;
          } else if (sentiment < -0.1) {
              const g = Math.floor(250 + sentiment * 100);
              const b = Math.floor(21 - sentiment * 50);
              color = `rgba(250, ${g}, ${b}, 1)`;
          }
      }
      context.fillStyle = color;
      context.fill();

      // Draw selection highlight
      if (selectedNodes.has(node.id)) {
        context.strokeStyle = 'var(--accent-cyan)';
        context.lineWidth = 2;
        context.shadowColor = 'var(--accent-cyan)';
        context.shadowBlur = 10;
        context.stroke();
        context.shadowBlur = 0; // Reset shadow
      }
    });

    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '8px sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    nodes.forEach(node => {
      const size = node.size + ((node.weight || 0.5) * 8);
      if (size > 8) {
        context.fillText(node.label, node.x, node.y);
      }
    });

    context.restore();
  }, [nodes, links, selectedNodes]);

  const initializeSimulation = useCallback(() => {
    if (!simulationRef.current) {
        simulationRef.current = forceSimulation<GraphNode, GraphLink>()
            .force('link', forceLink<GraphNode, GraphLink>().id(d => d.id).distance(50).strength(0.1))
            .force('charge', forceManyBody().strength(-100))
            .force('center', forceCenter())
            .on('tick', renderCanvas);
    }
  }, [renderCanvas]);

  useEffect(() => {
    initializeSimulation();
    const sim = simulationRef.current;
    const canvas = canvasRef.current;
    if(sim && canvas){
        const { width, height } = canvas.getBoundingClientRect();
        const centerForce = sim.force<ForceCenter<GraphNode>>('center');
        if (centerForce) {
            centerForce.x(width / 2).y(height / 2);
        }

        const newNodes = graphData.nodes.map(n => ({...n}));
        const newLinks = graphData.links.map(l => ({...l}));
        
        setNodes(newNodes);
        setLinks(newLinks);

        sim.nodes(newNodes);
        sim.force<ForceLink<GraphNode, GraphLink>>('link')?.links(newLinks);
        
        if (isSimulating) {
            sim.alpha(1).restart();
        }
    }
  }, [graphData, isSimulating, initializeSimulation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
        .scaleExtent([0.2, 8])
        .on('zoom', (event) => {
            transformRef.current = event.transform;
            renderCanvas();
        });

    const dragBehavior = drag<HTMLCanvasElement, GraphNode>()
        .subject((event) => {
            if (isEditMode) return undefined; // Disable drag in edit mode
            const inverted = transformRef.current.invert([event.x, event.y]);
            return simulationRef.current?.find(inverted[0], inverted[1], 10 / transformRef.current.k);
        })
        .on('start', (event) => {
            if (!event.active && isSimulating) simulationRef.current?.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        })
        .on('drag', (event) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        })
        .on('end', (event) => {
            if (!event.active && isSimulating) simulationRef.current?.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        });

    const d3Canvas = select(canvas);
    d3Canvas.call(dragBehavior);
    d3Canvas.call(zoomBehavior);

    const handleMouseMove = (event: MouseEvent) => {
        if (isEditMode) {
          setTooltip(null);
          return;
        }
        const { left, top } = canvas.getBoundingClientRect();
        const pos = { x: event.clientX - left, y: event.clientY - top };
        const inverted = transformRef.current.invert([pos.x, pos.y]);
        const node = simulationRef.current?.find(inverted[0], inverted[1], 10 / transformRef.current.k);
        
        if (node) {
            setTooltip({ node, pos });
        } else {
            setTooltip(null);
        }
    };

    const handleClick = (event: MouseEvent) => {
        if (!isEditMode) return;
        const { left, top } = canvas.getBoundingClientRect();
        const pos = { x: event.clientX - left, y: event.clientY - top };
        const inverted = transformRef.current.invert([pos.x, pos.y]);
        const node = simulationRef.current?.find(inverted[0], inverted[1], 10 / transformRef.current.k);
        if (node) {
            onNodeClick(node.id);
        }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);

    return () => {
        d3Canvas.on('.zoom', null).on('.drag', null);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('click', handleClick);
    };
  }, [renderCanvas, isSimulating, isEditMode, onNodeClick]);
  
  const handleZoom = (factor: number) => {
    const canvas = select(canvasRef.current);
    canvas.transition().duration(300).call(zoom<HTMLCanvasElement, unknown>().scaleBy, factor);
  };
  
  const handleReset = () => {
    const canvas = select(canvasRef.current);
    canvas.transition().duration(500).call(zoom<HTMLCanvasElement, unknown>().transform, zoomIdentity);
  }

  const handleToggleSimulation = () => {
      setIsSimulating(prev => {
          const nextState = !prev;
          if (nextState) {
              simulationRef.current?.alpha(1).restart();
          } else {
              simulationRef.current?.stop();
          }
          return nextState;
      });
  }

  return (
    <div className="w-full h-full relative bg-panel-bg">
      <canvas ref={canvasRef} className={`w-full h-full ${isEditMode ? 'cursor-crosshair' : 'cursor-grab'}`} />
      {tooltip && <GraphTooltip node={tooltip.node} position={tooltip.pos} />}
      <GraphControls 
        onZoomIn={() => handleZoom(1.2)} 
        onZoomOut={() => handleZoom(0.8)} 
        onReset={handleReset} 
        onToggleSim={handleToggleSimulation} 
        isSimulating={isSimulating}
        onToggleEditMode={onToggleEditMode}
        isEditMode={isEditMode}
        onDeleteSelected={onDeleteSelected}
        onMergeSelected={onMergeSelected}
        selectionCount={selectedNodes.size}
      />
    </div>
  );
};

export default CognitiveGraphVisualizer;