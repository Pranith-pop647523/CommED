import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from 'three.meshline';

let cnt = 0;

let nodeIdCounter = 0;


function createCubeGrid(scene, gridSize, cubeSize) {
    const verticalLinesGroup = new THREE.Group();
    verticalLinesGroup.name = 'verticalLines';
    scene.add(verticalLinesGroup);



    // Material for the low-opacity center nod
    const centerNodeGeometry = new THREE.SphereGeometry(cubeSize * 0.1, 16, 16);   
    const numCubesPerEdge = gridSize % 2 === 0 ? gridSize + 1 : gridSize;
    const halfNumCubes = (numCubesPerEdge - 1) / 2;
    const start = -halfNumCubes * cubeSize;
    const end = halfNumCubes * cubeSize;

    for (let x = start; x <= end; x += cubeSize) {
        for (let y = start; y <= end; y += cubeSize) {
            for (let z = start; z <= end; z += cubeSize) {
                // Create lines for the cube grid
                //if (x < end) createAndAddLine(new THREE.Vector3(x, y, z), new THREE.Vector3(x + cubeSize, y, z), material, verticalLinesGroup);
                //if (y < end) createAndAddLine(new THREE.Vector3(x, y, z), new THREE.Vector3(x, y + cubeSize, z), material, verticalLinesGroup);
                //if (z < end) createAndAddLine(new THREE.Vector3(x, y, z), new THREE.Vector3(x, y, z + cubeSize), material, verticalLinesGroup);

                // Create a low-opacity center node at each cube center
                if (x < end && y < end && z < end) {
                    // Each center node gets a unique material instance for independent opacity control
                    const centerNodeMaterial = new THREE.MeshBasicMaterial({
                        color: 'black',
                        transparent: true,
                        opacity: 0.1 // Default low opacity
                    });

                    const centerNode = new THREE.Mesh(centerNodeGeometry, centerNodeMaterial);
                    centerNode.position.set(x + cubeSize / 2, y + cubeSize / 2, z + cubeSize / 2);
                    centerNode.userData = { //headache shouldve used typescript
                        isOccupied: false, // Custom flag for raycasting
                        isNode: true, // Custom flag for raycasting
                        id: centerNode.uuid, // Ensure each node has a unique ID
                        isCenterNode: true, // Custom flag for raycasting
                        highlighted: false, // Track highlight state
                        gridPosition: { x: x + cubeSize / 2, y: y + cubeSize / 2, z: z + cubeSize / 2 } // Store grid position for potential future use
                    };

                    scene.add(centerNode);
                }
        }
    }
    }
}



function createAndAddLine(start, end, material, group) {
    const line = new MeshLine();
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    line.setGeometry(geometry);
    const mesh = new THREE.Mesh(line.geometry, material);

    // Add custom properties for all three dimensions , caused many bugs because i forgor
    mesh.userData = {
        isGrid: true,
        xPosition: (start.x + end.x) / 2,
        yPosition: (start.y + end.y) / 2,
        zPosition: (start.z + end.z) / 2
    };
    
    mesh.userData.isGridLine = true;
    mesh.isVisible = false;
    group.add(mesh);
}


export { createCubeGrid };
export { createAndAddLine };