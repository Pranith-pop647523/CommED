import store from '/store/store';

export class LatexManager {
    constructor() {
        
    }

    // Fetch current state from the Redux store
    getCurrentState() {
        return {
            nodes: store.getState().nodes,
            edges: store.getState().edges
        };
    }

    // Convert the graph data to 2D TikZ commands
    toTikz2D() {
        const { nodes, edges } = this.getCurrentState();
        let tikzStr = "\\begin{tikzpicture}\n";

        // Add nodes
        for (const node of nodes) {
            tikzStr += `  \\node at (${node.x},${node.y}) (${node.id}) {${node.id}};\n`;
        }

        // Add edges
        for (const edge of edges) {
            tikzStr += `  \\draw[->] (${edge.from}) -- (${edge.to}) node[midway, above] {${edge.label || ''}};\n`; // Adjust for optional labels
        }

        tikzStr += "\\end{tikzpicture}";
        return tikzStr;
    }

    // Convert the graph data to 3D TikZ commands
    toTikz3D() {
        const { nodes, edges } = this.getCurrentState();
        let tikzStr = "\\begin{tikzpicture}[z={(0.5cm,0.5cm)}]\n";
        tikzStr += "\\usetikzlibrary{3d}\n"; // Use 3D library

        // Add nodes
        for (const node of nodes) {
            tikzStr += `  \\node at (${node.x},${node.y},${node.z}) (${node.id}) {${node.id}};\n`;
        }

        // Add edges
        for (const edge of edges) {
            tikzStr += `  \\draw[->] (${edge.from}) -- (${edge.to});\n`;//
        }

        tikzStr += "\\end{tikzpicture}";
        return tikzStr;
    }

    formatGraphData() {
        const nodesFromRedux = store.getState().nodes;
        const edgesFromRedux = store.getState().edges;
    
        // Format the nodes and edges according to expected format
        const nodes = {
    
            movableNodes: nodesFromRedux.movableNodes,
          
        };
        const edges = {
          byId: edgesFromRedux.byId,
        };
    
        return { nodes, edges };
      }

    async generateAndDownloadPDF3D() {
        const { nodes, edges } = this.formatGraphData();

        try {
            const response = await fetch('https://latapi-eivyjuwacq-nw.a.run.app/api/v1/generate-3d-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nodes,  
                    edges
                  }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "graph3D.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            console.error('Error generating or downloading the PDF:', error);
        }
    }

    async generateAndDownloadLatex() {
            const { nodes, edges } = this.formatGraphData();
    
            try {
                const response = await fetch('https://latapi-eivyjuwacq-nw.a.run.app/api/v1/generate-3d-latex', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nodes,  
                        edges
                    }),
                });
    
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
    
                const data = await response.json();
                const latexCode = data.latex;
                const blob = new Blob([latexCode], { type: 'text/plain;charset=utf-8' });
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = "graph3D.tex";
                document.body.appendChild(a);
                a.click();
                a.remove();
            } catch (error) {
                console.error('Error generating or downloading the LaTeX code:', error);
            }
        }
    }
    

