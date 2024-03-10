// edgeActions.js
import { ADD_EDGE, REMOVE_EDGE } from './actionTypes';

export const addEdge = (edgeData) => ({
  type: ADD_EDGE,
  payload: edgeData,
});

export const removeEdge = (edgeId) => ({
  type: REMOVE_EDGE,
  payload: edgeId,
});
