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

test("user CRUD keeps phone field in memory mode", async () => {
  await withServer(async (base) => {
    const id = "USR-990";
    const create = await fetch(`${base}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: "P23.5 Smoke User",
        email: "p235-smoke@itsupport.local",
        department: "Khác",
        phone: "0900000000",
        role: "user",
        status: "active"
      })
    });
    assert.equal(create.status, 201);
    const created = await create.json();
    assert.equal(created.data.phone, "0900000000");

    const read = await fetch(`${base}/users/${id}`);
    const readBody = await read.json();
    assert.equal(readBody.data.phone, "0900000000");

    const remove = await fetch(`${base}/users/${id}`, { method: "DELETE" });
    assert.equal(remove.status, 204);
  });
});

test("duplicate IDs return conflict", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "USR-001",
        name: "Duplicate",
        email: "duplicate@itsupport.local",
        department: "Khác",
        role: "user",
        status: "active"
      })
    });
    const body = await response.json();
    assert.equal(response.status, 409);
    assert.equal(body.error.code, "DUPLICATE_ID");
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
