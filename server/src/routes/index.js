const express = require("express");
const tickets = require("./tickets.routes");
const devices = require("./devices.routes");
const users = require("./users.routes");
const network = require("./network.routes");
const settings = require("./settings.routes");
const reports = require("./reports.routes");
const { ok } = require("../utils/http");

const router = express.Router();

router.get("/", (req, res) => ok(res, {
  name: "IT Support Portal API",
  version: "v1",
  status: "running",
  endpoints: {
    health: "/api/v1/health",
    tickets: "/api/v1/tickets",
    devices: "/api/v1/devices",
    users: "/api/v1/users",
    network: "/api/v1/network",
    settings: "/api/v1/settings",
    reports: "/api/v1/reports/summary"
  }
}));

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
