import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Badge,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { DevVersionSwitcher } from '../../core/dev/renderer/DevVersionSwitcher';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { fetchPartnerStateThunk } from '../../features/deliveryPartner/deliveryPartnerSlice';
import {
  Menu as MenuIcon,
  Dashboard,
  LocalShipping,
  History,
  AttachMoney,
  Person,
  Help,
  Settings,
  Logout,
  PowerSettingsNew,
  TrendingUp,
  Star,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useDeliveryNotifications } from '../../core/notifications/hooks/useDeliveryNotifications';
import { NotificationBell } from '../../core/notifications/components/NotificationBell';

import { useDeliveryAvailable } from '../../features/deliveryPartner/hooks/useDeliveryAvailable';
import { selectAvailableAssignments } from '../../features/deliveryPartner/deliveryPartnerSlice';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/partner' },
  { text: 'Available Orders', icon: <LocalShipping />, path: '/partner/orders' },
  { text: 'Active Delivery', icon: <TrendingUp />, path: '/partner/active' },
  { text: 'Delivery History', icon: <History />, path: '/partner/history' },
  { text: 'Earnings', icon: <AttachMoney />, path: '/partner/earnings' },
  { text: 'Profile', icon: <Person />, path: '/partner/profile' },
  { text: 'Support', icon: <Help />, path: '/partner/support' },
  { text: 'Settings', icon: <Settings />, path: '/partner/settings' },
];

const PartnerLayout: React.FC = () => {
  useDeliveryNotifications('partner');
  useDeliveryAvailable();
  
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const { user, logout } = useAuth();
  
  const partnerState = useAppSelector(state => state.deliveryPartner);
  const { isOnline, rating, completedDeliveries } = partnerState;
  const availableAssignments = useAppSelector(selectAvailableAssignments);

  useEffect(() => {
    dispatch(fetchPartnerStateThunk());
  }, [dispatch]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Partner Profile */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: isOnline ? 'success.main' : 'grey.400',
                border: '2px solid white',
              }}
            />
          }
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 1,
              border: '3px solid',
              borderColor: 'primary.main',
            }}
            src="https://i.pravatar.cc/150?img=1"
          />
        </Badge>
        <Typography variant="h6" fontWeight={700}>
          {partnerState.name || user?.name || 'Delivery Partner'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Role: {user?.role || 'Partner'} • ID: {user?.id ? user.id.slice(-6).toUpperCase() : '---'}
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Chip size="small" icon={<Star fontSize="small" />} label={rating ? `${rating} ★` : '— ★'} color="primary" variant="outlined" />
          <Chip size="small" label={`${completedDeliveries || 0} deliveries`} variant="outlined" />
        </Box>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: 500 }}
              />
              {item.path === '/partner/orders' && availableAssignments.length > 0 ? (
                <Badge badgeContent={availableAssignments.length} color="error" />
              ) : (item as any).badge && (
                <Badge badgeContent={(item as any).badge} color="error" />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{ borderRadius: 2, color: 'error.main' }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <Logout />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          ...(drawerOpen && !isMobile && { width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Partner Dashboard'}
          </Typography>

          {/* Status Badge */}
          <Chip
            size="small"
            icon={<PowerSettingsNew />}
            label={isOnline ? 'Online' : 'Offline'}
            color={isOnline ? 'success' : 'default'}
            sx={{ mr: 2 }}
          />

          <DevVersionSwitcher />

          {/* Notifications */}
          <NotificationBell />
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          ...(drawerOpen && !isMobile && { marginLeft: `${drawerWidth}px` }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default PartnerLayout;