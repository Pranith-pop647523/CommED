// rendererReducer.js
import { SET_RENDERER_SIZE, SET_RENDERER_ELEMENT } from './actionTypes';

const initialState = {
  width: 0,
  height: 0,
  element: null,
};

const rendererReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_RENDERER_SIZE:
      return {
        ...state,
        width: action.payload.width,
        height: action.payload.height,
      };
    case SET_RENDERER_ELEMENT:
      return {
        ...state,
        element: action.payload,
      };
    default:
      return state;
  }
};

export default rendererReducer;
