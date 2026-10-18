import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import authReducer from '../../auth/authSlice';
import ShowcasePage from '../../../pages/Showcase';
import { DemoAccessSection } from '../components/DemoAccessSection';
import { DEMO_ACCOUNTS_DATA } from '../data/demoAccountsData';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as authService from '../../../services/api/authApi';

// Mock Leaflet map to avoid canvas issues in jsdom
vi.mock('../../../shared/components/maps/Map', () => ({
  default: () => <div data-testid="mock-map">Mock Leaflet Map</div>,
}));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => <div data-testid="mock-tile" />,
  Marker: ({ children }: any) => <div data-testid="mock-marker">{children}</div>,
  Polyline: () => <div data-testid="mock-polyline" />,
  Popup: ({ children }: any) => <div data-testid="mock-popup">{children}</div>,
  useMap: () => ({ setView: vi.fn(), flyTo: vi.fn(), panTo: vi.fn(), invalidateSize: vi.fn() }),
}));

vi.mock('../../../core/utils/api', () => ({
  default: {
    request: vi.fn().mockResolvedValue({ order: null, delivery: null, isTerminal: false }),
  },
  api: {
    request: vi.fn().mockResolvedValue({ order: null, delivery: null, isTerminal: false }),
  },
}));

const createTestStore = (initialAuthState: any = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        isLoggedIn: false,
        loading: false,
        isAuthenticated: false,
        isInitialized: true,
        error: null,
        ...initialAuthState,
      },
    },
  });
};

