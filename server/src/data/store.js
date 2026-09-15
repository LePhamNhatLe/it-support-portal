const env = require("../config/env");

const store = env.DATA_SOURCE === "mysql"
  ? require("./mysql-store")
  : require("./memory-store");

module.exports = store;
