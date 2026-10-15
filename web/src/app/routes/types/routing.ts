import type { UserRole } from '../../../core/types/auth';

export type DomainType = 'user' | 'admin' | 'owner' | 'partner' | 'dev';

export interface RoutePermissionConfig {
  allowedRoles: UserRole[];
  requireAuth?: boolean;
}

export interface DomainRouteConfig {
  domain: DomainType;
  path: string;
  registrationRoles: UserRole[];
  landingPath: string;
}
