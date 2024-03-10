// reducers/index.js
import { combineReducers } from 'redux';
import nodeReducer from './nodeReducer';
import edgeReducer from './edgeReducer';
import cameraReducer from './cameraReducer';
import controlReducer from './controlReducer';
import sceneReducer from './sceneReducer';

const rootReducer = combineReducers({
  nodes: nodeReducer,
  edges: edgeReducer,
  camera: cameraReducer,
  controls: controlReducer,// remem ber to add scene reducer
  scene: sceneReducer, 
});

export default rootReducer;
