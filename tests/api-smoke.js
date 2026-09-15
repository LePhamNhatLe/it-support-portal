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

function ticketPayload(id, overrides = {}) {
  return {
    id,
    title: `Ticket ${id}`,
    description: "API authorization test ticket.",
    category: "network",
    priority: "medium",
    status: "open",
    requesterEmail: "user@itsupport.local",
    assigneeEmail: null,
    deviceId: null,
    resolvedAt: null,
    ...overrides
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

test("regular user only lists tickets requested by that user", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/tickets`, { headers: authHeaders("USR-003") });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.ok(body.data.length >= 1);
    assert.ok(body.data.every((ticket) => ticket.requesterEmail === "user@itsupport.local"));
  });
});

test("regular user cannot read another requester's ticket by direct API", async () => {
  await withServer(async (base) => {
    const createResponse = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-001"),
      body: JSON.stringify(ticketPayload("TKT-0910", { requesterEmail: "lead@itsupport.local" }))
    });
    assert.equal(createResponse.status, 201);

    const response = await fetch(`${base}/tickets/TKT-0910`, {
      headers: authHeaders("USR-003")
    });
    const body = await response.json();
    assert.equal(response.status, 403);
    assert.equal(body.error.code, "TICKET_SCOPE_FORBIDDEN");
  });
});

test("regular user cannot spoof requester or self-assign during ticket creation", async () => {
  await withServer(async (base) => {
    const spoofRequester = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-003"),
      body: JSON.stringify(ticketPayload("TKT-0911", { requesterEmail: "lead@itsupport.local" }))
    });
    assert.equal(spoofRequester.status, 403);

    const selfAssign = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-003"),
      body: JSON.stringify(ticketPayload("TKT-0912", { assigneeEmail: "technician@itsupport.local" }))
    });
    const body = await selfAssign.json();
    assert.equal(selfAssign.status, 403);
    assert.equal(body.error.code, "TICKET_SCOPE_FORBIDDEN");
  });
});

test("regular user can edit own open ticket content but cannot change protected workflow fields", async () => {
  await withServer(async (base) => {
    const createResponse = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-003"),
      body: JSON.stringify(ticketPayload("TKT-0913"))
    });
    assert.equal(createResponse.status, 201);

    const contentResponse = await fetch(`${base}/tickets/TKT-0913`, {
      method: "PATCH",
      headers: authHeaders("USR-003"),
      body: JSON.stringify({ title: "Updated by requester" })
    });
    assert.equal(contentResponse.status, 200);

    const requesterResponse = await fetch(`${base}/tickets/TKT-0913`, {
      method: "PATCH",
      headers: authHeaders("USR-003"),
      body: JSON.stringify({ requesterEmail: "lead@itsupport.local" })
    });
    assert.equal(requesterResponse.status, 403);

    const assignmentResponse = await fetch(`${base}/tickets/TKT-0913`, {
      method: "PATCH",
      headers: authHeaders("USR-003"),
      body: JSON.stringify({ assigneeEmail: "technician@itsupport.local", status: "assigned" })
    });
    assert.equal(assignmentResponse.status, 403);
  });
});

test("technician only sees and edits tickets assigned to that technician", async () => {
  await withServer(async (base) => {
    const createUnassigned = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-001"),
      body: JSON.stringify(ticketPayload("TKT-0914"))
    });
    assert.equal(createUnassigned.status, 201);

    const hiddenResponse = await fetch(`${base}/tickets/TKT-0914`, {
      headers: authHeaders("USR-002")
    });
    assert.equal(hiddenResponse.status, 403);

    const assignedResponse = await fetch(`${base}/tickets/TKT-0001`, {
      headers: authHeaders("USR-002")
    });
    assert.equal(assignedResponse.status, 200);
  });
});

test("technician can progress assigned workflow but cannot perform lead-only transitions", async () => {
  await withServer(async (base) => {
    const createResponse = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-001"),
      body: JSON.stringify(ticketPayload("TKT-0915", {
        status: "assigned",
        assigneeEmail: "technician@itsupport.local"
      }))
    });
    assert.equal(createResponse.status, 201);

    const progressResponse = await fetch(`${base}/tickets/TKT-0915`, {
      method: "PATCH",
      headers: authHeaders("USR-002"),
      body: JSON.stringify({ status: "in_progress" })
    });
    assert.equal(progressResponse.status, 200);

    const closeResponse = await fetch(`${base}/tickets/TKT-0915`, {
      method: "PATCH",
      headers: authHeaders("USR-002"),
      body: JSON.stringify({ status: "closed" })
    });
    const body = await closeResponse.json();
    assert.equal(closeResponse.status, 403);
    assert.equal(body.error.code, "TICKET_SCOPE_FORBIDDEN");
  });
});

test("technical lead can assign and manage tickets across requester scope", async () => {
  await withServer(async (base) => {
    const createResponse = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-001"),
      body: JSON.stringify(ticketPayload("TKT-0916"))
    });
    assert.equal(createResponse.status, 201);

    const response = await fetch(`${base}/tickets/TKT-0916`, {
      method: "PATCH",
      headers: authHeaders("USR-001"),
      body: JSON.stringify({
        assigneeEmail: "technician@itsupport.local",
        status: "assigned"
      })
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.assigneeEmail, "technician@itsupport.local");
    assert.equal(body.data.status, "assigned");
  });
});

test("ticket deletion is lead-only", async () => {
  await withServer(async (base) => {
    const createResponse = await fetch(`${base}/tickets`, {
      method: "POST",
      headers: authHeaders("USR-003"),
      body: JSON.stringify(ticketPayload("TKT-0917"))
    });
    assert.equal(createResponse.status, 201);

    const userDelete = await fetch(`${base}/tickets/TKT-0917`, {
      method: "DELETE",
      headers: authHeaders("USR-003")
    });
    assert.equal(userDelete.status, 403);

    const leadDelete = await fetch(`${base}/tickets/TKT-0917`, {
      method: "DELETE",
      headers: authHeaders("USR-001")
    });
    assert.equal(leadDelete.status, 204);
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
