import { describe, it, expect } from 'vitest';
import authReducer, { setAuthSession } from './authSlice';
import type { AuthUser } from '../../data/types/auth';

describe('authSlice', () => {
  it('stores a restored auth session for a persisted user', () => {
    const persistedUser: AuthUser = {
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '9876543210',
      role: 'user',
      avatar: 'https://example.com/avatar.png',
      token: 'persisted-token',
      refreshToken: 'persisted-refresh',
      expiresAt: Date.now() + 3600000,
      permissions: ['place_order', 'view_profile'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
    };

    const nextState = authReducer(undefined, setAuthSession(persistedUser));

    expect(nextState.user?.email).toBe('jane@example.com');
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.isLoggedIn).toBe(true);
  });
});
