import store from '/store/store.js';
import { setActiveCamera } from '/reducers/sceneReducer.js';
import threeManager from '/ThreeManager.js'; 
import '/css/style.css'; 


threeManager.snapToXYPlane() // Snap to the XY plane at startup , shouldve done this in 3manager but no time

// Subscribe to store changes to update the active camera
store.subscribe(() => {
    const state = store.getState();
    const activeCameraId = state.scene.activeCameraId;
    threeManager.switchCamera(activeCameraId);

});


