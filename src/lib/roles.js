export const USER_ROLES = ["usuario", "admin"];
export const INTERNAL_ROLES = ["admin"];

export function normalizeUserRole(role) {
  return USER_ROLES.includes(role) ? role : "usuario";
}

export function isInternalRole(role) {
  return INTERNAL_ROLES.includes(role);
}
