// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import OwnerLayout from './shared/layout/OwnerLayout';
import { AuthContext } from './contexts/AuthContext';
import { Provider } from 'react-redux';
import { store } from './app/store/V/Store_V';
import ComingSoon from './shared/components/ComingSoon';
import { test, vi } from 'vitest';

vi.mock('./core/dev/renderer/DevVersionSwitcher', () => ({ DevVersionSwitcher: () => <div /> }));

const MockAuth = ({ children }: any) => (
  <AuthContext.Provider value={{ user: { name: 'Test' }, logout: vi.fn(), isAuthenticated: true, isLoading: false, login: vi.fn(), register: vi.fn(), updateProfile: vi.fn() } as any}>
    {children}
  </AuthContext.Provider>
);

const TestApp = () => (
  <Provider store={store}>
    <MockAuth>
      <MemoryRouter initialEntries={['/owner/menu']}>
        <Routes>
          <Route path='/owner/*' element={<OwnerLayout />}>
            <Route path='menu/*' element={<ComingSoon title='Menu Management' />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </MockAuth>
  </Provider>
);

test('OwnerLayout active state and routing', () => {
  render(<TestApp />);
  
  const dashboardItem = screen.getByText('Dashboard').closest('.MuiListItemButton-root');
  const menuItem = screen.getByText('Menu Management').closest('.MuiListItemButton-root');
  const h2 = screen.getByText('Menu Management', { selector: 'h2' });
  
  console.log('--- TEST RESULTS ---');
  console.log('Dashboard selected:', dashboardItem?.classList.contains('Mui-selected'));
  console.log('Menu selected:', menuItem?.classList.contains('Mui-selected'));
  console.log('ComingSoon rendered:', !!h2);
  console.log('--- END OF RESULTS ---');
});
