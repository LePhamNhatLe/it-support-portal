const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.NODE_ENV = "test";
process.env.DATA_SOURCE = "memory";
process.env.API_PREFIX = "/api/v1";
process.env.CORS_ORIGIN = "http://127.0.0.1:5500";

const env = require("../server/src/config/env");
const { createApp, mapDatabaseError } = require("../server/src/app");

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}/api/v1`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function authHeaders(userId = "USR-001") {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: "10m" });
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

test("health reports active data source", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.data.dataSource, "memory");
  });
});

test("protected resources require authentication", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/users`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.ok, false);
    assert.equal(body.error.code, "AUTH_REQUIRED");
  });
});

test("invalid login is rejected without exposing account details", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.invalid", password: "not-valid" })
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.ok, false);
    assert.equal(body.error.code, "INVALID_CREDENTIALS");
  });
});

test("technical lead cannot change own role", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/users/USR-001`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ role: "user" })
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, "SELF_ROLE_CHANGE_FORBIDDEN");
  });
});

test("technical lead cannot lock own account", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/users/USR-001`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status: "locked" })
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, "SELF_STATUS_CHANGE_FORBIDDEN");
  });
});

test("technical lead cannot delete own account", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/users/USR-001`, {
      method: "DELETE",
      headers: authHeaders()
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, "SELF_DELETE_FORBIDDEN");
  });
});

test("user linked to tickets or devices cannot be deleted", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/users/USR-003`, {
      method: "DELETE",
      headers: authHeaders()
    });
    const body = await response.json();
    assert.equal(response.status, 409);
    assert.equal(body.error.code, "USER_IN_USE");
    assert.equal(body.error.details.tickets, 1);
    assert.equal(body.error.details.devices, 1);
  });
});

test("creating a user requires a password", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/users`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        id: "USR-900",
        name: "Test User",
        email: "test.user@example.local",
        role: "user",
        department: "Khác",
        status: "active"
      })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "VALIDATION_ERROR");
  });
});

test("database constraint errors map to semantic API errors", () => {
  assert.deepEqual(mapDatabaseError({ code: "ER_DUP_ENTRY", errno: 1062 }), {
    status: 409,
    code: "DUPLICATE_VALUE",
    message: "Dữ liệu bị trùng với bản ghi đã tồn tại."
  });
  assert.equal(mapDatabaseError({ errno: 1451 }).code, "RESOURCE_IN_USE");
  assert.equal(mapDatabaseError({ errno: 1452 }).code, "INVALID_REFERENCE");
});
