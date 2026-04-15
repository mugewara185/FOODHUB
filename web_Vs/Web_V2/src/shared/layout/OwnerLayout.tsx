import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  Paper,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  RestaurantMenu,
  ShoppingBag,
  Analytics,
  LocalOffer,
  People,
  AttachMoney,
  Star,
  Settings,
  Help,
  Logout,
  Notifications,
  Store,
  AccessTime,
  PhotoLibrary,
  Assessment,
  Receipt,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/owner' },
  { 
    text: 'Menu Management', 
    icon: <RestaurantMenu />, 
    path: '/owner/menu',
    children: ['Menu Items', 'Categories', 'Add Item']
  },
  { 
    text: 'Orders', 
    icon: <ShoppingBag />, 
    path: '/owner/orders',
    badge: 5,
    children: ['Live Orders', 'Order History']
  },
  { 
    text: 'Analytics', 
    icon: <Analytics />, 
    path: '/owner/analytics',
    children: ['Sales Report', 'Popular Items', 'Customer Insights']
  },
  { 
    text: 'Promotions', 
    icon: <LocalOffer />, 
    path: '/owner/promotions',
    children: ['Offers', 'Coupons', 'Campaigns']
  },
  { 
    text: 'Reviews', 
    icon: <Star />, 
    path: '/owner/reviews',
    badge: 3,
  },
  { 
    text: 'Staff', 
    icon: <People />, 
    path: '/owner/staff',
  },
  { 
    text: 'Finance', 
    icon: <AttachMoney />, 
    path: '/owner/finance',
    children: ['Earnings', 'Payouts', 'Tax Reports']
  },
  { 
    text: 'Restaurant Profile', 
    icon: <Store />, 
    path: '/owner/profile',
    children: ['Business Hours', 'Location', 'Gallery']
  },
  { text: 'Settings', icon: <Settings />, path: '/owner/settings' },
  { text: 'Support', icon: <Help />, path: '/owner/support' },
];

const OwnerLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuToggle = (menuText: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuText)
        ? prev.filter(item => item !== menuText)
        : [...prev, menuText]
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Restaurant Profile */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop"
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 1,
            border: '3px solid',
            borderColor: 'primary.main',
          }}
        />
        <Typography variant="h6" fontWeight={700}>
          Spice Garden
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Indian • North Indian
        </Typography>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Chip
            size="small"
            label="4.8 ★"
            color="warning"
          />
          <Chip
            size="small"
            label="Open Now"
            color="success"
          />
        </Box>
      </Box>

      <Divider />

      {/* Quick Stats */}
      <Box sx={{ p: 2 }}>
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Grid container spacing={1}>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Today</Typography>
              <Typography variant="h6" fontWeight={700}>₹8.5k</Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Orders</Typography>
              <Typography variant="h6" fontWeight={700}>24</Typography>
            </Grid>
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Pending</Typography>
              <Typography variant="h6" fontWeight={700}>5</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Divider />

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, px: 2 }}>
        {menuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => {
                  if (item.children) {
                    handleMenuToggle(item.text);
                  } else {
                    navigate(item.path);
                  }
                }}
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
                {item.badge && (
                  <Badge badgeContent={item.badge} color="error" />
                )}
              </ListItemButton>
            </ListItem>
            
            {item.children && expandedMenus.includes(item.text) && (
              <List sx={{ pl: 4 }}>
                {item.children.map((child) => (
                  <ListItem key={child} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      onClick={() => navigate(`${item.path}/${child.toLowerCase().replace(' ', '-')}`)}
                      sx={{ borderRadius: 2, py: 0.5 }}
                    >
                      <ListItemText 
                        primary={child}
                        primaryTypographyProps={{ fontSize: '0.85rem' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </React.Fragment>
        ))}
      </List>

      <Divider />

      {/* Logout */}
      <Box sx={{ p: 2 }}>
        <ListItemButton
          onClick={() => navigate('/login')}
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
            Restaurant Dashboard
          </Typography>

          {/* Live Orders Badge */}
          <Chip
            icon={<AccessTime />}
            label="5 Live Orders"
            color="warning"
            sx={{ mr: 2 }}
          />

          {/* Notifications */}
          <IconButton>
            <Badge badgeContent={8} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* Profile */}
          <IconButton>
            <Avatar src="https://i.pravatar.cc/150?img=1" />
          </IconButton>
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

export default OwnerLayout;