import { createSlice } from '@reduxjs/toolkit';
import { removeNode } from './nodeReducer'; 

// Initial state for the edges
const initialState = {
    byId: {},
    allIds: []
};

export const edgesSlice = createSlice({ 
    name: 'edges',
    initialState,
    reducers: {
        addEdge: (state, action) => {
            const edge = action.payload;
            state.byId[edge.id] = edge;
            state.allIds.push(edge.id);
        },
        updateEdge: (state, action) => {
            const { id, source, target } = action.payload;
            if (state.byId[id]) {
                state.byId[id] = { ...state.byId[id], source, target };
            }
        },
        removeEdge: (state, action) => {
            const edgeId = action.payload;
            delete state.byId[edgeId];
            state.allIds = state.allIds.filter(id => id !== edgeId);
        },
        updateEdgeLabel: (state, action) => {
            const { id, label } = action.payload;
            if (state.byId[id]) {
                // Update the label of the edge
                state.byId[id] = { ...state.byId[id], label };
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(removeNode, (state, action) => {
            const nodeId = action.payload;
            // Ensure there are edges to process
            if (state.allIds.length > 0) {
                const connectedEdges = state.allIds.filter(edgeId => {
                    const edge = state.byId[edgeId];
                    return edge && (edge.source === nodeId || edge.destination === nodeId);
                });
                connectedEdges.forEach(edgeId => {
                    delete state.byId[edgeId]; // Remove edge from byId
                    state.allIds = state.allIds.filter(id => id !== edgeId); // Remove edge from allIds
                });
            }
        });
    }
});

// Action creators created her
export const { addEdge, updateEdge, removeEdge, updateEdgeLabel } = edgesSlice.actions;

export default edgesSlice.reducer;
