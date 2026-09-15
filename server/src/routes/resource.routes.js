const express = require("express");
const store = require("../data/store");
const { ok, created, fail } = require("../utils/http");

function createResourceRouter(options) {
  const router = express.Router();
  const { collection, validateCreate, validateUpdate } = options;

  router.get("/", async (req, res, next) => {
    try {
      return ok(res, await store.list(collection));
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const item = await store.get(collection, req.params.id);
      return item ? ok(res, item) : fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const errors = validateCreate ? await validateCreate(req.body || {}, store) : [];
      if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
      if (await store.get(collection, req.body.id)) return fail(res, 409, "DUPLICATE_ID", "Mã dữ liệu đã tồn tại.");
      return created(res, await store.create(collection, req.body));
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/:id", async (req, res, next) => {
    try {
      const current = await store.get(collection, req.params.id);
      if (!current) return fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
      const errors = validateUpdate ? await validateUpdate(req.body || {}, current, store) : [];
      if (errors.length) return fail(res, 400, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.", errors);
      return ok(res, await store.update(collection, req.params.id, req.body || {}));
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const deleted = await store.remove(collection, req.params.id);
      return deleted ? res.status(204).end() : fail(res, 404, "NOT_FOUND", "Không tìm thấy dữ liệu.");
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createResourceRouter };
