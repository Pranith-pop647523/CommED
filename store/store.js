// /store/store.js
import { configureStore } from '@reduxjs/toolkit';
import cameraReducer from '/reducers/cameraReducer';
import sceneReducer from '/reducers/sceneReducer';
import uiControlsReducer from '/reducers/uiControlsSlice';
import nodeReducer from '/reducers/nodeReducer';
import edgeReducer from '/reducers/edgeReducer';

const store = configureStore({
    reducer: {
        uiControls: uiControlsReducer,
        camera: cameraReducer,
        scene: sceneReducer,
        nodes: nodeReducer,
        edges: edgeReducer,
    },
});

export default store;
