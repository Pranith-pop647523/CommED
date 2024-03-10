import * as THREE from 'three';
import store from '/store/store.js'; 
import { updateNodePosition } from '/reducers/nodeReducer.js'; 
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import { createCubeGrid } from '/js/grid-utils.js'; 
import { addNode,removeNode , updateNodeLabel} from '/reducers/nodeReducer.js'; 
import { setCurrentViewingPlane } from '/reducers/sceneReducer.js'; 
import { setActiveCamera } from '/reducers/sceneReducer';
import { setLayerIndexXY,setLayerIndexXZ,setLayerIndexYZ } from '/reducers/sceneReducer';
import { updateNodeVisibility } from '/reducers/nodeReducer';
import { EdgesManager } from '/EdgesManager';
import { UIManager } from '/UI/UIManager';
import {TextNode} from '/customComponents/TextNode';
import LayoutManager from '/layout/LayoutManager.js';
import { jsPDF } from 'jspdf';
import {LatexManager} from '/LatexManager.js';

import { toggleOrbitControls, toggleDragControls } from '/reducers/uiControlsSlice';




class ThreeManager {
    constructor() {
        this.latexManager = new LatexManager();
        this.isEdgeCreationMode = false; // Flag to indicate edge creation mode
        this.pendingEdge = { source: null, destination: null };
       // this.toggleRemoveNodeMode = this.toggleRemoveNodeMode.bind(this);
       // this.toggleRemoveEdgeMode = this.toggleRemoveEdgeMode.bind(this);
        this.removeNodeMode = false; // True when in node removal mode
        this.removeEdgeMode = false;
        this.textNodes = {};
        this.isDialogVisible = false;

        this.velocity = new THREE.Vector3(0, 0, 0);
        this.isUpdating = false;




        this.layoutManager = new LayoutManager('http://localhost:5000');


        this.animationFrameId = null;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff); //  white

        this.edgesManager = new EdgesManager(this.scene, store);

        this.gridSize = 12; 
        this.cubeSize = 5; 

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        

        this.keysPressed = {};
        this.perspectiveCamera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.perspectiveCamera.position.set(0, 0, 0); 
        
        this.orthographicCamera = new THREE.OrthographicCamera(
            window.innerWidth / -32.5,
            window.innerWidth / 32.5,
            window.innerHeight / 32.5,
            window.innerHeight / -32.5,
            0.1,
            1000
        );
        this.orthographicCamera.position.set(0, 0, 0); // Offset it to make the difference noticeable
        this.orthographicCamera.lookAt(0, 0, 0); // Look at the center of the scene
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.currentCamera = this.perspectiveCamera; // Default camera

        // Adjusting camera positions for visibility
        this.perspectiveCamera.position.z = 70;
        this.orthographicCamera.position.z = 5;



        // Cube
        
        createCubeGrid(this.scene, this.gridSize, this.cubeSize);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.currentlyHighlighted = null; 
        

        this.setupControls();
        this.setupMouseEvents();
        this.setupEventListeners();
        this.setupLayerNavigation();

        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('3d-graph').appendChild(this.renderer.domElement);

        // Subscribe to store changes
        store.subscribe(() => {
            const state = store.getState();
            const activeCameraId = state.scene.activeCameraId; // Access the correct state slice
            threeManager.switchCamera(activeCameraId);
            const { orbitControlsEnabled, dragControlsEnabled } = store.getState().uiControls;
            this.orbitControls.enabled = orbitControlsEnabled;
            this.dragControls.enabled = dragControlsEnabled;
            this.updateNodeDrag(dragControlsEnabled);
            this.updateOrb(orbitControlsEnabled);
        });
 
        document.getElementById('snapToXYButton').addEventListener('click', () => {
            this.snapToXYPlane();
        });
        document.getElementById('snapToXZButton').addEventListener('click', () => {
            this.snapToXZPlane();
        });
        document.getElementById('snapToYZButton').addEventListener('click', () => {
            this.snapToYZPlane();
        });

        this.handleCameraChange(); // Initialize camera with current state

