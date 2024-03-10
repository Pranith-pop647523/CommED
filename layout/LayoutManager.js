import store from '/store/store';

class LayoutManager {
  constructor() { 
  }

  // Method to format nodes and edges from the Redux store
  formatGraphData() {
    const nodesFromRedux = store.getState().nodes;
    const edgesFromRedux = store.getState().edges;

    // Formatting according to backend 
    const nodes = {

        movableNodes: nodesFromRedux.movableNodes,
      
    };
    const edges = {
      byId: edgesFromRedux.byId,
    };

    return { nodes, edges };
  }

  // Async method to fetch the layout for  graph
  async fetchGraphLayout(layoutAlgorithm = 'circular',dimensions ='2') {
    try {
      const { nodes, edges } = this.formatGraphData();

      // Send a request to the backend for computing the graph layout
      const response = await fetch('https://demo69-jtn65ncnpa-nw.a.run.app/get-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes,  
          edges,
          layoutAlgorithm,
          dimensions
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const layoutData = await response.json();
      console.log('Layout data: ', layoutData); 
      return layoutData; // This should include node positions etc
    } catch (error) {
      console.error('Error fetching graph layout: ', error);
      throw error; 
    }
  }
}

//get node positons from api 
//use edge info from redux to update them 
// essentially just call updateNodePosition + redux change for each node in the response

export default LayoutManager;
