import * as THREE from 'three';

export class TextNode {
    constructor(id,position, labelText = 'A', scene, cubeSize = 5) {
        this.position = position;
        this.labelText = labelText;
        this.scene = scene;
        this.cubeSize = cubeSize;
        this.userData = { 
            id: id,
            movable: true,
            type: 'movableNode',
            isNode: true,
        }; 
        this.id = id;

        this.createNode();
    }

    createNode() {
        // Create text sprite for the label
        this.labelSprite = this.createTextSprite(this.labelText);
        this.labelSprite.position.copy(this.position);

        
        this.labelSprite.scale.set(this.cubeSize * 0.5, this.cubeSize * 0.25, 1);

        this.scene.add(this.labelSprite);
    }



    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 70; 
        canvas.width = 256; 
        canvas.height = 128; 
        context.font = `Bold ${fontSize}px Arial`;
        context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Text color
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + fontSize / 3);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.userData = {
            id: this.id, // Unique identifier for the node
            type: 'movableNode', // Type identifier
            isNode: true, // Custom flag for raycasting
            label: text,
            
        };
        sprite.uuid = this.id;
        //Honestly is pretty hacky here , should be a better way to do this
        return sprite;
    }

    updateLabel(newLabel) {
        // Remove existing label from the scene
        const userData = this.labelSprite.userData
        this.scene.remove(this.labelSprite);

        // Create and add the new label
        this.labelText = newLabel;
        this.labelSprite = this.createTextSprite(this.labelText);
        this.labelSprite.position.copy(this.position);
        this.labelSprite.scale.set(this.cubeSize * 0.5, this.cubeSize * 0.25, 1);
        this.labelSprite.userData = userData;
        this.scene.add(this.labelSprite);
        console.log('Label updated');
    }
}