        this.uiManager = new UIManager(this,store);
        this.render();
        

    }

     
    setDialogVisibility(isVisible) {
        this.isDialogVisible = isVisible;
    }


    updateAllEdgesOfNode(nodeId) {
        this.edgesManager.updateConnectedEdges(nodeId);
    }



    createEdge(sourceId, destinationId) { //pretty hacky but works
        let sourceNode = null;
        let destinationNode = null;
        let foundSource = false;
        let foundDestination = false;
    
        // Traverse the scene to find movable nodes by their userData.id
        this.scene.traverse((object) => {
            if (object.type === 'Sprite' && object.userData.type === 'movableNode') {
                if (!foundSource && object.userData.id === sourceId) {
                    sourceNode = object;
                    foundSource = true; // Mark as found to prioritize over center nodes
                }
                if (!foundDestination && object.userData.id === destinationId) {
                    destinationNode = object;
                    foundDestination = true; // Mark as found to prioritize over center nodes
                }
            }
        });
    
        // Additional check for center nodes if movable nodes are not found in the same position
        if (!sourceNode || !destinationNode) {
            this.scene.traverse((object) => {
                if (object.userData.type === 'centerNode') {
                    if (!foundSource && object.userData.id === sourceId) {
                        sourceNode = object; // Consider center node if movable node wasn't found
                    }
                    if (!foundDestination && object.userData.id === destinationId) {
                        destinationNode = object; // Consider center node if movable node wasn't found
                    }
                }
            });
        }
    
        // Proceed if both nodes are found
        if (sourceNode && destinationNode) {// Create the edge in the edgesManager
            this.edgesManager.addEdge(sourceId, destinationId,'edge');
            this.isEdgeCreationMode = false;
            this.updateMode(false);
        } else {
            console.error('Could not find source or destination node');
        }
    }
    

    updateViewingPlane(plane) {
        document.getElementById('current-plane').textContent = plane;
    }
    
    updatePlaneIndex(index) {
        document.getElementById('plane-index').textContent = index;
    }
    
    updateMode(isEdgeCreationMode) {
        const modeText = isEdgeCreationMode ? 'Creating Edge' : 'Not Creating Edge';
        document.getElementById('current-mode').textContent = modeText;
    }
    updateNodeDrag(dragControlsEnabled) {
        const modeText = dragControlsEnabled ? 'Enabled' : 'Disabled';
        document.getElementById('drag-mode').textContent = modeText;
    }
    updateOrb(orbControlsEnabled) {
        const modeText = orbControlsEnabled ? 'Enabled' : 'Disabled';
        document.getElementById('orb-mode').textContent = modeText;
    }
    
    
    


    toggleEdgeCreationMode() {
        this.updateMode(!this.isEdgeCreationMode);
        this.isEdgeCreationMode = !this.isEdgeCreationMode;
        if (!this.isEdgeCreationMode && this.pendingEdge.line) {
            // Remove the temporary line if exiting edge creation mode
            this.scene.remove(this.pendingEdge.line);
            this.pendingEdge = { source: null, destination: null, line: null };
        }
    }

    onNodeClick(node) {
        if (this.isEdgeCreationMode) {
            if (!this.pendingEdge.source) {
                // First click selects the source node
                this.pendingEdge.source = node;
            } else {
                // Second click selects the destination node and creates the edge
                this.pendingEdge.destination = node;
                this.createEdge(this.pendingEdge.source.userData.id, this.pendingEdge.destination.userData.id);
                // Remove temporary line
                if (this.pendingEdge.line) {
                    this.scene.remove(this.pendingEdge.line);
                }
                // Reset for next edge creation
                this.pendingEdge = { source: null, destination: null, line: null };
            }
        }
    }
    

    captureAndConvertToPDF() {
        window.requestAnimationFrame(() => {
            const imgData = this.renderer.domElement.toDataURL('image/png');
    
            const canvasWidth = this.renderer.domElement.width;
            const canvasHeight = this.renderer.domElement.height;
    
            const pdf = new jsPDF({
                orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvasWidth, canvasHeight]
            });
    
            pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);
            pdf.save('screenshot.pdf');
        });
    }
    

    setupLayerNavigation() {
        document.getElementById('nextLayerButton').addEventListener('click', () => {
            this.nextLayer();
        });

        document.getElementById('previousLayerButton').addEventListener('click', () => {
            this.previousLayer();
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            if (this.isDialogVisible) {
                // If a dialog is visible don't update the camera position
                return;
            }
            else if (event.key === 'o') {
              store.dispatch(toggleOrbitControls());
          } else if (event.key === 'm') {
              store.dispatch(toggleDragControls());
          }
        });

        document.getElementById('infoButton').addEventListener('click', function() {
            document.getElementById('welcomeScreen').style.display = 'flex';
        });
    
        document.getElementById('getStartedButton').addEventListener('click', function() {
            document.getElementById('welcomeScreen').style.display = 'none';
        });
        
        document.getElementById('toggleEdgeModeButton').addEventListener('click', () => {
            threeManager.toggleEdgeCreationMode();
        });
        document.getElementById('3d-option-1').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('spring',3);
        });
        document.getElementById('3d-option-2').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('spectral',3);
        });
        document.getElementById('3d-option-3').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('kawai',3);
        });
        document.getElementById('3d-option-4').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('circle',3);
        });
        document.getElementById('2d-option-1').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('spring',2);
        });
        document.getElementById('2d-option-2').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('circle',2);
        });
        document.getElementById('2d-option-3').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('kawai',2);
        });
        document.getElementById('2d-option-4').addEventListener('click', () => { //2D have to make for 3D
            threeManager.getLayoutManagerCoordsForLayout('planar',2);
        });
        document.getElementById('2d-option-5').addEventListener('click', () => {
            threeManager.getLayoutManagerCoordsForLayout('spiral',2);
            
        });
        document.addEventListener('keydown', (event) => {
            if (this.isDialogVisible) {
                // If a dialog is visible don't update the camera position
                return;
            }
            else if (event.key === 'q' || event.key === 'Q') {
                this.toggleEdgeCreationMode();
            }
        });
        document.getElementById('captureAndConvertButton').addEventListener('click', () => this.captureAndConvertToPDF());
   
        document.getElementById('latexButton').addEventListener('click', () => this.generateLatex());
        document.getElementById('pdfButton').addEventListener('click', () => this.generatePDFClick());
        
        
        const makeAllNodesVisibleButton = document.getElementById('makeAllNodesVisibleButton'); 
        const invis = document.getElementById('invisibleButton')

    
        makeAllNodesVisibleButton.addEventListener('click', () => {
            this.makeAllNodesVisible();
            const state = store.getState();

            switch (state.scene.currentViewingPlane) {
                case 'XY':
                    this.snapToXYPlane();
                    break;
                case 'XZ':
                    this.snapToXZPlane();
                    break;
                case 'YZ':
                    his.snapToXZPlane();
                    break;
        }
        });

        invis.addEventListener('click' , () => {
            this.makeAllNodesInvisibleVisible()
        });


        const switchToPerspectiveCameraBtn = document.getElementById('perspectiveButton');
        if (switchToPerspectiveCameraBtn) {
            switchToPerspectiveCameraBtn.addEventListener('click', () => {
                this.makeAllNodesVisible()
                this.switchToPerspectiveCamera();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (['w', 'a', 's', 'd','q','e'].includes(event.key)) {
                this.keysPressed[event.key] = true;
                this.startUpdateLoop();
            }
        });
    
        document.addEventListener('keyup', (event) => {
            if (['w', 'a', 's', 'd','q','e'].includes(event.key)) {
                this.keysPressed[event.key] = false;
                this.checkForStop();
            }
        });
    }

    startUpdateLoop() {
        if (!this.isUpdating) {
            this.isUpdating = true;
            this.updateLoop();
        }
    }
    
    checkForStop() {
        if (!['w', 'a', 's', 'd','q','e'].some(key => this.keysPressed[key])) {
            this.isUpdating = false;
        }
    }
    
    updateLoop() {
        if (this.isUpdating){
            this.updateCameraPosition();
            requestAnimationFrame(this.updateLoop.bind(this));
        }
    }
    

    updateCameraPosition() {
        if (this.isDialogVisible) {
            // If a dialog is visible don't update the camera position
            return;
        }
        const acceleration = 0.015;
        const maxSpeed = 0.5;
        const friction = 0.9; // Slow down when keys are released
    
        // Define movement vectors for each plane
        let moveHorizontal = new THREE.Vector3();
        let moveVertical = new THREE.Vector3();

        const state = store.getState();


        switch (state.scene.currentViewingPlane) {
            case 'XY':
                moveHorizontal.set(1, 0, 0); 
                moveVertical.set(0, 1, 0); 
                break;
            case 'YZ':
                moveHorizontal.set(0, 0, -1); 
                moveVertical.set(0, 1, 0); 
                break;
            case 'XZ':
                moveHorizontal.set(1, 0, 0); 
                moveVertical.set(0, 0, -1); 
                break;
            case '3D':
                return

        }
    
        // Apply movement based on key presses
        if (this.keysPressed['w']) this.velocity.addScaledVector(moveVertical, acceleration);
        if (this.keysPressed['s']) this.velocity.addScaledVector(moveVertical, -acceleration);
        if (this.keysPressed['a']) this.velocity.addScaledVector(moveHorizontal, -acceleration);
        if (this.keysPressed['d']) this.velocity.addScaledVector(moveHorizontal, acceleration);
    
        // Ensure velocity does not exceed maxSpeed in any direction
        this.velocity.x = Math.max(Math.min(this.velocity.x, maxSpeed), -maxSpeed);
        this.velocity.y = Math.max(Math.min(this.velocity.y, maxSpeed), -maxSpeed);
        this.velocity.z = Math.max(Math.min(this.velocity.z, maxSpeed), -maxSpeed);
    
        // Update camera position
        this.currentCamera.position.add(this.velocity);
    
        // Apply friction
        this.velocity.multiplyScalar(friction);
    
        // If velocity is very low stop updating to prevent endless loop
        if (this.velocity.lengthSq() < 0.00001) {
            this.velocity.set(0, 0, 0);
            this.checkForStop(); // Stop the loop if no keys are pressed
        }
    
        // Render the scene
        this.render();
    }
    
    
    

   
    

    handleCameraChange() {
        const state = store.getState();
        const activeCameraType = state.camera.cameraType;

        // Check if the current camera type is different from the state camera type
        if (this.currentCameraType !== activeCameraType) {
            this.currentCameraType = activeCameraType;
            this.switchCamera(activeCameraType);
        }
    }

    switchCamera(cameraId) {
        this.currentCamera = cameraId === 'perspective' ? this.perspectiveCamera : this.orthographicCamera;
        // No need to dispatch an action here since were just updating the  camera
        this.render();
    }

    setupControls() {

        const movableNodes = this.scene.children.filter(child => child.userData.movable);

        this.orbitControls = new OrbitControls(this.currentCamera, this.renderer.domElement);
        this.dragControls = new DragControls(movableNodes, this.currentCamera, this.renderer.domElement);
        this.dragControls.addEventListener('dragmove', event => {
            this.orbitControls.enabled = false; // Disable orbit controls while dragging
          
        });
        // Initial state from Redux
        const { orbitControlsEnabled, dragControlsEnabled } = store.getState().uiControls;
        this.orbitControls.enabled = orbitControlsEnabled;
        this.dragControls.enabled = dragControlsEnabled;
        this.dragControls.addEventListener('dragend', event => {
            this.orbitControls.enabled = true; // Re enable orbit controls after drag
        
            // Perform raycasting to find where the mouse intersects with the plane
            this.raycaster.setFromCamera(this.mouse, this.currentCamera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            const visibleIntersects = intersects.filter(intersect => intersect.object.visible);
            const highlightedNode = visibleIntersects.find(intersect => intersect.object.userData.isCenterNode); // Include your plane or grid geometry here
        
            if (highlightedNode) {
                // Adjust the intersect point to the nearest cube center
                const adjustedPosition = highlightedNode.object.position
                // Set the object's position to the adjusted position
                event.object.position.copy(adjustedPosition);
            }else{
                // Adjust object position to the nearest cube center
                object.position.x = this.adjustToNearestCubeCenter(object.position.x);
                object.position.y = this.adjustToNearestCubeCenter(object.position.y);
                object.position.z = this.adjustToNearestCubeCenter(object.position.z);
                }


            this.textNodes[object.userData.id].position = object.position
            
            
            store.dispatch(updateNodePosition({id:object.userData.id,
                position:{x:object.position.x , y:object.position.y, z:object.position.z}
               ,type:object.userData.type}));
            this.updateAllEdgesOfNode(object.userData.id);
        });
    }

    adjustToNearestCubeCenter(coordinate) {
        const cubeIndex = Math.floor(coordinate / this.cubeSize);
        const centerOfCube = cubeIndex * this.cubeSize + this.cubeSize / 2;
        return centerOfCube;
    }
    

    
    
    render() {
        // Cancel the previous animation frame before starting a new one
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
        }
    
        // Update all edges before rendering the scene

    
        this.animationFrameId = requestAnimationFrame(() => this.render());
       
        this.renderer.render(this.scene, this.currentCamera);
    }
    

    refreshDragControls() {
        const movableNodes = this.scene.children.filter(child => child.userData.movable);
        
        this.dragControls.dispose();
        // Reinitialize DragControls with the updated nodes
        this.dragControls = new DragControls(movableNodes, this.currentCamera, this.renderer.domElement);
    
        this.dragControls.addEventListener('dragstart', (event) => {
            const object = event.object;
        
            object.userData.originalPosition = object.position.clone();
        });
        this.dragControls.addEventListener('drag', event => {
            const object = event.object;
            store.dispatch(updateNodePosition({id:object.userData.id,
                position:{x:object.position.x , y:object.position.y, z:object.position.z}
               ,type:object.userData.type}));
            this.updateAllEdgesOfNode(object.userData.id);
        });
        this.dragControls.addEventListener('dragmove', event => {
            this.orbitControls.enabled = false; // Disable orbit controls while dragging
           
        });


        this.dragControls.addEventListener('dragend', event => {
            this.orbitControls.enabled = true; // Re enable orbit controls after drag

                const object = event.object; // The node that was moved
            
                const originalCenterNode = this.findNearestCenterNode(object.userData.originalPosition);
                if (originalCenterNode && originalCenterNode.userData.occupied) {
                    originalCenterNode.userData.occupied = false;
                    originalCenterNode.visible = true;
                }
            
            delete object.userData.originalPosition;

            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            const visibleIntersects = intersects.filter(intersect => intersect.object.visible);
            const highlightedNode = visibleIntersects.find(intersect => intersect.object.userData.isCenterNode); // Include your plane or grid geometry here
        
            if (highlightedNode) {
                // Adjust the intersect point to the nearest cube center
                const adjustedPosition = highlightedNode.object.position
                // Set the object position to the adjusted position
                event.object.position.copy(adjustedPosition);
            }else{
            

                // Adjust object position to the nearest cube center
                object.position.x = this.adjustToNearestCubeCenter(object.position.x);
                object.position.y = this.adjustToNearestCubeCenter(object.position.y);
                object.position.z = this.adjustToNearestCubeCenter(object.position.z);
                }
                this.textNodes[object.userData.id].position = object.position
                store.dispatch(updateNodePosition({id:object.userData.id,
                     position:{x:object.position.x , y:object.position.y, z:object.position.z}
                    ,type:object.userData.type}));

                    
                    const newCenterNode = this.findNearestCenterNode(object.position);
                    if (newCenterNode && !newCenterNode.userData.occupied) {
                        // Mark the new centerNode as occupied and make it invisible
                        newCenterNode.userData.occupied = true;
                        newCenterNode.visible = false;
                
                        // Update the nodes userData with the new original position for future moves
                        object.userData.originalPosition = object.position.clone();
                    }

            this.updateAllEdgesOfNode(object.userData.id);
        });
    }

    createGrid() {
        createCubeGrid(this.scene, 8, 5, store);
    }
    setupMouseEvents() {
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        this.renderer.domElement.addEventListener('dblclick', this.onDoubleClick.bind(this), false);
        this.renderer.domElement.addEventListener('click', this.onClick.bind(this), false);
    }

    highlightNode(node) {
        node.material.opacity = 0.5;
    }

    resetHighlight(node) {
        node.material.opacity = 0.1;
    }

    onClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.currentCamera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const visibleIntersects = intersects.filter(intersect => intersect.object.visible);
        const highlightedNode = visibleIntersects.find(intersect => intersect.object.userData.isCenterNode);

        const clickedNode = visibleIntersects.find(intersect => intersect.object.userData.type === 'movableNode');
        

        if (clickedNode && this.isEdgeCreationMode) {
            this.onNodeClick(clickedNode.object);
        }
        if (!clickedNode && this.isEdgeCreationMode) {
            this.toggleEdgeCreationMode();
        }
    }
    
    onDoubleClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.currentCamera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        const visibleIntersects = intersects.filter(intersect => intersect.object.visible);
        const highlightedNode = visibleIntersects.find(intersect => intersect.object.userData.isCenterNode);
    
        const clickedNode = visibleIntersects.find(intersect => intersect.object.userData.type === 'movableNode');

        if (this.removeNodeMode) {
            // Handle node removal
            const clickedNode = intersects.find(intersect => intersect.object.userData.type === 'movableNode' || intersect.object.userData.type === 'centerNode');
            if (clickedNode) {
                this.removeNodeById(clickedNode.object.userData.id);
            }


        } else if (this.removeEdgeMode) {
            const clickedEdge = intersects.find(intersect => intersect.object.userData.isEdge || intersect.object.userData.isEdgeComponent);

            if (clickedEdge) {
                this.removeDirectedEdge(clickedEdge);

            }
            
            

        }



        if (highlightedNode ) {
            
            const existingMovable = this.scene.children.find(obj => 
                obj.userData.movable && obj.position.equals(highlightedNode.object.position));
        
            if (!existingMovable && !this.removeNodeMode && !this.isEdgeCreationMode ) {
                highlightedNode.object.userData.occupied = true;
                highlightedNode.object.visible = false; 

                const nodeLabelText = 'Obj'; // Placeholder 
                const solidNodeGeometry = new THREE.SphereGeometry(this.cubeSize * 0.1, 16, 16); 
                const newNode = new THREE.Mesh(solidNodeGeometry, new THREE.MeshBasicMaterial({color: 'black'}));
                const id = newNode.uuid;
                delete newNode.geometry;
                delete newNode.material;
                
                //just use ts next time lol
                const textNode = new TextNode( // Use the UUID as the node ID
                    id, // Pass the UUID as the ID
                    highlightedNode.object.position.clone(), 
                    nodeLabelText, // The label text for the node
                    this.scene, 
                    this.cubeSize * 2.5 
                );
                this.textNodes[id] = textNode;
                
                textNode.labelSprite.userData = {
                    id: id,
                    movable: true,
                    type: 'movableNode',
                    isNode: true,
                    label: nodeLabelText ,
                };
        
                store.dispatch(addNode({
                    isNode: true,
                    id: textNode.userData.id,
                    type: 'movableNode',
                    label: nodeLabelText,
                    position: { x: textNode.position.x, y: textNode.position.y, z: textNode.position.z }
                }));
        
                this.refreshDragControls();
            }
        }
        
    }

    getNodeIdFromClick(clickedNode) {
        let nodeId = null;
        if(clickedNode.object.type === 'Sprite' && clickedNode.object.userData.type === 'movableNode') {
        nodeId =  clickedNode.object.userData.id;
        }
        return nodeId;
    }
        


    getEdgeIdFromClick(clickedEdge) {
        let directedEdgeInstance = null;
    
        if (clickedEdge.object.userData && clickedEdge.object.userData.directedEdgeInstance) {
            directedEdgeInstance = clickedEdge.object.userData.directedEdgeInstance;
        }
        // If the object doesnt contain the reference check its parent
        else if (clickedEdge.object.parent && clickedEdge.object.parent.userData && clickedEdge.object.parent.userData.directedEdgeInstance) {
            directedEdgeInstance = clickedEdge.object.parent.userData.directedEdgeInstance;
        }
    
        if (directedEdgeInstance) {
            const edgeId = `${directedEdgeInstance.group.userData.sourceNode}-${directedEdgeInstance.group.userData.destinationNode}`;
            return edgeId;
        }
    
        return null;
    }
    

    removeDirectedEdge(clickedEdge) {
        let directedEdgeInstance = null;
    
        if (clickedEdge.object.userData && clickedEdge.object.userData.directedEdgeInstance) {
            directedEdgeInstance = clickedEdge.object.userData.directedEdgeInstance;
        }
        else if (clickedEdge.object.parent && clickedEdge.object.parent.userData && clickedEdge.object.parent.userData.directedEdgeInstance) {
            directedEdgeInstance = clickedEdge.object.parent.userData.directedEdgeInstance;
        }
    
        if (directedEdgeInstance) {
            const edgeId = `${directedEdgeInstance.group.userData.sourceNode}-${directedEdgeInstance.group.userData.destinationNode}`;
            this.edgesManager.removeEdgeByID(edgeId);
        }
    }

    findNearestCenterNode(position) {
        let nearestNode = null;
        let nearestDistance = Infinity;
        this.scene.traverse((child) => {
            if (child.userData.isCenterNode) {
                const distance = child.position.distanceTo(position);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestNode = child;
                }
            }
        });
        return nearestNode;
    }
    
    
    
    
    snapToXYPlane() {
        const state = store.getState();
        const layerIndex = state.scene.currentLayerIndexXY; 
        this.updateViewingPlane('XY');
        this.updatePlaneIndex(layerIndex)

        const plane = 'XY';
        this.adjustOrthoCameraForLayer(layerIndex, plane);
        store.dispatch(setCurrentViewingPlane('XY'));
        this.switchCamera('orthographic'); 
        this.updateLayerVisibilityXY(); 
        this.refreshDragControls()   
        this.orbitControls.enabled = false;
        this.render();
    }

    removeNodeById(nodeId) {
        // Dispatch action to remove the node from Redux
        store.dispatch(removeNode(nodeId));
    
        // Find and remove the node in the Three.js scene
        const nodeObject = this.scene.getObjectByProperty('uuid', nodeId);
        if (nodeObject) {
            this.scene.remove(nodeObject);
            if (nodeObject.geometry) nodeObject.geometry.dispose();
            if (nodeObject.material) nodeObject.material.dispose();
        }
    
        // Collect edges to remove
        const edgesToRemove = [];
        this.scene.traverse(object => {
            if (object.userData.isEdge &&
                (object.userData.sourceNode === nodeId || object.userData.destinationNode === nodeId)) {
                edgesToRemove.push(object);
            }
        });
    
    
        // Remove collected edges
        edgesToRemove.forEach(edge => {

            this.removeDirectedEdge({object: edge}); 
        });
        //TODO node not visible after deleting
        const nearestCenterNode = this.findNearestCenterNode(nodeObject.position);
        if (nearestCenterNode) {
                nearestCenterNode.visible = true; 
                nearestCenterNode.userData.occupied = false;// Make the centerNode visible again
            }
        
        
        delete this.textNodes[nodeId]
        
        


    }
    


    

    snapToXZPlane() 
        {
            const state = store.getState();
            const layerIndex = state.scene.currentLayerIndexXZ; 
            const plane = 'XZ';

            this.updateViewingPlane(plane);
            this.updatePlaneIndex(layerIndex)
            this.adjustOrthoCameraForLayer(layerIndex, plane);
            store.dispatch(setCurrentViewingPlane('XZ'));
            this.switchCamera('orthographic'); 
            this.updateLayerVisibilityXZ(); 
            this.refreshDragControls()   
            this.orbitControls.enabled = false;
            this.render();
        }

    snapToYZPlane() 
        {
            const state = store.getState();
            const layerIndex = state.scene.currentLayerIndexYZ; 
            const plane = 'YZ';
            this.updateViewingPlane(plane);
            this.updatePlaneIndex(layerIndex)
            this.adjustOrthoCameraForLayer(layerIndex, plane);
            store.dispatch(setCurrentViewingPlane('YZ'));
            this.switchCamera('orthographic'); 
            this.updateLayerVisibilityYZ(); 
            this.refreshDragControls()   
            this.orbitControls.enabled = false;
            this.render();
        }

        updateLayerVisibilityXZ() {
            const state = store.getState();
            
            const currentLayerIndexXZ = state.scene.currentLayerIndexXZ;
            const cubeSize = this.cubeSize;
            const totalHeight = (this.gridSize - 1) * cubeSize;
            const maxY = totalHeight / 2; // Starting Y for the topmost layer.
            
            const yPosition = maxY - ((currentLayerIndexXZ - 1) * cubeSize);
            const yPositionBelow = yPosition - cubeSize;
        
            state.nodes.allIds.movableNodes.forEach(nodeId => {
                const node = state.nodes.movableNodes[nodeId];
                if (node) {
                    // Update visibility based on whether the node's Y position falls within the current layer range.
                    const isVisible = node.position.y <= yPosition && node.position.y > yPositionBelow;
                    store.dispatch(updateNodeVisibility({ id: nodeId, visible: isVisible }));
        
                    const object = this.scene.getObjectByProperty('uuid', nodeId);
                    if (object) {
                        object.visible = isVisible;
                    }
                }
            });
        
            this.scene.traverse(object => {
                if (object.userData.isCenterNode) {
                    const isVisible = object.position.y <= yPosition && object.position.y > yPositionBelow && !object.userData.occupied;
                    object.visible = isVisible;
                }
            });
        
            this.scene.traverse(object => {
                if (object.userData.isEdge) {
                    const sourceNode = this.scene.getObjectByProperty('uuid', object.userData.sourceNode);
                    const destinationNode = this.scene.getObjectByProperty('uuid', object.userData.destinationNode);
        
                    // Determine visibility of the edge based on the visibility of its source and destination nodes.
                    const edgeVisible = sourceNode && destinationNode && sourceNode.visible && destinationNode.visible;
                    object.visible = edgeVisible;
                }
            });
        
            this.render(); 
        }
        
        updateLayerVisibilityYZ() {
            const state = store.getState();
            
            const currentLayerIndexYZ = state.scene.currentLayerIndexYZ;
            const cubeSize = this.cubeSize; 
            // Calculate the total length of the grid in the X direction.
            const totalLengthX = (this.gridSize - 1) * cubeSize;
            
            const startX = totalLengthX / 2; // Most positive X value for layer 1.
        
            
            const xPosition = startX - ((currentLayerIndexYZ - 1) * cubeSize);
            const xPositionBelow = xPosition - cubeSize; 
        
            state.nodes.allIds.movableNodes.forEach(nodeId => {
                const node = state.nodes.movableNodes[nodeId];
                if (node) { 
                    
                    const isVisible = node.position.x <= xPosition && node.position.x > xPositionBelow;
                    store.dispatch(updateNodeVisibility({ id: nodeId, visible: isVisible }));
        
                    const object = this.scene.getObjectByProperty('uuid', nodeId);
                    if (object) {
                        object.visible = isVisible;
                    }
                }
            });
        
            this.scene.traverse(object => {
                if (object.userData.isCenterNode) {
                    const isVisible = object.position.x <= xPosition && object.position.x > xPositionBelow && !object.userData.occupied;
                    object.visible = isVisible;
                }
            });
        
            this.scene.traverse(object => {
                if (object.userData.isEdge) {
                    const sourceNode = this.scene.getObjectByProperty('uuid', object.userData.sourceNode);
                    const destinationNode = this.scene.getObjectByProperty('uuid', object.userData.destinationNode);
        
                    // Check if both nodes that form the edge are visible
                    const edgeVisible = sourceNode && destinationNode && sourceNode.visible && destinationNode.visible;
                    object.visible = edgeVisible;
                }
            });
        
            this.render(); 
        }
        
    updateLayerVisibilityXY() {
        const state = store.getState();
        const currentLayerIndexXY = state.scene.currentLayerIndexXY;
    
        const cubeSize = this.cubeSize; 
       
        const halfGridTotalLength = (this.gridSize - 1) * cubeSize / 2; 
        
        const zPosition = 27.5 - ((currentLayerIndexXY - 1) * (cubeSize));
        
        const zPositionBelow = zPosition - cubeSize;
    
        state.nodes.allIds.movableNodes.forEach(nodeId => {
            const node = state.nodes.movableNodes[nodeId];
            if (node) { 
                
                const isVisible = node.position.z <= zPosition && node.position.z > zPositionBelow;
                store.dispatch(updateNodeVisibility({ id: nodeId, visible: isVisible }));
    
                const object = this.scene.getObjectByProperty('uuid', nodeId);
                if (object) {
                    object.visible = isVisible;
                }
            }
        });
    
        this.scene.traverse(object => {
            if (object.userData.isCenterNode) {
                const isVisible = (object.position.z <= zPosition && object.position.z > zPositionBelow) && !object.userData.occupied;
                object.visible = isVisible;
            }
        });
    
        this.scene.traverse(object => {
            if (object.userData.isEdge) {
                const sourceNode = this.scene.getObjectByProperty('uuid', object.userData.sourceNode);
                const destinationNode = this.scene.getObjectByProperty('uuid', object.userData.destinationNode);
    
                // Check if both nodes are visible
                const edgeVisible = sourceNode && destinationNode && sourceNode.visible && destinationNode.visible;
                object.visible = edgeVisible;
            }
        });
    
        this.render(); 
    }
    
    
    switchToPerspectiveCamera() {
            store.dispatch(setActiveCamera('perspective'));
            this.updateViewingPlane('3D')
            store.dispatch(setCurrentViewingPlane('3D'));
            this.refreshDragControls();
        }
        nextLayer() {
            const state = store.getState();
            const grid = this.gridSize; 
            let newIndex;
        
            switch (state.scene.currentViewingPlane) {
                case 'XY':
                    newIndex = (state.scene.currentLayerIndexXY % grid) + 1;
                    store.dispatch(setLayerIndexXY(newIndex));
                    this.snapToXYPlane(newIndex, 'XY');
                    break;
                case 'XZ':
                    newIndex = (state.scene.currentLayerIndexXZ % grid) + 1;
                    store.dispatch(setLayerIndexXZ(newIndex));
                    this.snapToXZPlane(newIndex, 'XZ');
                    break;
                case 'YZ':
                    newIndex = (state.scene.currentLayerIndexYZ % grid) + 1;
                    store.dispatch(setLayerIndexYZ(newIndex));
                    this.snapToYZPlane(newIndex, 'YZ');
                    break;
            }
        }
        
        
        
        
    
        previousLayer() {
            const state = store.getState();
            const grid = this.gridSize % 2 == 0 ? this.gridSize+1 : this.gridSize
        
            switch (state.scene.currentViewingPlane) {
                case 'XY':
                    let newIndexXY = (state.scene.currentLayerIndexXY - 1 + grid) % grid;
                    newIndexXY = newIndexXY === 0 ? grid-1 : newIndexXY;
                    store.dispatch(setLayerIndexXY(newIndexXY));
                    this.snapToXYPlane();
                    break;
                case 'XZ':
                    let newIndexXZ = (state.scene.currentLayerIndexXZ - 1 + grid) % grid;
                    newIndexXZ = newIndexXZ === 0 ? grid-1 : newIndexXZ;
                    store.dispatch(setLayerIndexXZ(newIndexXZ));
                    this.snapToXZPlane();
                    break;
                case 'YZ':
                    let newIndexYZ = (state.scene.currentLayerIndexYZ - 1 + grid) % grid;
                    newIndexYZ = newIndexYZ === 0 ? grid-1 : newIndexYZ;
                    store.dispatch(setLayerIndexYZ(newIndexYZ));
                    this.snapToYZPlane();
                    break;
            }
        }
        
    
    
        adjustOrthoCameraForLayer(layerIndex, plane) {
            const cameraShift = layerIndex * 10; 
            const cameraOffset = 50; // enusres camera is outside the grid
            
            store.dispatch(setActiveCamera('orthographic'));
        
            switch (plane) {
                case 'XY':
                    this.orthographicCamera.position.set(0, 0, cameraShift + cameraOffset);
                    break;
                case 'XZ':
                    this.orthographicCamera.position.set(0, cameraShift + cameraOffset, 0);
                    break;
                case 'YZ':
                    this.orthographicCamera.position.set(cameraShift + cameraOffset, 0, 0);
                    break;
            }
        
            this.orthographicCamera.lookAt(0,0,0);
            this.orthographicCamera.updateProjectionMatrix();
        }
        
   
        
