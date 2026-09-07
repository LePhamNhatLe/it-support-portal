const express = require("express");
const store = require("../data/store");
const { ok, fail } = require("../utils/http");
const { requiredString, enumValue, collect } = require("../utils/validators");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    return ok(res, await store.getSettings());
  } catch (error) {
    return next(error);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const current = await store.getSettings();
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
    return ok(res, await store.updateSettings({ ...req.body, slaHours: Number(merged.slaHours) }));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
