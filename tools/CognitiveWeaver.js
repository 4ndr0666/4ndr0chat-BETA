/**
 * @file CognitiveWeaver.js
 * @description A standalone Node.js script to render a cognitive_graph JSON file
 * into a self-contained, interactive HTML visualization using D3.js.
 */
const fs = require('fs');
const path = require('path');

/**
 * Generates the full HTML content for the visualization.
 * @param {object} graphData - The cognitive graph data.
 * @returns {string} A complete HTML string.
 */
function createVisualizationHtml(graphData) {
  const jsonString = JSON.stringify(graphData);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cognitive Graph Weaving</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #0A0F1A;
            font-family: system-ui, sans-serif;
            color: #e0ffff;
        }
        svg {
            display: block;
        }
        .node text {
            pointer-events: none;
            font-size: 10px;
            fill: #fff;
            text-anchor: middle;
            paint-order: stroke;
            stroke: #0A0F1A;
            stroke-width: 3px;
            stroke-linecap: butt;
            stroke-linejoin: round;
        }
        .link {
            stroke-opacity: 0.6;
        }
        .tooltip {
            position: absolute;
            background-color: rgba(16, 24, 39, 0.9);
            border: 1px solid rgba(21, 173, 173, 0.3);
            border-radius: 4px;
            padding: 8px;
            color: #e0ffff;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        }
    </style>
</head>
<body>
    <div id="tooltip" class="tooltip"></div>
    <script>
        const graphData = ${jsonString};

        // Normalize data: d3 expects node IDs to be in the main list
        const concepts = graphData.concepts.map(c => ({ id: c.name, ...c }));
        const conceptMap = new Map(concepts.map(c => [c.id, c]));

        const nodes = concepts;
        const links = graphData.relationships.map(r => ({
            source: conceptMap.get(r.source),
            target: conceptMap.get(r.target),
            ...r
        })).filter(l => l.source && l.target); // Filter out broken links

        const width = window.innerWidth;
        const height = window.innerHeight;

        const svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            }))
            .append("g");
        
        const tooltip = d3.select("#tooltip");

        const colorScale = d3.scaleLinear()
            .domain([-1, 0, 1])
            .range(["#ef4444", "#a0f0f0", "#4ade80"]) // red, tertiary, green
            .clamp(true);

        const sizeScale = d3.scaleLinear()
            .domain([0, 1])
            .range([6, 20]) // min and max node radius
            .clamp(true);

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100).strength(l => l.weight * 0.2))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke", "rgba(21, 173, 173, 0.5)")
            .attr("stroke-width", d => Math.sqrt(d.weight) * 2);

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .attr("r", d => sizeScale(d.weight))
            .attr("fill", d => colorScale(d.sentiment));
        
        node.append("text")
            .text(d => d.name)
            .attr("dy", d => sizeScale(d.weight) + 12);
            
        node.on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                   .html(\`<strong>\${d.name}</strong><br/>Weight: \${d.weight.toFixed(2)}<br/>Sentiment: \${d.sentiment.toFixed(2)}\`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
        });

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        window.addEventListener('resize', () => {
          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;
          svg.attr('width', newWidth).attr('height', newHeight);
          simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2));
          simulation.alpha(0.3).restart();
        });
    </script>
</body>
</html>
  `;
}

/**
 * Main execution function.
 */
function main() {
  const [,, inputFile, outputFile] = process.argv;

  if (!inputFile || !outputFile) {
    console.error('WORK ORDER FAILED: Missing parameters.');
    console.error('Usage: node tools/CognitiveWeaver.js <path_to_graph.json> <output.html>');
    process.exit(1);
  }

  try {
    const inputPath = path.resolve(inputFile);
    const outputPath = path.resolve(outputFile);

    console.log(`[CognitiveWeaver] Reading cognitive threads from: ${inputPath}`);
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const graphData = JSON.parse(rawData);

    console.log(`[CognitiveWeaver] Weaving threads into tangible reality...`);
    const htmlContent = createVisualizationHtml(graphData);

    fs.writeFileSync(outputPath, htmlContent, 'utf-8');
    console.log(`[CognitiveWeaver] Success. Cognitive landscape materialized at: ${outputPath}`);

  } catch (error) {
    console.error('[CognitiveWeaver] Catastrophic failure during weaving process:', error.message);
    process.exit(1);
  }
}

main();
