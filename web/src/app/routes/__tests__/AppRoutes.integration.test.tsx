import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, Outlet } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppRoutes } from '../AppRoutes';
import * as AuthContextModule from '../../../contexts/AuthContext';

// Mock logger to prevent console noise during test runs
vi.mock('../../../core/dev/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setCurrentRoute: vi.fn(),
  },
}));

// Mock domain layouts
vi.mock('../../../shared/layout/MainLayout', () => ({
  default: () => (
    <div data-testid="layout-main">
      <Outlet />
    </div>
  ),
}));
vi.mock('../../../shared/layout/AdminLayout', () => ({
  default: () => (
    <div data-testid="layout-admin">
      <Outlet />
    </div>
  ),
}));
vi.mock('../../../shared/layout/OwnerLayout', () => ({
  default: () => (
    <div data-testid="layout-owner">
      <Outlet />
    </div>
  ),
}));
vi.mock('../../../shared/layout/PartnerLayout', () => ({
  default: () => (
    <div data-testid="layout-partner">
      <Outlet />
    </div>
  ),
}));
vi.mock('@/core/dev/ui/layout/DevLayout', () => ({
  default: () => (
    <div data-testid="layout-dev">
      <Outlet />
    </div>
  ),
}));

// Mock domain primary landing pages
vi.mock('../../../pages/Home', () => ({
  default: () => <div data-testid="page-customer-home">Customer Home Page</div>,
}));
vi.mock('../../../pages/admin/AdminDashboard', () => ({
  default: () => <div data-testid="page-admin-dashboard">Admin Dashboard</div>,
}));
vi.mock('../../../pages/_ownerPages/DashBoard', () => ({
  default: () => <div data-testid="page-owner-dashboard">Owner Dashboard</div>,
}));
vi.mock('../../../pages/_deliveryPartner/PartnerDashboard', () => ({
  default: () => <div data-testid="page-partner-dashboard">Partner Dashboard</div>,
}));
vi.mock('@/core/dev/ui/Dashboard', () => ({
  default: () => <div data-testid="page-dev-dashboard">Dev Dashboard</div>,
}));
vi.mock('../../../pages/Auth/Login', () => ({
  default: () => <div data-testid="page-login">Login Page</div>,
}));
vi.mock('../../../pages/restaurantListings', () => ({
  default: () => <div data-testid="page-restaurants">Restaurants Listing</div>,
}));

// Mock subpages to isolate routing tests
vi.mock('@/core/dev/ui/pages/ComponentTree', () => ({ default: () => <div>ComponentTree</div> }));
vi.mock('@/core/dev/ui/pages/StateInspector', () => ({ default: () => <div>StateInspector</div> }));
vi.mock('@/core/dev/ui/pages/PropsPanel', () => ({ default: () => <div>PropsPanel</div> }));
vi.mock('@/core/dev/ui/pages/VersionSwitcher', () => ({ default: () => <div>VersionSwitcher</div> }));
vi.mock('@/core/dev/ui/pages/NetworkInspector', () => ({ default: () => <div>NetworkInspector</div> }));
vi.mock('@/core/dev/ui/pages/LogPanel', () => ({ default: () => <div>LogPanel</div> }));
vi.mock('@/core/dev/ui/pages/PerformanceMetrics', () => ({ default: () => <div>PerformanceMetrics</div> }));
vi.mock('@/core/dev/ui/pages/ComponentPlayground', () => ({ default: () => <div>ComponentPlayground</div> }));
vi.mock('@/core/dev/ui/pages/DocumentationViewer', () => ({ default: () => <div>DocumentationViewer</div> }));

