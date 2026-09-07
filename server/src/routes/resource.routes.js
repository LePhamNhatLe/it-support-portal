const express = require("express");
const store = require("../data/memory-store");
const { ok, created, fail } = require("../utils/http");

function createResourceRouter(options) {
  const router = express.Router();
  const { collection, validateCreate, validateUpdate } = options;

  router.get("/", (req, res) => ok(res, store.list(collection)));

  router.get("/:id", (req, res) => {
    const item = store.get(collection, req.params.id);
    return item ? ok(res, item) : fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
  });

  router.post("/", (req, res) => {
    const errors = validateCreate ? validateCreate(req.body || {}, store) : [];
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
    if (store.get(collection, req.body.id)) return fail(res, 409, "DUPLICATE_ID", "Mã dữ liệu đã tồn tại.");
    return created(res, store.create(collection, req.body));
  });

  router.patch("/:id", (req, res) => {
    const current = store.get(collection, req.params.id);
    if (!current) return fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
    const errors = validateUpdate ? validateUpdate(req.body || {}, current, store) : [];
    if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
    const updated = store.update(collection, req.params.id, req.body || {});
    return ok(res, updated);
  });

  router.delete("/:id", (req, res) => {
    const deleted = store.remove(collection, req.params.id);
    return deleted ? res.status(204).end() : fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
  });

  return router;
}

module.exports = { createResourceRouter };
