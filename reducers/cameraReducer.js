import { createSlice } from '@reduxjs/toolkit';

const cameraSlice = createSlice({
    name: 'camera',
    initialState: {
        cameraPosition: { x: 0, y: 0, z: 0 },
        cameraType: 'perspective',
    },
    reducers: {
        updateCameraPosition(state, action) {
            state.cameraPosition = action.payload;
        },
        initializePerspectiveCamera(state, action) {
            state.cameraType = 'perspective';
            state.fov = action.payload.fov;
            state.aspect = action.payload.aspect;
            state.near = action.payload.near;
            state.far = action.payload.far;
        },
        initializeOrthographicCamera(state, action) {
            state.cameraType = 'orthographic';
            state.left = action.payload.left;
            state.right = action.payload.right;
            state.top = action.payload.top;
            state.bottom = action.payload.bottom;
            state.near = action.payload.near;
            state.far = action.payload.far;
        },
        switchCamera(state, action) {
            state.cameraType = action.payload;
        },
    },
});

export const { updateCameraPosition, initializePerspectiveCamera, initializeOrthographicCamera, switchCamera } = cameraSlice.actions;
export default cameraSlice.reducer;