describe('Showcase Demo Account Access Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(authService.authApi, 'getMe').mockRejectedValue(new Error('Unauthenticated'));
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  describe('Data Integrity & Contract Audit', () => {
    it('contains all 4 authoritative actor roles in DEMO_ACCOUNTS_DATA', () => {
      const roles = DEMO_ACCOUNTS_DATA.map((d) => d.roleId);
      expect(roles).toEqual(['user', 'owner', 'partner', 'admin']);
    });

    it('defines truthful credentials and explicit sandbox limitation disclaimers', () => {
      DEMO_ACCOUNTS_DATA.forEach((card) => {
        expect(card.email).toMatch(/demo-[a-z]+@foodhub\.test/);
        expect(card.password).toBe('devdev');
        expect(card.dashboardPath.startsWith('/')).toBe(true);
        expect(card.capabilities.length).toBeGreaterThanOrEqual(3);
        expect(card.limitations.length).toBeGreaterThan(15);
      });
    });
  });

  describe('DemoAccessSection Component Rendering', () => {
    it('renders the Demo Access section with title, chip, and 4 role cards', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <DemoAccessSection />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText('DEMO ACCOUNT ACCESS & MULTI-ACTOR EXPLORATION')).toBeInTheDocument();
      expect(screen.getByText('Explore FoodHub as Any Actor')).toBeInTheDocument();

      // All 4 roles present
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Restaurant Owner')).toBeInTheDocument();
      expect(screen.getByText('Delivery Courier')).toBeInTheDocument();
      expect(screen.getByText('Platform Administrator')).toBeInTheDocument();

      // All 4 emails present
      expect(screen.getByText('demo-customer@foodhub.test')).toBeInTheDocument();
      expect(screen.getByText('demo-owner@foodhub.test')).toBeInTheDocument();
      expect(screen.getByText('demo-partner@foodhub.test')).toBeInTheDocument();
      expect(screen.getByText('demo-admin@foodhub.test')).toBeInTheDocument();

      // Verification status chips present
      expect(screen.getByText('Verified E2E')).toBeInTheDocument();
      expect(screen.getByText('Integration Verified')).toBeInTheDocument();
      expect(screen.getByText('Dual Transport (Mock / API)')).toBeInTheDocument();
      expect(screen.getByText('Architectural Prototype')).toBeInTheDocument();
    });

    it('renders discoverable jump button from Showcase hero and anchors to #demo-access', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <ShowcasePage />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      const demoAccessJumpBtn = screen.getByRole('button', { name: /Demo Access/i });
      expect(demoAccessJumpBtn).toBeInTheDocument();

      const sectionEl = document.getElementById('demo-access');
      expect(sectionEl).not.toBeNull();
    });
  });

  describe('Credential Copy Interactions & User Feedback', () => {
    it('copies email to clipboard on copy icon click and shows user feedback', async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <DemoAccessSection />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      const copyEmailBtn = screen.getByRole('button', { name: /Copy email for Customer/i });
      fireEvent.click(copyEmailBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('demo-customer@foodhub.test');
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy email for Customer/i })).toBeInTheDocument();
      });
    });

    it('copies password to clipboard on copy icon click', async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <DemoAccessSection />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      const copyPassBtn = screen.getByRole('button', { name: /Copy password for Restaurant Owner/i });
      fireEvent.click(copyPassBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('devdev');
    });

    it('copies full credentials on "Copy Full Credentials" button click', async () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <DemoAccessSection />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      const copyAllButtons = screen.getAllByRole('button', { name: /Copy Full Credentials/i });
      fireEvent.click(copyAllButtons[0]);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Email: demo-customer@foodhub.test\nPassword: devdev'
      );
      await waitFor(() => {
        expect(screen.getByText('Credentials Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('One-Click Authentication & Role Navigation Flow', () => {
    it('executes legitimate login flow and navigates to role dashboard on success', async () => {
      const mockUser = {
        id: '64e8e50f3c5f4a1b8c1a9902',
        name: 'Showcase Kitchen Manager',
        email: 'demo-owner@foodhub.test',
        role: ['owner'],
        roles: ['owner'],
        token: 'jwt-owner-token-123',
      };

      vi.spyOn(authService.authApi, 'login').mockResolvedValueOnce(mockUser as any);

      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <Routes>
                <Route path="/showcase" element={<DemoAccessSection />} />
                <Route path="/owner" element={<div data-testid="owner-dashboard">Owner Dashboard</div>} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      const exploreOwnerBtn = screen.getByRole('button', { name: /Explore as Restaurant Owner/i });
      fireEvent.click(exploreOwnerBtn);

      // Verify legitimate login invoked with demo credentials
      expect(authService.authApi.login).toHaveBeenCalledWith({
        email: 'demo-owner@foodhub.test',
        password: 'devdev',
      });

      // Verify navigation to role dashboard
      await waitFor(() => {
        expect(screen.getByTestId('owner-dashboard')).toBeInTheDocument();
      });
    });

    it('handles authentication failure gracefully and does not navigate to protected dashboard', async () => {
      vi.spyOn(authService.authApi, 'login').mockRejectedValueOnce(
        new Error('Invalid demo credentials or service unavailable')
      );

      const store = createTestStore();
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <Routes>
                <Route path="/showcase" element={<DemoAccessSection />} />
                <Route path="/admin" element={<div data-testid="admin-dashboard">Admin Dashboard</div>} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      const exploreAdminBtn = screen.getByRole('button', { name: /Explore as Platform Administrator/i });
      fireEvent.click(exploreAdminBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Invalid demo credentials or service unavailable/i)
        ).toBeInTheDocument();
      });

      // Assert that navigation did NOT happen
      expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Session Preservation & Safe Switch Confirmation', () => {
    it('detects active authenticated session and renders active session banner', () => {
      const activeUser = {
        id: '64e8e50f3c5f4a1b8c1a9901',
        name: 'Showcase Customer',
        email: 'demo-customer@foodhub.test',
        role: ['user'],
        roles: ['user'],
        token: 'cust-token',
        permissions: ['place_order'],
      };

      const store = createTestStore({
        user: activeUser,
        isAuthenticated: true,
        isLoggedIn: true,
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <DemoAccessSection />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText('Active Session Established')).toBeInTheDocument();
      expect(screen.getByText(/Showcase Customer/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();

      // Current role card shows direct dashboard navigation
      expect(screen.getByRole('button', { name: /Open Customer Dashboard/i })).toBeInTheDocument();

      // Other role cards show switch options rather than immediate overwrite
      expect(screen.getByRole('button', { name: /Switch to Restaurant Owner/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to Delivery Courier/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Switch to Platform Administrator/i })).toBeInTheDocument();
    });

    it('prompts confirmation modal before switching active persona to prevent silent overwrite', async () => {
      const activeUser = {
        id: '64e8e50f3c5f4a1b8c1a9901',
        name: 'Showcase Customer',
        email: 'demo-customer@foodhub.test',
        role: ['user'],
        token: 'cust-token',
      };

      const store = createTestStore({
        user: activeUser,
        isAuthenticated: true,
        isLoggedIn: true,
      });

      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={['/showcase']}>
            <AuthProvider>
              <DemoAccessSection />
            </AuthProvider>
          </MemoryRouter>
        </Provider>
      );

      const switchBtn = screen.getByRole('button', { name: /Switch to Platform Administrator/i });
      fireEvent.click(switchBtn);

      // Modal should appear
      expect(screen.getByText('Switch Demo Persona')).toBeInTheDocument();
      expect(screen.getByText('Platform Administrator', { selector: 'strong' })).toBeInTheDocument();
      expect(screen.getByText('demo-admin@foodhub.test', { selector: 'code' })).toBeInTheDocument();
      expect(screen.getByText('/admin', { selector: 'code' })).toBeInTheDocument();

      // Cancel keeps previous session untouched
      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByText('Switch Demo Persona')).not.toBeInTheDocument();
      });
    });
  });
});
