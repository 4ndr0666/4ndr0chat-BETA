import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3-force';
import { CognitiveGraphData, GraphNode, GraphLink } from '../services/cognitiveCore';
import GraphTooltip from './GraphTooltip';
import GraphControls from './GraphControls';

interface CognitiveGraphVisualizerProps {
  graphData: CognitiveGraphData;
}

const NODE_COLORS = {
  user: '#265D80', // blue
  ai: '#7F3F98',   // purple
  concept: '#3E725D', // green
  system: '#8C6D35', // orange
  summary: '#9E453B' // red
};

const CognitiveGraphVisualizer: React.FC<CognitiveGraphVisualizerProps> = ({ graphData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink>>();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [tooltip, setTooltip] = useState<{ node: GraphNode; pos: { x: number; y: number } } | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const [isSimulating, setIsSimulating] = useState(true);

  const initializeSimulation = useCallback(() => {
    if (!simulationRef.current) {
        simulationRef.current = d3.forceSimulation<GraphNode, GraphLink>()
            .force('link', d3.forceLink<GraphNode, GraphLink>().id(d => d.id).distance(50).strength(0.1))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(300, 300))
            .on('tick', () => renderCanvas());
    }
  }, []);

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

    // Draw links
    context.strokeStyle = 'rgba(128, 128, 128, 0.3)';
    context.lineWidth = 0.5;
    links.forEach(link => {
      if (typeof link.source !== 'string' && typeof link.target !== 'string') {
        context.beginPath();
        context.moveTo(link.source.x, link.source.y);
        context.lineTo(link.target.x, link.target.y);
        context.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      context.beginPath();
      context.arc(node.x, node.y, node.size, 0, 2 * Math.PI);
      context.fillStyle = NODE_COLORS[node.type] || '#ccc';
      context.fill();
    });

    // Draw labels for larger nodes
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '8px sans-serif';
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    nodes.forEach(node => {
      if (node.size > 8) {
        context.fillText(node.label, node.x, node.y);
      }
    });

    context.restore();
  }, [nodes, links]);

  useEffect(() => {
    initializeSimulation();
    const sim = simulationRef.current;
    if(sim){
        // Create copies to avoid mutation issues with d3
        const newNodes = graphData.nodes.map(n => ({...n}));
        const newLinks = graphData.links.map(l => ({...l}));
        
        setNodes(newNodes);
        setLinks(newLinks);

        sim.nodes(newNodes);
        sim.force<d3.ForceLink<GraphNode, GraphLink>>('link')?.links(newLinks);
        
        if (isSimulating) {
            sim.alpha(1).restart();
        }
    }
  }, [graphData, isSimulating, initializeSimulation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
        .scaleExtent([0.2, 8])
        .on('zoom', (event) => {
            transformRef.current = event.transform;
            renderCanvas();
        });

    const drag = d3.drag<HTMLCanvasElement, GraphNode>()
        .subject((event) => {
            const inverted = transformRef.current.invert([event.x, event.y]);
            return simulationRef.current?.find(inverted[0], inverted[1], 10);
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

    const d3Canvas = d3.select(canvas);
    d3Canvas.call(drag);
    d3Canvas.call(zoom);

    const handleMouseMove = (event: MouseEvent) => {
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
    
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
        d3Canvas.on('.zoom', null).on('.drag', null);
        canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [renderCanvas, isSimulating]);
  
  const handleZoom = (factor: number) => {
    const canvas = d3.select(canvasRef.current);
    canvas.transition().duration(300).call(d3.zoom<HTMLCanvasElement, unknown>().scaleBy, factor);
  };
  
  const handleReset = () => {
    const canvas = d3.select(canvasRef.current);
    canvas.transition().duration(500).call(d3.zoom<HTMLCanvasElement, unknown>().transform, d3.zoomIdentity);
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
      <canvas ref={canvasRef} className="w-full h-full" />
      {tooltip && <GraphTooltip node={tooltip.node} position={tooltip.pos} />}
      <GraphControls onZoomIn={() => handleZoom(1.2)} onZoomOut={() => handleZoom(0.8)} onReset={handleReset} onToggleSim={handleToggleSimulation} isSimulating={isSimulating} />
    </div>
  );
};

export default CognitiveGraphVisualizer;
