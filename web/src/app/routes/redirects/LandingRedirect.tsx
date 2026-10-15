import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { resolveLandingPath } from '../resolvers/resolveLandingPath';
import { resolveUserRoles } from '../resolvers/resolveUserRoles';

export const LandingRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();

  // Guard against premature redirects before authentication resolution
  if (!isInitialized || isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const roles = resolveUserRoles(user);
  const targetPath = resolveLandingPath(roles, isAuthenticated);

  return <Navigate to={targetPath} replace />;
};

export default LandingRedirect;
