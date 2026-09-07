const express = require("express");
const store = require("../data/memory-store");
const { ok, fail } = require("../utils/http");
const { requiredString, enumValue, collect } = require("../utils/validators");

const router = express.Router();

router.get("/", (req, res) => ok(res, store.getSettings()));

router.patch("/", (req, res) => {
  const current = store.getSettings();
  const merged = { ...current, ...(req.body || {}) };
  const errors = collect(
    requiredString(merged.companyName, "Tên công ty", 120),
    enumValue(merged.language, "Ngôn ngữ", ["vi"]),
    enumValue(merged.defaultPriority, "Ưu tiên mặc định", ["low", "medium", "high", "critical"])
  );
  if (!Number.isInteger(Number(merged.slaHours)) || Number(merged.slaHours) < 1 || Number(merged.slaHours) > 168) {
    errors.push("SLA mặc định phải từ 1 đến 168 giờ.");
  }
  if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
  return ok(res, store.updateSettings({ ...req.body, slaHours: Number(merged.slaHours) }));
});

module.exports = router;