makeAllNodesInvisibleVisible() {
    this.scene.traverse(object => {
        if (object.userData.isCenterNode) {
            object.visible = false;
        }
    });
    this.render(); 
}

makeAllNodesVisible() {
    if (this.currentCameraType === 'orthographic') {
    } // make logic to only make current layer visible
    this.scene.traverse(object => {
        if (object.userData.isEdge) {
            object.visible = true; // set the node to be visible
        }
    });
    this.scene.traverse(object => {
        if (object.userData.isNode) {
            object.visible = true; // Set the node to be visible
        }
    });
    this.scene.traverse(object => {
        if (object.userData.isCenterNode) {
            const isVisible = !object.userData.occupied;
            object.visible = isVisible;
        }
    });
    this.render(); 
}
toggleGridVisibility() {
    this.scene.traverse(object => {
        if (object.userData.isGrid) {
            object.visible = !object.visible; 
        }
    });
    this.render();
}




onMouseMove(event) {
    // Convert the mouse position to normalized device coordinates 
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;


    // Update the raycaster
    this.raycaster.setFromCamera(this.mouse, this.currentCamera);

    // Perform the raycasting
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    const visibleIntersects = intersects.filter(intersect => intersect.object.visible);

    // Filter for center nodes
    const centerNodeIntersects = visibleIntersects.filter(intersect => intersect.object.userData.isCenterNode);

    if (centerNodeIntersects.length > 0) {
        const firstIntersectedNode = centerNodeIntersects[0].object;
        if (this.currentlyHighlighted !== firstIntersectedNode) {
            // Reset the previous highlight
            if (this.currentlyHighlighted) {
                this.resetHighlight(this.currentlyHighlighted);
            }

            // Highlight the new node
            this.currentlyHighlighted = firstIntersectedNode;
            this.highlightNode(this.currentlyHighlighted);
        }
    } else if (this.currentlyHighlighted) {
        // No center node is intersected reset the highlight
        this.resetHighlight(this.currentlyHighlighted);
        this.currentlyHighlighted = null;
    }


    let pos;
    if (this.currentCamera.isPerspectiveCamera) {
        const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        vector.unproject(this.currentCamera);
        const dir = vector.sub(this.currentCamera.position).normalize();
        const distance = -this.currentCamera.position.z / dir.z;
        pos = this.currentCamera.position.clone().add(dir.multiplyScalar(distance));
    } else if (this.currentCamera.isOrthographicCamera) {
        pos = new THREE.Vector3(this.mouse.x, this.mouse.y, 0);
        pos.unproject(this.currentCamera);
        pos.z = this.pendingEdge.source ? this.pendingEdge.source.position.z : 0; // Use source nodes Z or a default
    }

    //  pos contains the correct position for both camera types

    
    if (this.isEdgeCreationMode && this.pendingEdge.source && pos) {
        if (!this.pendingEdge.line) {
            // Create the line for the first time
            const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            const geometry = new THREE.BufferGeometry().setFromPoints([this.pendingEdge.source.position, pos]);
            this.pendingEdge.line = new THREE.Line(geometry, material);
            this.scene.add(this.pendingEdge.line);
        } else {
            // Update the line's endpoint to follow the mouse
            const points = [this.pendingEdge.source.position, pos];
            this.pendingEdge.line.geometry.setFromPoints(points);
            this.pendingEdge.line.geometry.verticesNeedUpdate = true;
        }
    }
}


    getIntersects(x, y) {
        // Convert x y screen coordinates to normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
    
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.currentCamera);
    
        // Calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        return intersects;
    }
    
    updateEdgeLabel(newLabel, edgeData) {
        this.edgesManager.updateEdgeLabel(newLabel, edgeData);
    }
    

    updateNodeLabel(newLabel, nodeId) {
        const textNode = this.textNodes[nodeId];
        if (textNode) {
           // textNode.position = textNode.labelSprite.position , hacky but works , better to update textnode itself as currently doing
            textNode.updateLabel(newLabel);
            this.render();
            this.refreshDragControls()
            store.dispatch(updateNodeLabel({
                id: nodeId,
                newLabel: newLabel,
            }));
        } else {
            console.error('Failed to update node label:', nodeId);
        }
    }
    
    
    removeEdge(edgeId) {
        this.edgesManager.removeEdgeByID(edgeId);
    }

    generatePDFClick() {//not enough hours in a day :(
        this.latexManager.generateAndDownloadPDF3D();
    }

    generateLatex(){
        this.latexManager.generateAndDownloadLatex();
    }

    

    getLayoutManagerCoordsForLayout(layout,dims){
        this.layoutManager.fetchGraphLayout(layout,dims).then(layoutData => {
            
             layoutData.forEach(obj => {
                const id = obj.id
                const xPosition = obj.x
                const yPosition = obj.y
                const zPosition = obj.z
                const object = this.scene.getObjectByProperty('uuid', id); 

                const originalCenterNode = this.findNearestCenterNode(object.position);
                if (originalCenterNode && originalCenterNode.userData.occupied) {
                    originalCenterNode.userData.occupied = false;
                    originalCenterNode.visible = true;
                }

                object.position.x = xPosition
                object.position.y = yPosition
                object.position.z = zPosition
                
                        
                this.textNodes[object.userData.id].position = object.position
                store.dispatch(updateNodePosition({id:object.userData.id,
                    position:{x:object.position.x , y:object.position.y, z:object.position.z}
                ,type:object.userData.type}));
                this.updateAllEdgesOfNode(object.userData.id);


                const newCenterNode = this.findNearestCenterNode(object.position);
                if (newCenterNode && !newCenterNode.userData.occupied) {
                    // Mark the new centerNode as occupied and make it invisible
                    newCenterNode.userData.occupied = true;
                    newCenterNode.visible = false;
            
                    // Update the nodes userdata with the new original position for future moves
                    object.userData.originalPosition = object.position.clone();
                }
                this.render()

             })
          }).catch(error => {
            
            console.error('Failed to fetch graph layout:', error);
          });
        }




    

    
    

    

}

const threeManager = new ThreeManager();


export default threeManager;
