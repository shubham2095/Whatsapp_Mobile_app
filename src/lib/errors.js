// Laravel validation errors look like { field: ["message", ...] }.
export function fieldError(error, field) {
  const list = error?.errors?.[field];
  return Array.isArray(list) && list.length ? list[0] : undefined;
}

export function isValidEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value).trim());
}
