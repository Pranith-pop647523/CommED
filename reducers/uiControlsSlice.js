// /reducers/uiControlsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiControlsSlice = createSlice({
    name: 'uiControls',
    initialState: {
        orbitControlsEnabled: false,
        dragControlsEnabled: false,
    },
    reducers: {
        toggleOrbitControls(state) {
            state.orbitControlsEnabled = !state.orbitControlsEnabled;
            if (state.orbitControlsEnabled) {
                state.dragControlsEnabled = false;
            }
        },
        toggleDragControls(state) {
            state.dragControlsEnabled = !state.dragControlsEnabled;
            if (state.dragControlsEnabled) {
                state.orbitControlsEnabled = false;
            }
        },
        setControlsState(state, action) {
            const { orbitControls, dragControls } = action.payload;
            state.orbitControlsEnabled = orbitControls;
            state.dragControlsEnabled = dragControls;
        },
    },
});

export const { toggleOrbitControls, toggleDragControls, setControlsState } = uiControlsSlice.actions;
export default uiControlsSlice.reducer;
