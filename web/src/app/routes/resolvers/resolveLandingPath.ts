import type { UserRole } from '../../../core/types/auth';
import { ROLE_PRIORITY } from '../constants/rolePriority';
import { ROUTE_PATHS } from '../config/routePaths';

const ROLE_PATH_MAP: Record<UserRole, string> = {
  dev: ROUTE_PATHS.DEV_LANDING,
  admin: ROUTE_PATHS.ADMIN_LANDING,
  owner: ROUTE_PATHS.OWNER_LANDING,
  partner: ROUTE_PATHS.PARTNER_LANDING,
  user: ROUTE_PATHS.USER_LANDING,
};

/**
 * Resolves the deterministic landing page path for a user based on their roles
 * and authentication state.
 *
 * Priority order (independent of the order roles appear in the array):
 * 1. dev    → /dev
 * 2. admin  → /admin
 * 3. owner  → /owner
 * 4. partner→ /partner
 * 5. user   → /user
 *
 * Fallbacks:
 * - Unauthenticated users landing at root → /user (customer landing)
 * - Authenticated users with no recognized roles → /unauthorized
 */
export const resolveLandingPath = (
  roles: readonly UserRole[],
  isAuthenticated: boolean = false
): string => {
  const roleSet = new Set(roles);

  for (const role of ROLE_PRIORITY) {
    if (roleSet.has(role)) {
      return ROLE_PATH_MAP[role];
    }
  }

  // If user is authenticated but possesses no recognized roles
  if (isAuthenticated) {
    return ROUTE_PATHS.UNAUTHORIZED;
  }

  // Default landing for visitors / unauthenticated users
  return ROUTE_PATHS.USER_LANDING;
};
