function requiredString(value, field, maxLength = 255) {
  if (typeof value !== "string" || !value.trim()) {
    return `${field} là bắt buộc.`;
  }
  if (value.trim().length > maxLength) {
    return `${field} vượt quá ${maxLength} ký tự.`;
  }
  return null;
}

function optionalEmail(value, field = "email") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return `${field} không hợp lệ.`;
  }
  return null;
}

function ipv4(value, field = "Địa chỉ IP") {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return `${field} không hợp lệ.`;
  const parts = value.trim().split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d+$/.test(part) || Number(part) < 0 || Number(part) > 255)) {
    return `${field} không hợp lệ.`;
  }
  return null;
}

function enumValue(value, field, allowed) {
  if (!allowed.includes(value)) {
    return `${field} phải thuộc một trong các giá trị: ${allowed.join(", ")}.`;
  }
  return null;
}

function collect(...errors) {
  return errors.filter(Boolean);
}

module.exports = { requiredString, optionalEmail, ipv4, enumValue, collect };
