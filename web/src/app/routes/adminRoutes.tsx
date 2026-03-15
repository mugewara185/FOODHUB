import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import Dashboard from '../pages/ADMINpages/Dashboard';
import Courses from '../pages/ADMINpages/Courses';
// import Profile from '../pages/Profile';
// import Settings from '../pages/Settings';
// import NotFound from '../pages/NotFound';

const adminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        {/* <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} /> */}
      </Route>
    </Routes>
  );
};

export default adminRoutes;