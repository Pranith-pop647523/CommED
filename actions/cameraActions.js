// Action Types
export const UPDATE_CAMERA_POSITION = 'UPDATE_CAMERA_POSITION';
export const INITIALIZE_PERSPECTIVE_CAMERA = 'INITIALIZE_PERSPECTIVE_CAMERA';
export const INITIALIZE_ORTHOGRAPHIC_CAMERA = 'INITIALIZE_ORTHOGRAPHIC_CAMERA';
export const SWITCH_CAMERA = 'SWITCH_CAMERA';


// Action Creators

//shouldve migrated to reducers but no time


// Action creator for updating camera position
export const updateCameraPosition = (x, y, z) => ({
    type: UPDATE_CAMERA_POSITION,
    payload: { x, y, z },
  });
  

export const initializePerspectiveCamera = (fov, aspect, near, far) => ({
    type: INITIALIZE_PERSPECTIVE_CAMERA,
    payload: { fov, aspect, near, far },
});

export const initializeOrthographicCamera = (left, right, top, bottom, near, far) => ({
    type: INITIALIZE_ORTHOGRAPHIC_CAMERA,
    payload: { left, right, top, bottom, near, far },
});

export const switchCamera = (cameraType) => ({
    type: SWITCH_CAMERA,
    payload: cameraType,
});
