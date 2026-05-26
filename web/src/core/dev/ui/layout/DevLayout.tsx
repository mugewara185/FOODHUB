import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Avatar,
  InputBase,
  Paper,
  CircularProgress,
  ListItemButton,
  Tooltip,
  Fade,
  Zoom,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  useTheme as useMaterialThemeIcon,
  alpha,
  Stack,
  Popper,
  Grow,
  Paper as MuiPaper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  ShoppingCart,
  Person,
  FavoriteBorder,
  LocationOn,
  Home,
  Restaurant,
  LocalMall,
  History,
  Help,
  Settings,
  Login,
  Logout,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  Fastfood,
  Star,
  SupportAgent,
  Code,
  BugReport,
  Terminal,
  Storage,
  Api,
  Security,
  Speed,
  Palette,
  GridView,
  Analytics,
  CloudSync,
  Memory,
  NetworkCheck,
  Build,
  VerifiedUser,
  GitHub,
  DarkMode,
  LightMode,
  Computer,
  Phone,
  Tablet,
  Visibility,
  VisibilityOff,
  WbSunny,
  Nightlight,
  Timeline,
  DataUsage,
  Http,
  IntegrationInstructions,
  Science,
  PrecisionManufacturing,
  RocketLaunch,
  AccountTree
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_NAME } from '@core/constants/food';
import { useAuth } from '@contexts/AuthContext';
import { useAppSelector, useAppDispatch } from '@app/store';
import { DevVersionSwitcher } from '@/core/dev/renderer/DevVersionSwitcher';
// import FloatingDevConsole from '@/core/dev/ui/modals/FloatingDevConsole';
import { useMediaQuery, useTheme } from '@mui/material';

// Import dev tools
import { useDevContext } from '@core/dev/contexts/DevContext';
import { DevErrorBoundary } from '@/core/dev/renderer/DevErrorBoundary';
// import ComponentPlayground  from '@/core/dev/ui/components/ComponentPlayground';

// Cart selector
import { selectCartItems } from '@features/cart/cartSlice';
import { Trees } from 'lucide-react';
// import DevToolbar from '../ToolBar';

interface DevMetric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

const DevLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { availableVersions, selectedVersions, updateVersion } = useDevContext();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Start collapsed
  const [darkMode, setDarkMode] = useState(false);
  const [showDevTools, setShowDevTools] = useState(true);
  const [metricsAnchor, setMetricsAnchor] = useState<null | HTMLElement>(null);
  const [performanceAnchor, setPerformanceAnchor] = useState<null | HTMLElement>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'info' | 'success' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const cartItemsCount = useAppSelector(selectCartItems).length;

  // Dev metrics
  const devMetrics: DevMetric[] = [
    { label: 'API Latency', value: '124ms', icon: <Speed />, color: '#4CAF50', trend: 'down' },
    { label: 'Bundle Size', value: '2.4MB', icon: <DataUsage />, color: '#FF9800', trend: 'stable' },
    { label: 'Memory Usage', value: '156MB', icon: <Memory />, color: '#2196F3', trend: 'up' },
    { label: 'Active Versions', value: Object.keys(availableVersions).length, icon: <Code />, color: '#9C27B0', trend: 'stable' },
    { label: 'Components', value: '24', icon: <GridView />, color: '#00BCD4', trend: 'up' },
    { label: 'API Calls', value: '1.2k', icon: <Http />, color: '#FF5722', trend: 'down' },
  ];

  // Enhanced menu items for dev role
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dev', color: '#FF6B6B', devOnly: true },
    { text: 'Components', icon: <Code />, path: '/dev/components', color: '#4ECDC4', devOnly: true },
    { text: 'Component Tree', icon: <AccountTree />, path: '/dev/component-tree', color: '#4ECDC4', devOnly: true },
    // { text: 'Component Tree2', icon: <Trees />, path: '/dev/component-tree2', color: '#4ECDC4', devOnly: true },
    { text: 'State Inspector', icon: <Storage />, path: '/dev/state', color: '#45B7D1', devOnly: true },
    { text: 'Props & Overrides', icon: <Build />, path: '/dev/props', color: '#FFA07A', devOnly: true },
    { text: 'Version Switcher', icon: <CloudSync />, path: '/dev/versions', color: '#98D8C8', devOnly: true },
    { text: 'Network & API', icon: <Http />, path: '/dev/network', color: '#F7DC6F', devOnly: true },
    { text: 'Events & Logs', icon: <Timeline />, path: '/dev/logs', color: '#BB8FCE', devOnly: true },
    { text: 'Performance', icon: <Speed />, path: '/dev/performance', color: '#FF6B6B', devOnly: true },
    { text: 'Documentation', icon: <IntegrationInstructions />, path: '/dev/docs', color: '#4ECDC4', devOnly: true },
    // { text: 'API Playground', icon: <Api />, path: '/dev/api', color: '#45B7D1', devOnly: true },
    // { text: 'Security', icon: <Security />, path: '/dev/security', color: '#BB8FCE', devOnly: true },
    // { text: 'Performance', icon: <Speed />, path: '/dev/performance', color: '#FFA07A', devOnly: true },
    // { text: 'Testing', icon: <BugReport />, path: '/dev/testing', color: '#98D8C8', devOnly: true },
    // { text: 'Analytics', icon: <Analytics />, path: '/dev/analytics', color: '#F7DC6F', devOnly: true },
    // { text: 'Deployment', icon: <RocketLaunch />, path: '/dev/deploy', color: '#FF6B6B', devOnly: true },
  ];

  // Regular menu items
  const regularMenuItems = [
    { text: 'Home', icon: <Home />, path: '/', color: '#FF6B6B' },
    { text: 'Restaurants', icon: <Restaurant />, path: '/restaurants', color: '#4ECDC4' },
    { text: 'My Orders', icon: <LocalMall />, path: '/orders', color: '#45B7D1' },
    { text: 'Favorites', icon: <FavoriteBorder />, path: '/favorites', color: '#FFA07A' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  const showNotification = (message: string, severity: 'info' | 'success' | 'warning' | 'error') => {
    setNotification({ open: true, message, severity });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.style.backgroundColor = darkMode ? '#fff' : '#121212';
    document.body.style.color = darkMode ? '#000' : '#fff';
    showNotification(`Dark mode ${!darkMode ? 'enabled' : 'disabled'}`, 'success');
  };

  const sidebarWidth = isSidebarExpanded ? 320 : 80;
  const shouldShowText = isSidebarExpanded;

  return (
    <DevErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: darkMode ? '#121212' : '#f5f5f5' }}>
        {/* Dev Sidebar - Ultra Rich */}
        <Box
          component={motion.div}
          animate={{ width: sidebarWidth }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          sx={{
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            bgcolor: darkMode ? '#1e1e1e' : 'background.paper',
            borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            zIndex: 1300,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isSidebarExpanded ? 8 : 2,
          }}
        >
          {/* Header with Dev Badge */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: shouldShowText ? 'space-between' : 'center',
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              minHeight: 64,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            }}
          >
            <AnimatePresence mode="wait">
              {shouldShowText ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Code sx={{ color: 'primary.main', fontSize: 28 }} />
                    <Box>
                      <Typography variant="h6" fontWeight={800} noWrap>
                        DEV BAR
                      </Typography>
                      <Chip
                        label="v3.0.0-beta"
                        size="small"
                        color="primary"
                        sx={{ height: 16, fontSize: '0.6rem', mt: 0.5 }}
                      />
                    </Box>
                  </Stack>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Tooltip title="DEV BAR" placement="right" arrow>
                    <Science sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>

            <IconButton
              onClick={toggleSidebar}
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              {isSidebarExpanded ? <ChevronLeft /> : <ChevronRight />}
            </IconButton>
          </Box>

          {/* Dev Profile with Stats */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              cursor: 'pointer',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
            }}
            onClick={() => handleNavigation('/dev/profile')}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent={shouldShowText ? 'flex-start' : 'center'}>
              <Tooltip title={!shouldShowText ? `${user?.name || 'Dev User'}` : ''} placement="right" arrow>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: shouldShowText ? 48 : 40,
                    height: shouldShowText ? 48 : 40,
                    border: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  {user?.name?.charAt(0) || <Person />}
                </Avatar>
              </Tooltip>

              <AnimatePresence mode="wait">
                {shouldShowText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ flex: 1 }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {user?.name || 'Dev User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {user?.email || 'developer@example.com'}
                      </Typography>
                      <Chip
                        icon={<VerifiedUser />}
                        label="Senior Engineer"
                        size="small"
                        color="info"
                        sx={{ mt: 0.5, height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Stack>
          </Box>

          {/* Live Dev Metrics */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Stack spacing={1.5}>
              {devMetrics.slice(0, shouldShowText ? 3 : 2).map((metric, index) => (
                <Tooltip key={index} title={!shouldShowText ? metric.label : ''} placement="right" arrow>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: shouldShowText ? 'space-between' : 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: alpha(metric.color, 0.1),
                      border: `1px solid ${alpha(metric.color, 0.3)}`,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s ease',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ color: metric.color }}>{metric.icon}</Box>
                      {shouldShowText && (
                        <Typography variant="caption" color="text.secondary">
                          {metric.label}
                        </Typography>
                      )}
                    </Stack>
                    {shouldShowText && (
                      <Typography variant="body2" fontWeight={700} sx={{ color: metric.color }}>
                        {metric.value}
                      </Typography>
                    )}
                  </Box>
                </Tooltip>
              ))}
            </Stack>
          </Box>

          {/* Navigation Sections */}
          <List sx={{ flex: 1, px: 1, py: 2, overflow: 'auto' }}>
            <Typography variant="caption" sx={{ px: 2, mb: 1, display: shouldShowText ? 'block' : 'none', color: 'text.secondary' }}>
              DEVELOPMENT
            </Typography>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Tooltip key={item.text} title={!shouldShowText ? item.text : ''} placement="right" arrow>
                  <ListItemButton
                    component={motion.div}
                    whileHover={{
                      scale: !shouldShowText ? 1.2 : 1.02,
                      x: !shouldShowText ? 0 : 5,
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      justifyContent: shouldShowText ? 'initial' : 'center',
                      px: shouldShowText ? 2 : 1,
                      py: 1.5,
                      bgcolor: isActive ? alpha(theme.palette.primary.main, 0.2) : 'transparent',
                      borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: shouldShowText ? 40 : 'auto',
                        justifyContent: 'center',
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <AnimatePresence mode="wait">
                      {shouldShowText && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                        >
                          <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                              fontWeight: isActive ? 600 : 400,
                              fontSize: '0.9rem',
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {isActive && shouldShowText && (
                      <Chip label="Active" size="small" color="primary" sx={{ ml: 'auto', height: 20 }} />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}

            <Divider sx={{ my: 2, display: shouldShowText ? 'flex' : 'none' }} />

            <Typography variant="caption" sx={{ px: 2, mb: 1, display: shouldShowText ? 'block' : 'none', color: 'text.secondary' }}>
              APPLICATION
            </Typography>
            {regularMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Tooltip key={item.text} title={!shouldShowText ? item.text : ''} placement="right" arrow>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      justifyContent: shouldShowText ? 'initial' : 'center',
                      px: shouldShowText ? 2 : 1,
                      py: 1.5,
                      bgcolor: isActive ? alpha(theme.palette.primary.main, 0.2) : 'transparent',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        transform: !shouldShowText ? 'scale(1.1)' : 'none',
                        transition: 'transform 0.2s ease',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: shouldShowText ? 40 : 'auto', justifyContent: 'center', color: item.color }}>
                      {item.icon}
                    </ListItemIcon>
                    {shouldShowText && <ListItemText primary={item.text} />}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>

          {/* Dev Tools Section */}
          <Box sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <Tooltip title={!shouldShowText ? 'Dev Tools' : ''} placement="right">
              <FormControlLabel
                control={
                  <Switch
                    checked={showDevTools}
                    onChange={(e) => setShowDevTools(e.target.checked)}
                    color="primary"
                  />
                }
                label={shouldShowText ? "Show Dev Tools" : ""}
                sx={{ m: 0, width: '100%', justifyContent: shouldShowText ? 'space-between' : 'center' }}
              />
            </Tooltip>

            <Tooltip title={!shouldShowText ? (darkMode ? 'Light Mode' : 'Dark Mode') : ''} placement="right">
              <IconButton
                onClick={toggleDarkMode}
                sx={{
                  width: '100%',
                  justifyContent: shouldShowText ? 'flex-start' : 'center',
                  mt: 1,
                  gap: 2,
                  '&:hover': {
                    transform: !shouldShowText ? 'scale(1.1)' : 'none',
                    transition: 'transform 0.2s ease',
                  },
                }}
              >
                {darkMode ? <WbSunny /> : <Nightlight />}
                {shouldShowText && <Typography variant="body2">{darkMode ? 'Light Mode' : 'Dark Mode'}</Typography>}
              </IconButton>
            </Tooltip>

            <Tooltip title={!shouldShowText ? 'Version Control' : ''} placement="right">
              <Box sx={{ mt: 1 }}>
                <DevVersionSwitcher />
              </Box>
            </Tooltip>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: `${sidebarWidth}px`,
            transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Dev App Bar */}
          <AppBar
            position="sticky"
            color="default"
            sx={{
              zIndex: 1200,
              bgcolor: darkMode ? '#1e1e1e' : 'background.paper',
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            
            <Toolbar>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  flexGrow: 1,
                  cursor: 'pointer',
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
                onClick={() => navigate('/')}
              >
                {APP_NAME} • Dev Environment
              </Typography>

              {/* Quick Actions */}
              <Button
                startIcon={<GitHub />}
                color="inherit"
                sx={{ mr: 1, display: isMobile ? 'none' : 'flex' }}
                onClick={() => window.open('https://github.com', '_blank')}
              >
                GitHub
              </Button>

              <Button
                startIcon={<Build />}
                color="inherit"
                sx={{ mr: 1, display: isMobile ? 'none' : 'flex' }}
                onClick={() => setMetricsAnchor(performanceAnchor)}
              >
                Performance
              </Button>
              {/* make it as loading state i.e from red colr to green on laoding all the resources and show notification when all resources are loaded successfully with green color and if any error occurs show notification with red color. */}
              <IconButton onClick={() => showNotification('System ready', 'success')}>
                <Terminal />
              </IconButton>
            </Toolbar>
            {/* <DevToolbar/> */}

            {/* Dev Search Bar */}
            <Box sx={{ px: 2, pb: 2 }}>
              <Paper
                sx={{
                  p: '2px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 20,
                  bgcolor: darkMode ? alpha(theme.palette.common.white, 0.05) : 'white',
                }}
              >
                <SearchIcon sx={{ color: 'text.secondary' }} />
                <InputBase
                  sx={{ ml: 1, flex: 1 }}
                  placeholder="Search components, APIs, routes..."
                />
                <Chip label="⌘K" size="small" sx={{ ml: 1 }} />
              </Paper>
            </Box>
          </AppBar>

          {/* Page Content with Dev Tools */}
          <Box sx={{ flexGrow: 1, p: 3 }}>
            {showDevTools && (
              <Alert
                icon={<Science />}
                severity="info"
                sx={{ mb: 3 }}
                action={
                  <Button color="inherit" size="small" onClick={() => setShowDevTools(false)}>
                    Dismiss
                  </Button>
                }
              >
                <strong>Development Mode Active</strong> — You're in the dev environment. Component swapping, hot reload, and debugging tools are available.
              </Alert>
            )}

            <Outlet />
          </Box>
        </Box>

        {/* Floating Dev Console */}
        {/* <FloatingDevConsole
          allRestaurants={[]}
          featuredRestaurants={[]}
          loading={false}
          availableVersions={availableVersions}
          selectedVersions={selectedVersions}
          cuisineLength={0}
        /> */}

        {/* Notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={notification.severity} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </DevErrorBoundary>
  );
};

export default DevLayout;