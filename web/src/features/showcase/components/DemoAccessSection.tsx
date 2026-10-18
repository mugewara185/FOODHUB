import React, { useState, useId } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Person,
  Storefront,
  DeliveryDining,
  AdminPanelSettings,
  ContentCopy,
  CheckCircle,
  OpenInNew,
  SwapHoriz,
  Lock,
  Email,
  InfoOutlined,
  Key,
  Logout,
  Bolt,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { DEMO_ACCOUNTS_DATA } from '../data/demoAccountsData';
import type { DemoAccountCard } from '../types';

const ROLE_ICONS: Record<string, React.ReactNode> = {
  user: <Person sx={{ fontSize: 24 }} />,
  owner: <Storefront sx={{ fontSize: 24 }} />,
  partner: <DeliveryDining sx={{ fontSize: 24 }} />,
  admin: <AdminPanelSettings sx={{ fontSize: 24 }} />,
};

export const DemoAccessSection: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuth();

  const [copyFeedback, setCopyFeedback] = useState<{
    cardId: string;
    type: 'email' | 'password' | 'all';
  } | null>(null);

  const [activeLoginRoleId, setActiveLoginRoleId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [switchTarget, setSwitchTarget] = useState<DemoAccountCard | null>(null);

  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  // Normalize user roles safely
  const userRoles: string[] = React.useMemo(() => {
    if (!user) return [];
    if (Array.isArray(user.role)) return user.role;
    if (Array.isArray((user as any).roles)) return (user as any).roles;
    if (typeof user.role === 'string') return [user.role];
    return [];
  }, [user]);

  const handleCopy = async (cardId: string, type: 'email' | 'password' | 'all', text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyFeedback({ cardId, type });
      setTimeout(() => {
        setCopyFeedback((prev) => (prev?.cardId === cardId && prev.type === type ? null : prev));
      }, 2200);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const performLogin = async (card: DemoAccountCard) => {
    setActiveLoginRoleId(card.roleId);
    setLoginError(null);
    try {
      await login({
        email: card.email,
        password: card.password,
      });
      navigate(card.dashboardPath);
    } catch (err: any) {
      const msg =
        typeof err === 'string'
          ? err
          : err?.message ||
            `Failed to authenticate as ${card.roleName}. Verify that the backend or mock data source is active.`;
      setLoginError(msg);
    } finally {
      setActiveLoginRoleId(null);
    }
  };

  const handleExploreClick = async (card: DemoAccountCard) => {
    setLoginError(null);

    // If authenticated:
    if (isAuthenticated && user) {
      // If user already holds this exact role, navigate straight to their dashboard
      if (userRoles.includes(card.roleId)) {
        navigate(card.dashboardPath);
        return;
      }

      // If user holds a different role, confirm intentional account switch to avoid silent session overwrite
      setSwitchTarget(card);
      return;
    }

    // If unauthenticated, trigger legitimate one-click login
    await performLogin(card);
  };

  const handleConfirmSwitch = async () => {
    if (!switchTarget) return;
    const target = switchTarget;
    setSwitchTarget(null);
    await performLogin(target);
  };

  return (
    <Box id="demo-access" sx={{ mb: 8, scrollMarginTop: { xs: '80px', sm: '100px' } }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Chip
          icon={<Key sx={{ fontSize: 16, color: '#10b981 !important' }} />}
          label="DEMO ACCOUNT ACCESS & MULTI-ACTOR EXPLORATION"
          size="small"
          sx={{
            bgcolor: 'rgba(16, 185, 129, 0.1)',
            color: '#10b981',
            fontWeight: 700,
            fontSize: '0.75rem',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            mb: 1.5,
          }}
        />
        <Typography
          variant="h4"
          component="h2"
          fontWeight={900}
          sx={{
            fontSize: { xs: '1.75rem', sm: '2.25rem' },
            letterSpacing: '-0.02em',
            mb: 1.5,
          }}
        >
          Explore FoodHub as Any Actor
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 760, mx: 'auto', lineHeight: 1.6 }}
        >
          Experience the distributed application through each actor's perspective. Copy dedicated demo credentials for manual verification or use one-click authentication to enter any domain through legitimate auth and route guards.
        </Typography>
      </Box>

      {/* Active Session Status Banner (if already logged in) */}
      {isAuthenticated && user && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'primary.main',
            boxShadow: '0 2px 12px rgba(59, 130, 246, 0.08)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Active Session Established
                </Typography>
              </Stack>
              <Typography variant="body2" component="div" color="text.secondary">
                Signed in as <strong>{user.name || user.email}</strong> ({user.email}) &bull; Active Role(s):{' '}
                {userRoles.map((r) => (
                  <Chip
                    key={r}
                    label={r.toUpperCase()}
                    size="small"
                    sx={{ ml: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                ))}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<Logout />}
              onClick={logout}
              sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
            >
              Sign Out
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Global Login Error Notice */}
      {loginError && (
        <Alert
          severity="error"
          onClose={() => setLoginError(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {loginError}
        </Alert>
      )}

      {/* Role Cards Grid */}
      <Grid container spacing={3}>
        {DEMO_ACCOUNTS_DATA.map((card) => {
          const isCurrentActiveRole = isAuthenticated && userRoles.includes(card.roleId);
          const isLoggingIn = activeLoginRoleId === card.roleId;

          return (
            <Grid item xs={12} sm={6} lg={3} key={card.roleId}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: isCurrentActiveRole ? card.accentColor : 'divider',
                  boxShadow: isCurrentActiveRole
                    ? `0 4px 20px ${card.accentColor}25`
                    : '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    borderColor: card.accentColor,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 20px ${card.accentColor}18`,
                  },
                }}
              >
                {/* Card Top: Icon, Badge & Status */}
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${card.accentColor}18`,
                        color: card.accentColor,
                      }}
                    >
                      {ROLE_ICONS[card.roleId] || <Person />}
                    </Box>
                    <Chip
                      label={card.roleBadge}
                      size="small"
                      sx={{
                        bgcolor: `${card.accentColor}15`,
                        color: card.accentColor,
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        letterSpacing: '0.04em',
                      }}
                    />
                  </Stack>

                  <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.25, mb: 0.5 }}>
                    {card.roleName}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1, minHeight: 32, lineHeight: 1.3 }}
                  >
                    {card.tagline}
                  </Typography>

                  <Chip
                    label={card.status}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      borderColor: 'divider',
                      height: 22,
                    }}
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                {/* Credentials Box */}
                <Box
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  >
                    Public Demo Credentials
                  </Typography>

                  {/* Email Field */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 0.75,
                      px: 1,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, overflow: 'hidden' }}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {card.email}
                      </Typography>
                    </Stack>
                    <Tooltip
                      title={
                        copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'email'
                          ? 'Copied Email!'
                          : 'Copy Email'
                      }
                      arrow
                    >
                      <IconButton
                        size="small"
                        aria-label={`Copy email for ${card.roleName}`}
                        onClick={() => handleCopy(card.roleId, 'email', card.email)}
                        sx={{
                          p: 0.5,
                          color:
                            copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'email'
                              ? 'success.main'
                              : 'text.secondary',
                        }}
                      >
                        {copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'email' ? (
                          <CheckCircle sx={{ fontSize: 16 }} />
                        ) : (
                          <ContentCopy sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  {/* Password Field */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 0.75,
                      px: 1,
                      borderRadius: 1.5,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      mb: 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, overflow: 'hidden' }}>
                      <Lock sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        {card.password}
                      </Typography>
                    </Stack>
                    <Tooltip
                      title={
                        copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'password'
                          ? 'Copied Password!'
                          : 'Copy Password'
                      }
                      arrow
                    >
                      <IconButton
                        size="small"
                        aria-label={`Copy password for ${card.roleName}`}
                        onClick={() => handleCopy(card.roleId, 'password', card.password)}
                        sx={{
                          p: 0.5,
                          color:
                            copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'password'
                              ? 'success.main'
                              : 'text.secondary',
                        }}
                      >
                        {copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'password' ? (
                          <CheckCircle sx={{ fontSize: 16 }} />
                        ) : (
                          <ContentCopy sx={{ fontSize: 16 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  {/* Quick Copy All Credentials */}
                  <Button
                    size="small"
                    variant="text"
                    fullWidth
                    startIcon={
                      copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'all' ? (
                        <CheckCircle sx={{ fontSize: 15, color: 'success.main' }} />
                      ) : (
                        <ContentCopy sx={{ fontSize: 15 }} />
                      )
                    }
                    onClick={() =>
                      handleCopy(
                        card.roleId,
                        'all',
                        `Email: ${card.email}\nPassword: ${card.password}`
                      )
                    }
                    sx={{
                      fontSize: '0.72rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 0.3,
                      color:
                        copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'all'
                          ? 'success.main'
                          : 'text.secondary',
                    }}
                  >
                    {copyFeedback?.cardId === card.roleId && copyFeedback?.type === 'all'
                      ? 'Credentials Copied!'
                      : 'Copy Full Credentials'}
                  </Button>
                </Box>

                {/* Capabilities List */}
                <Box sx={{ mb: 2, flexGrow: 1 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    What You Can Explore:
                  </Typography>
                  <Stack spacing={0.75}>
                    {card.capabilities.map((cap, idx) => (
                      <Stack key={idx} direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircle
                          sx={{ fontSize: 14, color: card.accentColor, mt: 0.3, flexShrink: 0 }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.78rem', lineHeight: 1.35 }}>
                          {cap}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                {/* Truthful Limitations Box */}
                <Box
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(148, 163, 184, 0.08)',
                    border: '1px dashed',
                    borderColor: 'divider',
                    mb: 2,
                  }}
                >
                  <Stack direction="row" spacing={0.75} alignItems="flex-start">
                    <InfoOutlined sx={{ fontSize: 14, color: 'text.secondary', mt: 0.2, flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', lineHeight: 1.3 }}>
                      <strong>Demo Invariant:</strong> {card.limitations}
                    </Typography>
                  </Stack>
                </Box>

                {/* Action Button */}
                <Box sx={{ mt: 'auto' }}>
                  {isCurrentActiveRole ? (
                    <Button
                      variant="contained"
                      fullWidth
                      endIcon={<OpenInNew />}
                      onClick={() => navigate(card.dashboardPath)}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        bgcolor: card.accentColor,
                        color: '#ffffff',
                        boxShadow: `0 4px 12px ${card.accentColor}35`,
                        '&:hover': {
                          bgcolor: card.accentColor,
                          filter: 'brightness(0.92)',
                        },
                      }}
                    >
                      Open {card.roleName} Dashboard
                    </Button>
                  ) : isAuthenticated ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SwapHoriz />}
                      onClick={() => handleExploreClick(card)}
                      disabled={isLoggingIn}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        borderColor: card.accentColor,
                        color: card.accentColor,
                        '&:hover': {
                          bgcolor: `${card.accentColor}10`,
                          borderColor: card.accentColor,
                        },
                      }}
                    >
                      Switch to {card.roleName}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={
                        isLoggingIn ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <Bolt sx={{ color: '#ffffff' }} />
                        )
                      }
                      disabled={isLoggingIn}
                      onClick={() => handleExploreClick(card)}
                      sx={{
                        fontWeight: 700,
                        textTransform: 'none',
                        bgcolor: card.accentColor,
                        color: '#ffffff',
                        boxShadow: `0 4px 14px ${card.accentColor}40`,
                        '&:hover': {
                          bgcolor: card.accentColor,
                          filter: 'brightness(0.92)',
                        },
                      }}
                    >
                      {isLoggingIn ? 'Authenticating...' : `Explore as ${card.roleName}`}
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Deliberate Switch Account Confirmation Dialog */}
      <Dialog
        open={Boolean(switchTarget)}
        onClose={() => setSwitchTarget(null)}
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescriptionId}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 },
        }}
      >
        <DialogTitle id={dialogTitleId} sx={{ fontWeight: 800 }}>
          Switch Demo Persona
        </DialogTitle>
        <DialogContent>
          <DialogContentText id={dialogDescriptionId} sx={{ fontSize: '0.92rem', color: 'text.secondary', mb: 2 }}>
            You are currently signed in as <strong>{user?.name || user?.email}</strong> ({user?.email}) with role{' '}
            <strong>{userRoles.join(', ')}</strong>.
          </DialogContentText>
          <DialogContentText sx={{ fontSize: '0.92rem', color: 'text.primary' }}>
            Exploring as <strong>{switchTarget?.roleName}</strong> will authenticate you as{' '}
            <code>{switchTarget?.email}</code> through legitimate token authorization and navigate to{' '}
            <code>{switchTarget?.dashboardPath}</code>.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setSwitchTarget(null)}
            variant="text"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSwitch}
            variant="contained"
            color="primary"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Confirm &amp; Explore
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
