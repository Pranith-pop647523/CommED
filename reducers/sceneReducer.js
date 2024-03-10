// /reducers/sceneReducer.js
import { createSlice } from '@reduxjs/toolkit';

const sceneSlice = createSlice({
    name: 'scene',
    initialState: {
        activeCameraId: 'perspective',
        currentLayerIndexXY: 1, 
        currentViewingPlane: 'XY',
        currentLayerIndexXZ: 1, 
        currentLayerIndexYZ: 1, 
    },
    reducers: {
        setActiveCamera(state, action) {
            state.activeCameraId = action.payload;
        },
        setLayerIndexXY(state, action) {
            state.currentLayerIndexXY = action.payload;
        },
        setLayerIndexXZ(state, action) {
            state.currentLayerIndexXZ = action.payload;
        },
        setLayerIndexYZ(state, action) {
            state.currentLayerIndexYZ = action.payload;
        },
        setCurrentViewingPlane(state, action) {
            state.currentViewingPlane = action.payload;
        },
    },
});

export const { setActiveCamera, setLayerIndexXY, setCurrentViewingPlane , setLayerIndexYZ , setLayerIndexXZ}  = sceneSlice.actions;
export default sceneSlice.reducer;


