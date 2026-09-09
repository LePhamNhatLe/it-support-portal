const express = require("express");
const store = require("../data/store");
const { ok } = require("../utils/http");

const router = express.Router();

router.get("/summary", async (req, res, next) => {
  try {
    const [tickets, devices, network, users] = await Promise.all([
      store.list("tickets"),
      store.list("devices"),
      store.list("network"),
      store.list("users")
    ]);

    const data = {
      tickets: {
        total: tickets.length,
        open: tickets.filter((item) => ["open", "reopened"].includes(item.status)).length,
        processing: tickets.filter((item) => ["assigned", "in_progress", "pending"].includes(item.status)).length,
        resolved: tickets.filter((item) => ["resolved", "closed"].includes(item.status)).length
      },
      devices: {
        total: devices.length,
        inUse: devices.filter((item) => item.status === "in_use").length,
        maintenance: devices.filter((item) => item.status === "maintenance").length,
        retired: devices.filter((item) => item.status === "retired").length
      },
      network: {
        total: network.length,
        online: network.filter((item) => item.status === "online").length,
        issues: network.filter((item) => ["offline", "warning", "maintenance"].includes(item.status)).length
      },
      users: {
        total: users.length,
        active: users.filter((item) => item.status === "active").length
      }
    };

    return ok(res, data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
