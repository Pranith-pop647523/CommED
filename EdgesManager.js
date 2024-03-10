import * as THREE from 'three';
import { DirectedEdge } from '/customComponents/DirectedEdge';
import { removeEdge } from './reducers/edgeReducer';

export class EdgesManager {
    constructor(scene, store) {
        this.scene = scene;
        this.store = store;
        // Maintain a mapping of edge IDs to DirectedEdge instances for easy access
        this.edgesMap = new Map();
    }

    addEdge(sourceNodeId, destinationNodeId, labelText = 'abc') {
        const sourceNode = this.getNodeByCustomId(sourceNodeId);
        const destinationNode = this.getNodeByCustomId(destinationNodeId);

        if (!sourceNode || !destinationNode) {
            console.error('Source or destination node not found');
            return;
        }

        if(sourceNodeId === destinationNodeId){
            console.error('Source and destination node are same');
            return;
        }

        const edgeId = `${sourceNodeId}-${destinationNodeId}`;
        const line = new DirectedEdge(sourceNode.position, destinationNode.position, 'black', 0.15, 0.5, sourceNodeId, destinationNodeId,labelText);

        this.edgesMap.set(edgeId, line);

        // Add the edge to the Three.js scene
        line.addToScene(this.scene);

        console.log(sourceNodeId, destinationNodeId, labelText)

        // Dispatch an action to add the edge to the Redux store
        this.store.dispatch({
            type: 'edges/addEdge',
            payload: {
                id: edgeId,
                source: sourceNodeId,
                destination: destinationNodeId,
                label: labelText,
            }
        });
    }

    removeEdgeByID(edgeId) {
        // Use the edgesMap to find and remove the DirectedEdge instance
        const directedEdge = this.edgesMap.get(edgeId);
        if (directedEdge) {
            directedEdge.removeFromScene(this.scene);
            this.edgesMap.delete(edgeId); // Remove from the map

            // Dispatch the action to remove the edge from the Redux store
            this.store.dispatch(removeEdge(edgeId));
        } else {
            console.warn(`Edge with ID ${edgeId} not found.`);
        }
    }

    updateConnectedEdges(nodeId) {
        // Fetch updated node positions from the Redux store
        const state = this.store.getState();
        const nodes = state.nodes.movableNodes; 
        console.log('node ID:', nodeId);
        this.edgesMap.forEach((directedEdge, edgeId) => {
            if (directedEdge.group.userData.sourceNode === nodeId || directedEdge.group.userData.destinationNode === nodeId) {
                console.log('Updating edge:', edgeId);
                const sourceNode = nodes[directedEdge.group.userData.sourceNode];
                const destinationNode = nodes[directedEdge.group.userData.destinationNode];

    
                if (sourceNode && destinationNode) {
                    console.log('Updating edge:', edgeId);
                    // Update the directed edge with new source and target positions
                    directedEdge.updateSourceTarget(
                        new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
                        new THREE.Vector3(destinationNode.position.x, destinationNode.position.y, destinationNode.position.z)
                    );
                }
            }
        });
    }
    

    updateEdgeLabel(newLabel, edgeId) {
        // Find the directed edge instance by its ID
        console.log('edge ID:', edgeId);
        console.log(this.edgesMap)
        const directedEdge = this.edgesMap.get(edgeId);
        if (directedEdge) {
            // Update the label text of the directed edge
            directedEdge.updateText(newLabel);
    
            this.store.dispatch({
                type: 'edges/updateEdgeLabel',
                payload: {
                    id: edgeId,
                    label: newLabel,
                }
            });
    
            console.log(`Updated label of edge ${edgeId} to "${newLabel}"`);
        } else {
            console.warn(`Edge with ID ${edgeId} not found.`);
        }
    }
    

    getNodeByCustomId(customId) {
        let foundNode = null;
        this.scene.traverse((object) => {
            if (object.userData.id === customId) {
                foundNode = object;
            }
        });
        return foundNode;
    }

}
