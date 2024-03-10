export const addNode = (node) => ({
  type: 'ADD_NODE',
  payload: node,
});

export const updateNodePosition = (id, position) => ({
  type: 'UPDATE_NODE_POSITION',
  payload: { id, position },
});