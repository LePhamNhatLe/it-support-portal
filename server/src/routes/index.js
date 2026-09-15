const express = require("express");
const env = require("../config/env");
const auth = require("./auth.routes");
const tickets = require("./tickets.routes");
const devices = require("./devices.routes");
const users = require("./users.routes");
const network = require("./network.routes");
const settings = require("./settings.routes");
const reports = require("./reports.routes");
const { authenticate, authorize } = require("../middleware/auth");
const { ok } = require("../utils/http");

const router = express.Router();

router.get("/", (req, res) => ok(res, {
  name: "IT Support Portal API",
  version: "v1",
  status: "running",
  dataSource: env.DATA_SOURCE,
  endpoints: {
    health: "/api/v1/health",
    authLogin: "/api/v1/auth/login",
    authMe: "/api/v1/auth/me",
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
  dataSource: env.DATA_SOURCE,
  timestamp: new Date().toISOString()
}));

router.use("/auth", auth);
router.use("/tickets", authenticate, tickets);
router.use("/devices", authenticate, authorize("technical_lead", "technician"), devices);
router.use("/users", authenticate, authorize("technical_lead"), users);
router.use("/network", authenticate, authorize("technical_lead", "technician"), network);
router.use("/settings", authenticate, settings);
router.use("/reports", authenticate, authorize("technical_lead"), reports);

module.exports = router;
