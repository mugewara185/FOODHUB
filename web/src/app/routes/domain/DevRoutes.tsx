/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { Route } from 'react-router-dom';
import DevLayout from '@/core/dev/ui/layout/DevLayout';
import DevDashboard from '@/core/dev/ui/Dashboard';
import ComponentTreeExplorer from '@/core/dev/ui/pages/ComponentTree';
import StateInspector from '@/core/dev/ui/pages/StateInspector';
import PropsPanel from '@/core/dev/ui/pages/PropsPanel';
import VersionSwitcher from '@/core/dev/ui/pages/VersionSwitcher';
import NetworkInspector from '@/core/dev/ui/pages/NetworkInspector';
import LogPanel from '@/core/dev/ui/pages/LogPanel';
import PerformanceMetrics from '@/core/dev/ui/pages/PerformanceMetrics';
import ComponentPlayground from '@/core/dev/ui/pages/ComponentPlayground';
import DocumentationViewer from '@/core/dev/ui/pages/DocumentationViewer';
import { IS_PROD } from '../../../core/config/app.config';
import RoleGuard from '../guards/RoleGuard';

const DevProtected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard allowedRoles={['dev']}>
      {children}
    </RoleGuard>
  );
};

export const DevRoutes = !IS_PROD ? (
  <Route 
    path="/dev" 
    element={
      <DevProtected>
        <DevLayout />
      </DevProtected>
    } 
  >
    <Route index element={<DevDashboard />} />
    <Route path="component-tree" element={<ComponentTreeExplorer />} />
    <Route path="components" element={<ComponentPlayground />} />
    <Route path="state" element={<StateInspector />} />
    <Route path="props" element={<PropsPanel />} />
    <Route path="versions" element={<VersionSwitcher />} />
    <Route path="network" element={<NetworkInspector />} />
    <Route path="logs" element={<LogPanel />} />
    <Route path="performance" element={<PerformanceMetrics />} />
    <Route path="docs" element={<DocumentationViewer />} />
  </Route>
) : null;

export default DevRoutes;