vi.mock('../../../pages/admin/orders/OrdersList', () => ({ default: () => <div>OrdersList</div> }));
vi.mock('../../../pages/admin/restaurants/RestaurantsList', () => ({ default: () => <div>RestaurantsList</div> }));
vi.mock('../../../pages/admin/restaurants/AddRestaurants', () => ({ default: () => <div>AddRestaurants</div> }));
vi.mock('../../../pages/admin/Profile', () => ({ default: () => <div>Profile</div> }));
vi.mock('../../../pages/admin', () => ({
  Promotions: () => <div>Promotions</div>,
  Reports: () => <div>Reports</div>,
  Settings: () => <div>Settings</div>,
  Users: () => <div>Users</div>,
}));
vi.mock('../../../pages/admin/menu', () => ({ AdminMenu: () => <div>AdminMenu</div> }));
vi.mock('../../../pages/admin/ai/AdminAIPage', () => ({ default: () => <div>AdminAIPage</div> }));
vi.mock('../../../pages/admin/ai/InvestigationPage', () => ({ default: () => <div>InvestigationPage</div> }));
vi.mock('../../../pages/admin/delivery', () => ({ default: () => <div>AdminDeliveryDashboard</div> }));

vi.mock('../../../pages/_ownerPages/Settings', () => ({ default: () => <div>OwnerSettings</div> }));
vi.mock('../../../pages/_owner/Queue', () => ({ default: () => <div>Queue</div> }));
vi.mock('../../../pages/_owner/Active', () => ({ default: () => <div>Active</div> }));

vi.mock('../../../pages/_deliveryPartner/Profile', () => ({ default: () => <div>PartnerProfile</div> }));
vi.mock('../../../pages/_deliveryPartner/AvailableOrdders', () => ({ default: () => <div>AvailableOrders</div> }));
vi.mock('../../../pages/_deliveryPartner/ActiveDelivery', () => ({ default: () => <div>ActiveDelivery</div> }));
vi.mock('../../../pages/_deliveryPartner/DeliveryHistory', () => ({ default: () => <div>DeliveryHistory</div> }));
vi.mock('../../../pages/_deliveryPartner/Earnings', () => ({ default: () => <div>Earnings</div> }));
vi.mock('../../../pages/_deliveryPartner/PartnerSupport', () => ({ default: () => <div>Support</div> }));
vi.mock('../../../pages/_deliveryPartner/Settings', () => ({ default: () => <div>PartnerSettings</div> }));

// Helper component to track current pathname in tests
const LocationTracker = () => {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
};

const renderWithRouter = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <LocationTracker />
      <AppRoutes />
    </MemoryRouter>
  );
};

