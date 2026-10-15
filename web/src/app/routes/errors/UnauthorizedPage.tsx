import React from 'react';
import { Box, Typography, Button, Container, Paper, Stack } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { ROUTE_PATHS } from '../config/routePaths';
import { resolveLandingPath } from '../resolvers/resolveLandingPath';
import { resolveUserRoles } from '../resolvers/resolveUserRoles';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const roles = resolveUserRoles(user);

  const handleReturnToDashboard = () => {
    const landing = resolveLandingPath(roles, isAuthenticated);
    navigate(landing === ROUTE_PATHS.UNAUTHORIZED ? ROUTE_PATHS.USER_LANDING : landing);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 3,
          background: 'background.paper',
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          sx={{ width: 64, height: 64, color: 'error.main', mb: 2, display: 'inline-block' }}
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Access Denied (403)
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {isAuthenticated
            ? "Your account does not have sufficient permissions to access this area."
            : "You must be authenticated with appropriate credentials to access this area."}
        </Typography>

        {location.state?.from && (
          <Typography
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              bgcolor: 'action.hover',
              p: 1,
              borderRadius: 1,
              mb: 3,
              wordBreak: 'break-all',
            }}
          >
            Requested path: {location.state.from.pathname}
          </Typography>
        )}

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleReturnToDashboard}
          >
            Go to Your Dashboard
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              logout();
              navigate(ROUTE_PATHS.LOGIN);
            }}
          >
            Switch Account
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default UnauthorizedPage;
