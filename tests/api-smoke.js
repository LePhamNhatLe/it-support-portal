const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.DATA_SOURCE = "memory";
process.env.API_PREFIX = "/api/v1";
process.env.CORS_ORIGIN = "http://127.0.0.1:5500";

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

test("database constraint errors map to semantic API errors", () => {
  assert.deepEqual(mapDatabaseError({ code: "ER_DUP_ENTRY", errno: 1062 }), {
    status: 409,
    code: "DUPLICATE_VALUE",
    message: "Dữ liệu bị trùng với bản ghi đã tồn tại."
  });
  assert.equal(mapDatabaseError({ errno: 1451 }).code, "RESOURCE_IN_USE");
  assert.equal(mapDatabaseError({ errno: 1452 }).code, "INVALID_REFERENCE");
});