describe('AppRoutes Comprehensive Specification Validation', () => {
  interface MockAuthState {
    user: { id: string; role: string[] } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
    logout: () => void;
  }

  let mockAuthData: MockAuthState;

  beforeEach(() => {
    mockAuthData = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
      logout: vi.fn(),
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockImplementation(() => mockAuthData as unknown as ReturnType<typeof AuthContextModule.useAuth>);
  });

  it('Scenario 1: An owner with ["owner"] opens / and lands on /owner', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '1', role: ['owner'] };

    renderWithRouter('/');

    expect(screen.getByTestId('current-location').textContent).toBe('/owner');
    expect(screen.getByTestId('page-owner-dashboard')).toBeInTheDocument();
  });

  it('Scenario 2: A customer with ["user"] opens / and lands on the customer homepage', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '2', role: ['user'] };

    renderWithRouter('/');

    expect(screen.getByTestId('current-location').textContent).toBe('/user');
    expect(screen.getByTestId('page-customer-home')).toBeInTheDocument();
  });

  it('Scenario 3: A user with ["user", "owner"] lands on /owner', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '3', role: ['user', 'owner'] };

    renderWithRouter('/');

    expect(screen.getByTestId('current-location').textContent).toBe('/owner');
    expect(screen.getByTestId('page-owner-dashboard')).toBeInTheDocument();
  });

  it('Scenario 4: A user with ["user", "admin", "dev"] lands on /dev', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '4', role: ['user', 'admin', 'dev'] };

    renderWithRouter('/');

    expect(screen.getByTestId('current-location').textContent).toBe('/dev');
    expect(screen.getByTestId('page-dev-dashboard')).toBeInTheDocument();
  });

  it('Scenario 5: A user with ["admin", "owner"] lands on /admin under proposed priority', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '5', role: ['admin', 'owner'] };

    renderWithRouter('/');

    expect(screen.getByTestId('current-location').textContent).toBe('/admin');
    expect(screen.getByTestId('page-admin-dashboard')).toBeInTheDocument();
  });

  it('Scenario 6: A developer can access all permitted domain route trees', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '6', role: ['dev'] };

    // Admin tree
    const { unmount: unmount1 } = renderWithRouter('/admin');
    expect(screen.getByTestId('page-admin-dashboard')).toBeInTheDocument();
    unmount1();

    // Owner tree
    const { unmount: unmount2 } = renderWithRouter('/owner');
    expect(screen.getByTestId('page-owner-dashboard')).toBeInTheDocument();
    unmount2();

    // Partner tree
    const { unmount: unmount3 } = renderWithRouter('/partner');
    expect(screen.getByTestId('page-partner-dashboard')).toBeInTheDocument();
    unmount3();

    // Dev tree
    const { unmount: unmount4 } = renderWithRouter('/dev');
    expect(screen.getByTestId('page-dev-dashboard')).toBeInTheDocument();
    unmount4();
  });

  it('Scenario 7: An owner cannot access admin-only routes and is restricted', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '7', role: ['owner'] };

    renderWithRouter('/admin');

    // Admin routes are not conditionally registered for an owner with only ['owner']
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  it('Scenario 8: A user can directly open a valid URL in an authorized domain without redirection to /', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '8', role: ['admin'] };

    renderWithRouter('/admin');

    expect(screen.getByTestId('current-location').textContent).toBe('/admin');
    expect(screen.getByTestId('page-admin-dashboard')).toBeInTheDocument();
  });

  it('Scenario 10: Authentication loading does not cause premature redirects', () => {
    mockAuthData.isInitialized = false;
    mockAuthData.isLoading = true;

    renderWithRouter('/');

    // Remains on '/' while loading spinner is shown, not prematurely redirected
    expect(screen.getByTestId('current-location').textContent).toBe('/');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('Scenario 11: An unauthenticated user is handled correctly (lands on public customer page at /)', () => {
    mockAuthData.isAuthenticated = false;
    mockAuthData.user = null;

    renderWithRouter('/');

    expect(screen.getByTestId('current-location').textContent).toBe('/user');
    expect(screen.getByTestId('page-customer-home')).toBeInTheDocument();
  });

  it('Scenario 12: An authenticated user with no recognized roles receives an unauthorized page', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '9', role: [] };

    renderWithRouter('/');

    expect(screen.getByTestId('current-location').textContent).toBe('/unauthorized');
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
  });

  it('Scenario 13 & 14: An invalid URL displays the not-found page without redirect loop', () => {
    renderWithRouter('/non-existent-random-path');

    expect(screen.getByTestId('current-location').textContent).toBe('/non-existent-random-path');
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  it('Scenario 15: Keeping UserRoutes registered does not override initial landing redirect', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '10', role: ['partner'] };

    renderWithRouter('/');

    // Must resolve to /partner and not be swallowed by UserRoutes
    expect(screen.getByTestId('current-location').textContent).toBe('/partner');
    expect(screen.getByTestId('page-partner-dashboard')).toBeInTheDocument();
  });

  it('Scenario 16: Customer routes (e.g. /restaurants) remain available even for an owner', () => {
    mockAuthData.isAuthenticated = true;
    mockAuthData.user = { id: '11', role: ['owner'] };

    renderWithRouter('/restaurants');

    expect(screen.getByTestId('current-location').textContent).toBe('/restaurants');
    expect(screen.getByTestId('page-restaurants')).toBeInTheDocument();
  });
});
