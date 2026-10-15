import type { UserRole } from '../../../core/types/auth';

/**
 * Domain conditional route registration requirements according to specification:
 * User    → Always registered
 * Admin   → User has 'admin' or 'dev'
 * Owner   → User has 'owner' or 'dev'
 * Partner → User has 'partner' or 'dev'
 * Dev     → User has 'dev'
 */
export const DOMAIN_REGISTRATION_ROLES: Record<'admin' | 'owner' | 'partner' | 'dev', UserRole[]> = {
  admin: ['admin', 'dev'],
  owner: ['owner', 'dev'],
  partner: ['partner', 'dev'],
  dev: ['dev'],
};
