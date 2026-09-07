const { getPool } = require("../config/database");

const resources = {
  users: {
    table: "users",
    fields: ["id", "name", "email", "role", "department", "phone", "status", "createdAt", "updatedAt"],
    columnMap: { createdAt: "created_at", updatedAt: "updated_at" }
  },
  tickets: {
    table: "tickets",
    fields: ["id", "title", "description", "category", "priority", "status", "requesterEmail", "assigneeEmail", "deviceId", "createdAt", "updatedAt", "resolvedAt"],
    columnMap: {
      requesterEmail: "requester_email",
      assigneeEmail: "assignee_email",
      deviceId: "device_id",
      createdAt: "created_at",
      updatedAt: "updated_at",
      resolvedAt: "resolved_at"
    }
  },
  devices: {
    table: "devices",
    fields: ["id", "name", "type", "status", "userEmail", "department", "ipAddress", "serialNumber", "purchaseDate", "notes"],
    columnMap: {
      userEmail: "user_email",
      ipAddress: "ip_address",
      serialNumber: "serial_number",
      purchaseDate: "purchase_date"
    }
  },
  network: {
    table: "network_devices",
    fields: ["id", "name", "type", "status", "ipAddress", "macAddress", "area", "vlan", "subnet", "gateway", "managementUrl", "uptimeHours", "notes"],
    columnMap: {
      ipAddress: "ip_address",
      macAddress: "mac_address",
      managementUrl: "management_url",
      uptimeHours: "uptime_hours"
    }
  }
};

function meta(collection) {
  const value = resources[collection];
  if (!value) throw new Error(`Unknown collection: ${collection}`);
  return value;
}

function dbColumn(resource, field) {
  return resource.columnMap[field] || field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function selectList(resource) {
  return resource.fields
    .map((field) => {
      const column = dbColumn(resource, field);
      return column === field ? `\`${column}\`` : `\`${column}\` AS \`${field}\``;
    })
    .join(", ");
}

function normalizeRow(row) {
  if (!row) return null;
  const output = { ...row };
  for (const key of Object.keys(output)) {
    if (output[key] instanceof Date) output[key] = output[key].toISOString();
  }
  return output;
}

async function list(collection) {
  const resource = meta(collection);
  const [rows] = await getPool().query(`SELECT ${selectList(resource)} FROM \`${resource.table}\` ORDER BY \`id\``);
  return rows.map(normalizeRow);
}

async function get(collection, id) {
  const resource = meta(collection);
  const [rows] = await getPool().execute(
    `SELECT ${selectList(resource)} FROM \`${resource.table}\` WHERE \`id\` = ? LIMIT 1`,
    [id]
  );
  return normalizeRow(rows[0]);
}

async function create(collection, value) {
  const resource = meta(collection);
  const fields = resource.fields.filter((field) => Object.prototype.hasOwnProperty.call(value, field));
  const columns = fields.map((field) => `\`${dbColumn(resource, field)}\``).join(", ");
  const placeholders = fields.map(() => "?").join(", ");
  const params = fields.map((field) => value[field] ?? null);
  await getPool().execute(`INSERT INTO \`${resource.table}\` (${columns}) VALUES (${placeholders})`, params);
  return get(collection, value.id);
}

async function update(collection, id, patch) {
  const resource = meta(collection);
  const fields = resource.fields.filter(
    (field) => field !== "id" && !["createdAt", "updatedAt"].includes(field) && Object.prototype.hasOwnProperty.call(patch, field)
  );
  if (!fields.length) return get(collection, id);

  const assignments = fields.map((field) => `\`${dbColumn(resource, field)}\` = ?`).join(", ");
  const params = fields.map((field) => patch[field] ?? null);
  params.push(id);
  const [result] = await getPool().execute(
    `UPDATE \`${resource.table}\` SET ${assignments} WHERE \`id\` = ?`,
    params
  );
  return result.affectedRows ? get(collection, id) : null;
}

async function remove(collection, id) {
  const resource = meta(collection);
  const [result] = await getPool().execute(`DELETE FROM \`${resource.table}\` WHERE \`id\` = ?`, [id]);
  return result.affectedRows > 0;
}

async function getSettings() {
  const [rows] = await getPool().query(
    "SELECT company_name AS companyName, timezone, language, default_priority AS defaultPriority, sla_hours AS slaHours FROM system_settings WHERE id = 1"
  );
  return rows[0] || null;
}

async function updateSettings(patch) {
  const allowed = {
    companyName: "company_name",
    timezone: "timezone",
    language: "language",
    defaultPriority: "default_priority",
    slaHours: "sla_hours"
  };
  const fields = Object.keys(patch).filter((field) => allowed[field]);
  if (!fields.length) return getSettings();
  const assignments = fields.map((field) => `\`${allowed[field]}\` = ?`).join(", ");
  const params = fields.map((field) => patch[field] ?? null);
  await getPool().execute(`UPDATE system_settings SET ${assignments} WHERE id = 1`, params);
  return getSettings();
}

module.exports = { list, get, create, update, remove, getSettings, updateSettings };
