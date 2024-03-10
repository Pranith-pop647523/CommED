import * as THREE from 'three';

export class DirectedEdge { // pass soruce and target as position
    constructor(source, target, color = 'black', edgeThickness = 0.1, arrowSize = 0.75 ,sourceNode,destinationNode,labelText ='') {
        this.source = source.clone();
        this.target = target.clone();
        this.color = color;
        this.edgeThickness = edgeThickness;
        this.arrowSize = arrowSize;
        this.labelText = labelText;

        this.group = new THREE.Group();
        this.group.userData = { isEdge: true, sourceNode, destinationNode, directedEdgeInstance: this };

        // Cylinder geometry for the edge
        this.edgeGeometry = new THREE.CylinderGeometry(edgeThickness, edgeThickness, 1, 32);
        this.edgeMaterial = new THREE.MeshBasicMaterial({ color });
        this.edge = new THREE.Mesh(this.edgeGeometry, this.edgeMaterial);
        this.edge.userData = { isEdgeComponent: true }; // Marking as an edge component

        // Cone geometry for the arrowhead
        this.arrowGeometry = new THREE.ConeGeometry(arrowSize, arrowSize * 2, 32);
        this.arrowMaterial = new THREE.MeshBasicMaterial({ color });
        this.arrow = new THREE.Mesh(this.arrowGeometry, this.arrowMaterial);
        this.arrow.userData = { isEdgeComponent: true }; // Marking as an edge component

        // Add the components to the group
        this.group.add(this.edge);
        this.edge.userData = { isEdgeComponent: true }; 
        this.group.add(this.arrow);
        this.arrow.userData = { isEdgeComponent: true };

        // Text label
        if (labelText) {
            this.textLabel = this.createTextSprite(labelText);
            this.textLabel.userData = { isEdgeComponent: true }; // Marking as an edge component
            this.group.add(this.textLabel);
        }

        this.update();
    }

    updateText(newText) {
        // Remove the existing text label from the group
        if (this.textLabel) {
            this.group.remove(this.textLabel);
        }

        // Create a new text label sprite with the updated text
        this.textLabel = this.createTextSprite(newText);
        this.textLabel.userData = { isEdgeComponent: true };
        this.group.add(this.textLabel);

        // Ensure the label's position is updated
        this.update();
    }

    createTextSprite(text, fontSize = 128, textColor = '#000000') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 280; canvas.height = 150; 
        context.font = `${fontSize}px Arial`;
        context.fillStyle = textColor;
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + fontSize / 3);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 1, 1); 

        return sprite;
    }


    update() {
        // Vector from source to target
        const direction = new THREE.Vector3().subVectors(this.target, this.source);
        const totalLength = direction.length();
        const gap = 1.2; 
        const arrowLength = this.arrowSize * 2.3; 
    
        // Ensure the arrow and gap fit within the total length
        if (totalLength < arrowLength + gap * 2) {
            console.warn("DirectedEdge.update: The total length is too short for the arrow and gaps.");
            return;
        }
    
        // Adjusted length for the edge (cylinder) to account for the gap and arrow length
        const edgeLength = totalLength - arrowLength - gap * 2;
    
        // Position and orient the cylinder (edge)
        this.edge.position.copy(this.source).add(direction.clone().normalize().multiplyScalar(gap + edgeLength / 2));
        this.edgeGeometry.dispose(); // Dispose of the old geometry to prevent memory leaks
        this.edgeGeometry = new THREE.CylinderGeometry(this.edgeThickness, this.edgeThickness, edgeLength, 32);
        this.edge.geometry = this.edgeGeometry;
        this.edge.lookAt(this.target);
        this.edge.rotateX(Math.PI / 2); // Rotate to align with direction
    
        // Update the arrow's position and orientation
        this.arrow.position.copy(this.source).add(direction.clone().normalize().multiplyScalar(gap + edgeLength + arrowLength / 2));
        const arrowOrientation = new THREE.Vector3(0, 1, 0); // Cone's "up" direction
        this.arrow.quaternion.setFromUnitVectors(arrowOrientation, direction.clone().normalize());
    
        
         // Update the text sprite's position to be above the directed edge
         if (this.textLabel) {
            const midPoint = new THREE.Vector3().addVectors(this.source, this.target).multiplyScalar(0.5);
            const offsetMagnitude = 1.2; 
    
            // Determine general direction: horizontal, vertical, or diagonal
            const isMoreHorizontal = Math.abs(direction.x) >= Math.abs(direction.y);
            
            // Set offset based on orientation
            let offset;
            if (isMoreHorizontal) {
                // If the line is more horizontal, place the text above the line
                offset = new THREE.Vector3(0, offsetMagnitude, 0);
            } else {
                // If the line is more vertical, place the text to the right of the line
                offset = new THREE.Vector3(offsetMagnitude, 0, 0);
            }
    
            // Apply offset to midPoint for text label position
            this.textLabel.position.copy(midPoint).add(offset);
    
        }
    }
    
    
    
    addToScene(scene) {
        scene.add(this.group);
    }

    removeFromScene(scene) {
        scene.remove(this.group);// Remove the group from the scene
        this.group.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                child.material.dispose();
            }
            if (child.texture) {
                child.texture.dispose();
            }
        });

    }

    updateSourceTarget(source, target) {
        this.source.copy(source);
        this.target.copy(target);
        this.update();
    }
}
