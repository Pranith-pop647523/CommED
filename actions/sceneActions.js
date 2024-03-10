// sceneActions.js
export const SET_ACTIVE_CAMERA = 'SET_ACTIVE_CAMERA';

export const setActiveCamera = (cameraId) => ({
    type: SET_ACTIVE_CAMERA,
    payload: cameraId,
});

//Dont use actions , use action creators