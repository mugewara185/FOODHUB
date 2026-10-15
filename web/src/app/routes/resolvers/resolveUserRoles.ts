import type { UserRole } from '../../../core/types/auth';

/**
 * Extracts and normalizes user roles from a user object regardless of
 * whether they are stored in `role` or `roles`, as an array or single string.
 */
export const resolveUserRoles = (user: unknown): UserRole[] => {
  if (!user || typeof user !== 'object') return [];

  const candidate = user as { role?: unknown; roles?: unknown };
  let rawRoles: unknown[] = [];

  if (Array.isArray(candidate.role)) {
    rawRoles = candidate.role;
  } else if (Array.isArray(candidate.roles)) {
    rawRoles = candidate.roles;
  } else if (typeof candidate.role === 'string') {
    rawRoles = [candidate.role];
  } else if (typeof candidate.roles === 'string') {
    rawRoles = [candidate.roles];
  }

  const validRoles: UserRole[] = ['dev', 'admin', 'owner', 'partner', 'user'];

  return rawRoles
    .map((r) => (typeof r === 'string' ? r.trim().toLowerCase() : ''))
    .filter((r): r is UserRole => validRoles.includes(r as UserRole));
};
