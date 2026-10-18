import { describe, it, expect } from 'vitest';
import { resolveLandingPath } from '../resolvers/resolveLandingPath';
import { resolveUserRoles } from '../resolvers/resolveUserRoles';
import type { UserRole } from '../../../core/types/auth';

describe('Role Resolution & Deterministic Landing Page Tests', () => {
  describe('resolveUserRoles', () => {
    it('extracts roles from user.role array', () => {
      const user = { role: ['admin', 'user'] };
      expect(resolveUserRoles(user)).toEqual(['admin', 'user']);
    });

    it('extracts roles from user.roles array', () => {
      const user = { roles: ['owner'] };
      expect(resolveUserRoles(user)).toEqual(['owner']);
    });

    it('handles single string user.role', () => {
      const user = { role: 'partner' };
      expect(resolveUserRoles(user)).toEqual(['partner']);
    });

    it('filters out unknown/invalid roles', () => {
      const user = { role: ['user', 'super_admin', 'hacker'] };
      expect(resolveUserRoles(user)).toEqual(['user']);
    });

    it('returns empty array for null/undefined user', () => {
      expect(resolveUserRoles(null)).toEqual([]);
      expect(resolveUserRoles(undefined)).toEqual([]);
    });
  });

  describe('resolveLandingPath Priority & Determinism', () => {
    it('1. Owner with ["owner"] opens / and lands on /owner', () => {
      expect(resolveLandingPath(['owner'], true)).toBe('/owner');
    });

    it('2. Customer with ["user"] opens / and lands on /user (customer landing)', () => {
      expect(resolveLandingPath(['user'], true)).toBe('/user');
    });

    it('3. User with ["user", "owner"] lands on /owner', () => {
      expect(resolveLandingPath(['user', 'owner'], true)).toBe('/owner');
      // Order independence
      expect(resolveLandingPath(['owner', 'user'], true)).toBe('/owner');
    });

    it('4. User with ["user", "admin", "dev"] lands on /dev', () => {
      expect(resolveLandingPath(['user', 'admin', 'dev'], true)).toBe('/dev');
      // Order independence
      expect(resolveLandingPath(['dev', 'user', 'admin'], true)).toBe('/dev');
    });

    it('5. User with ["admin", "owner"] lands on /admin under proposed priority', () => {
      expect(resolveLandingPath(['admin', 'owner'], true)).toBe('/admin');
      // Order independence
      expect(resolveLandingPath(['owner', 'admin'], true)).toBe('/admin');
    });

    it('6. User with ["user", "partner"] lands on /partner', () => {
      expect(resolveLandingPath(['user', 'partner'], true)).toBe('/partner');
      expect(resolveLandingPath(['partner', 'user'], true)).toBe('/partner');
    });

    it('7. Unauthenticated user resolves to /showcase default landing page when no user is logged in', () => {
      expect(resolveLandingPath([], false)).toBe('/showcase');
    });

    it('8. Authenticated user with no recognized roles resolves to /unauthorized', () => {
      expect(resolveLandingPath([], true)).toBe('/unauthorized');
      expect(resolveLandingPath(['unknown_role' as UserRole], true)).toBe('/unauthorized');
    });
  });
});
