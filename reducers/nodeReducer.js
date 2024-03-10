import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    centerNodes: {},
    movableNodes: {},
    allIds: {
        centerNodes: [],
        movableNodes: []
    }
};

const nodesSlice = createSlice({
    name: 'nodes',
    initialState,
    reducers: {
        // Adding a node
        addNode: (state, action) => {
            const node = action.payload;
            if (node.type === 'centerNode') {
                state.centerNodes[node.id] = node;
                state.allIds.centerNodes.push(node.id);
            } else if (node.type === 'movableNode') {
                state.movableNodes[node.id] = node;
                state.allIds.movableNodes.push(node.id);
            }
        },
        // Updating node position
        updateNodePosition: (state, action) => {
            const { id, position, type } = action.payload;
            if (type === 'centerNode' && state.centerNodes[id]) {
                state.centerNodes[id].position = position;
            } else if (type === 'movableNode' && state.movableNodes[id]) {
                state.movableNodes[id].position = position;
            }
        },
        // Removing a node
        removeNode: (state, action) => {
          const nodeId = action.payload;
          // Remove from centerNodes if present
          if (state.centerNodes[nodeId]) {
            delete state.centerNodes[nodeId];
            state.allIds.centerNodes = state.allIds.centerNodes.filter(id => id !== nodeId);
          }
          // Remove from movableNodes if present
          if (state.movableNodes[nodeId]) {
            delete state.movableNodes[nodeId];
            state.allIds.movableNodes = state.allIds.movableNodes.filter(id => id !== nodeId);
          }
          // Additional logic to remove connected edges could be placed here but it's cleaner to handle edge removal separately in the edgesSlice for clarity
        },
        

        updateNodeLabel: (state, action) => {
            const { id, newLabel } = action.payload;
            if (state.movableNodes[id]) {
                state.movableNodes[id].label = newLabel; // Update the node's label
            }
        },
        // Updating node visibility
        updateNodeVisibility: (state, action) => {
            const { id, visible, type } = action.payload;
            if (type === 'centerNode' && state.centerNodes[id]) {
                state.centerNodes[id].visible = visible;
            } else if (type === 'movableNode' && state.movableNodes[id]) {
                state.movableNodes[id].visible = visible;
            }
        },
    },
});

export const { addNode, updateNodePosition, updateNodeLabel , removeNode, updateNodeVisibility } = nodesSlice.actions;
export default nodesSlice.reducer;
