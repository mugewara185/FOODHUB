import type { UserRole } from '../../../core/types/auth';

/**
 * Deterministic role resolution priority:
 * 1. dev    → /dev
 * 2. admin  → /admin
 * 3. owner  → /owner
 * 4. partner→ /partner
 * 5. user   → /user
 */
export const ROLE_PRIORITY: readonly UserRole[] = [
  'dev',
  'admin',
  'owner',
  'partner',
  'user',
] as const;
