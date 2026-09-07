const seed = require("./seed");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const state = {
  users: clone(seed.users),
  tickets: clone(seed.tickets),
  devices: clone(seed.devices),
  network: clone(seed.network),
  settings: clone(seed.settings)
};

function list(collection) {
  return clone(state[collection] || []);
}

function get(collection, id) {
  const item = (state[collection] || []).find((entry) => String(entry.id) === String(id));
  return item ? clone(item) : null;
}

function create(collection, value) {
  if (!Array.isArray(state[collection])) throw new Error(`Unknown collection: ${collection}`);
  state[collection].push(clone(value));
  return clone(value);
}

function update(collection, id, patch) {
  if (!Array.isArray(state[collection])) throw new Error(`Unknown collection: ${collection}`);
  const index = state[collection].findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) return null;
  state[collection][index] = { ...state[collection][index], ...clone(patch) };
  return clone(state[collection][index]);
}

function remove(collection, id) {
  if (!Array.isArray(state[collection])) throw new Error(`Unknown collection: ${collection}`);
  const index = state[collection].findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) return false;
  state[collection].splice(index, 1);
  return true;
}

function getSettings() {
  return clone(state.settings);
}

function updateSettings(patch) {
  state.settings = { ...state.settings, ...clone(patch) };
  return clone(state.settings);
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  getSettings,
  updateSettings
};
