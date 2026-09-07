const express = require("express");
const tickets = require("./tickets.routes");
const devices = require("./devices.routes");
const users = require("./users.routes");
const network = require("./network.routes");
const settings = require("./settings.routes");
const reports = require("./reports.routes");
const { ok } = require("../utils/http");

const router = express.Router();

router.get("/health", (req, res) => ok(res, {
  service: "it-support-portal-api",
  status: "ok",
  timestamp: new Date().toISOString()
}));

router.use("/tickets", tickets);
router.use("/devices", devices);
router.use("/users", users);
router.use("/network", network);
router.use("/settings", settings);
router.use("/reports", reports);

module.exports = router;
