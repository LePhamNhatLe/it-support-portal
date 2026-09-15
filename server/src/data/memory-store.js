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

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

function list(collection) {
  if (collection === "users") return clone(state.users.map(publicUser));
  return clone(state[collection] || []);
}

function get(collection, id) {
  const item = (state[collection] || []).find((entry) => String(entry.id) === String(id));
  if (!item) return null;
  return clone(collection === "users" ? publicUser(item) : item);
}

function create(collection, value) {
  if (!Array.isArray(state[collection])) throw new Error(`Unknown collection: ${collection}`);
  state[collection].push(clone(value));
  return clone(collection === "users" ? publicUser(value) : value);
}

function update(collection, id, patch) {
  if (!Array.isArray(state[collection])) throw new Error(`Unknown collection: ${collection}`);
  const index = state[collection].findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) return null;
  state[collection][index] = { ...state[collection][index], ...clone(patch) };
  return clone(collection === "users" ? publicUser(state[collection][index]) : state[collection][index]);
}

function remove(collection, id) {
  if (!Array.isArray(state[collection])) throw new Error(`Unknown collection: ${collection}`);
  const index = state[collection].findIndex((entry) => String(entry.id) === String(id));
  if (index === -1) return false;
  state[collection].splice(index, 1);
  return true;
}

function findUserAuthByEmail(email) {
  const target = String(email || "").trim().toLowerCase();
  const user = state.users.find((item) => String(item.email || "").toLowerCase() === target);
  return user ? clone(user) : null;
}

function setUserPasswordHash(id, passwordHash) {
  const user = state.users.find((item) => String(item.id) === String(id));
  if (!user) return false;
  user.passwordHash = String(passwordHash || "");
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
  findUserAuthByEmail,
  setUserPasswordHash,
  getSettings,
  updateSettings
};
