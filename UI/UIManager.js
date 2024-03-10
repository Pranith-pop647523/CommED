export class UIManager {
    constructor(threeManager) {
        this.threeManager = threeManager;
        this.setupUIListeners();
        // Bind the hideDialog method to use it as an event listener
        this.hideDialog = this.hideDialog.bind(this);
        this.hideDialogNode = this.hideDialogNode.bind(this);
    }

    setupUIListeners() {
        const canvas = this.threeManager.renderer.domElement;
        canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    }

    onDoubleClick(event) {
        event.preventDefault();
        const intersects = this.threeManager.getIntersects(event.clientX, event.clientY);
        const clickedEdge = intersects.find(intersect => intersect.object.userData.isEdge || intersect.object.userData.isEdgeComponent);
        const clickedNode = intersects.find(intersect => intersect.object.userData.type === 'movableNode' || intersect.object.type === 'Sprite');
        //so hacky god
        if (clickedEdge) {
            console.log('clickedEdge', clickedEdge);
            if(!this.threeManager.isEdgeCreationMode){
            this.showEditDialog(this.threeManager.getEdgeIdFromClick(clickedEdge));
            }

        }
        else if (clickedNode) {
            console.log('clickedNode', clickedNode);
            if(!this.threeManager.isEdgeCreationMode){
            this.showEditDialogNode(this.threeManager.getNodeIdFromClick(clickedNode));
            }
        }   
        
    }

    showEditDialog(edgeData) {
        const dialog = document.getElementById('edgeEditDialog');
        const edgeLabel = document.getElementById('edgeLabel');
        const changeButton = document.getElementById('changeEdgeLabelButton');
        const deleteButton = document.getElementById('deleteEdgeButton');
    
        edgeLabel.value = edgeData.labelText || ''; 

        dialog.style.right = '20px';
        dialog.style.top = '50%';
        dialog.style.transform = 'translateY(-50%)';
    
        changeButton.onclick = () => {
            const newLabel = edgeLabel.value.trim();
            if (true) {
                this.threeManager.updateEdgeLabel(newLabel, edgeData);
            }

            dialog.style.display = 'none'; 
        };

        deleteButton.onclick = () => {

        this.threeManager.setDialogVisibility(false); 
            this.threeManager.removeEdge(edgeData);
            dialog.style.display = 'none'; 
            
        }


      dialog.style.display = 'block';
      edgeLabel.focus();
      this.threeManager.setDialogVisibility(true); 
        

    setTimeout(() => document.addEventListener('click', this.hideDialog), 0); // Timeout to avoid immediate trigger
    }

    hideDialog(event) {
        
        const dialog = document.getElementById('edgeEditDialog');
        
        if (!dialog.contains(event.target)) {

            this.threeManager.setDialogVisibility(false); 
            dialog.style.display = 'none';
            
            document.removeEventListener('click', this.hideDialog);
        }
    }
    

    showEditDialogNode(nodeData) {
        const dialog = document.getElementById('nodeEditDialog');
        const nodeLabel = document.getElementById('nodeLabel');
        const changeButton = document.getElementById('changeNodeLabelButton');
        const deleteButton = document.getElementById('deleteNodeButton');
    
        nodeLabel.value = nodeData.labelText || ''; 

        dialog.style.right = '20px';
        dialog.style.top = '50%';
        dialog.style.transform = 'translateY(-50%)';
    
        changeButton.onclick = () => {
            const newLabel = nodeLabel.value.trim();
            if (newLabel) {
                this.threeManager.updateNodeLabel(newLabel, nodeData);
            }
            this.threeManager.setDialogVisibility(false);
            dialog.style.display = 'none'; 
        };

        deleteButton.onclick = () => {
            this.threeManager.removeNodeById(nodeData);
            this.threeManager.setDialogVisibility(false);
            dialog.style.display = 'none'; 
        }

        this.threeManager.setDialogVisibility(true); 
        
        dialog.style.display = 'block';
        nodeLabel.focus();

        
        

        setTimeout(() => document.addEventListener('click', this.hideDialogNode), 0); // Timeout to avoid immediate trigger
    }

    hideDialogNode(event) {
        const dialog = document.getElementById('nodeEditDialog');

        // Check if the click was outside the dialog
        if (!dialog.contains(event.target)) {
            dialog.style.display = 'none';

            this.threeManager.setDialogVisibility(false); 
            // Remove the global click listener to clean up
            document.removeEventListener('click', this.hideDialogNode);
        }
    }
}
