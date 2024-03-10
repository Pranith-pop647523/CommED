// controlActions.js
import { ENABLE_CONTROLS, DISABLE_CONTROLS, SWITCH_CONTROLS } from './actionTypes';

export const enableControls = (controlType) => ({
  type: ENABLE_CONTROLS,
  payload: controlType, // 'drag', 'orbit', or 'both'
});

export const disableControls = () => ({
  type: DISABLE_CONTROLS,
});

export const switchControls = (controlType) => ({
  type: SWITCH_CONTROLS,
  payload: controlType, // 'drag', 'orbit', or 'both'
});
