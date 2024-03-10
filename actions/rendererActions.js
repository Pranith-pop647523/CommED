// rendererActions.js
import { SET_RENDERER_SIZE, SET_RENDERER_ELEMENT } from './actionTypes';

export const setRendererSize = (width, height) => ({
  type: SET_RENDERER_SIZE,
  payload: { width, height },
});

export const setRendererElement = (element) => ({
  type: SET_RENDERER_ELEMENT,
  payload: element,
});
