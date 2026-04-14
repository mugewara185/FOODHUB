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
  Menu,
  MenuItem,
  Chip,
  Paper,
  InputBase,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import { DevVersionSwitcher } from '../../core/dev/renderer/DevVersionSwitcher';
import {
  Menu as MenuIcon,
  Dashboard,
  Restaurant,
  Fastfood,
  People,
  Payment,
  LocalOffer,
  Assessment,
  Settings,
  Logout,
  Notifications,
  Search,
  ChevronLeft,
  ShoppingBag,
  DeliveryDining,
  Category,
  Receipt,
  BarChart,
  AdminPanelSettings,
  DarkMode,
  LightMode,
} from '@mui/icons-material';

const drawerWidth = 280;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
  { 
    text: 'Orders', 
    icon: <ShoppingBag />, 
    path: '/admin/orders',
    badge: 24,
    children: [
      { text: 'All Orders', path: '/admin/orders' },
      { text: 'Order Analytics', path: '/admin/orders/analytics' },
    ]
  },
  { 
    text: 'Restaurants', 
    icon: <Restaurant />, 
    path: '/admin/restaurants',
    children: [
      { text: 'All Restaurants', path: '/admin/restaurants' },
      { text: 'Add Restaurant', path: '/admin/restaurants/add' },
      { text: 'Categories', path: '/admin/restaurants/categories' },
    ]
  },
  { 
    text: 'Menu Management', 
    icon: <Fastfood />, 
    path: '/admin/menu',
    children: [
      { text: 'Menu Items', path: '/admin/menu' },
      { text: 'Categories', path: '/admin/menu/categories' },
      { text: 'Add Item', path: '/admin/menu/add' },
    ]
  },
  { 
    text: 'Users', 
    icon: <People />, 
    path: '/admin/users',
    children: [
      { text: 'Customers', path: '/admin/users' },
      { text: 'Delivery Partners', path: '/admin/users/delivery' },
    ]
  },
  { text: 'Payments', icon: <Payment />, path: '/admin/payments' },
  { text: 'Promotions', icon: <LocalOffer />, path: '/admin/promotions' },
  { text: 'Reports', icon: <Assessment />, path: '/admin/reports' },
  { text: 'Settings', icon: <Settings />, path: '/admin/settings' },
];

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMenuToggle = (menuText: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuText)
        ? prev.filter(item => item !== menuText)
        : [...prev, menuText]
    );
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    // Implement logout logic
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Toolbar sx={{ justifyContent: 'center', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettings sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h6" fontWeight={700} color="primary.main">
            Admin Panel
          </Typography>
        </Box>
      </Toolbar>
      
      <Divider />
      
      {/* Admin Profile Summary */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mx: 'auto',
            mb: 1,
            border: '3px solid',
            borderColor: 'primary.main',
          }}
          src="https://i.pravatar.cc/150?img=7"
        />
        <Typography variant="subtitle1" fontWeight={600}>
          Admin User
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          Super Admin
        </Typography>
        <Chip
          label="Online"
          size="small"
          color="success"
          sx={{ mt: 1, fontSize: '0.7rem', height: 20 }}
        />
      </Box>
      
      <Divider />
      
      {/* Menu Items */}
      <List sx={{ flexGrow: 1, px: 1 }}>
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
                  primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                />
                {item.badge && (
                  <Badge badgeContent={item.badge} color="error" max={99} />
                )}
                {item.children && (
                  <ChevronLeft
                    sx={{
                      transform: expandedMenus.includes(item.text) ? 'rotate(-90deg)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
            
            {/* Submenu */}
            {item.children && expandedMenus.includes(item.text) && (
              <List sx={{ pl: 4 }}>
                {item.children.map((child) => (
                  <ListItem key={child.text} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={location.pathname === child.path}
                      onClick={() => navigate(child.path)}
                      sx={{
                        borderRadius: 2,
                        py: 0.5,
                        '&.Mui-selected': {
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                        },
                      }}
                    >
                      <ListItemText 
                        primary={child.text}
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
      
      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          v2.0.0 • © 2024 FoodHub
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          ...(open && !isMobile && { width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Search */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 0.5,
              borderRadius: 3,
              bgcolor: 'grey.100',
              flex: { xs: 1, md: 0.4 },
            }}
          >
            <Search sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
            <InputBase
              placeholder="Search orders, restaurants, users..."
              sx={{ flex: 1 }}
            />
          </Paper>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Right Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleNotificationOpen}>
              <Badge badgeContent={8} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <DevVersionSwitcher />
            
            <IconButton onClick={() => {
              // Toggle theme mode logic here
                // You'll need to integrate this with your theme provider
              console.log('Toggle theme mode');
            }}>
              {theme.palette.mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
            
            <IconButton onClick={handleProfileMenuOpen}>
              <Avatar sx={{ width: 35, height: 35 }} src="https://i.pravatar.cc/150?img=7" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={open}
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
        // justifyItems={'left'}
        // display={'flex'}
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          minHeight: '100vh',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && !isMobile && { marginLeft: `${drawerWidth-0}px` }),
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{ sx: { mt: 1.5, borderRadius: 2, minWidth: 200 } }}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/admin/profile'); }}>
          <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/admin/settings'); }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            width: 360,
            maxHeight: 500,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <MenuItem key={i} sx={{ whiteSpace: 'normal', py: 1.5 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  New Order #{`ORD-2024-00${i}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  From Spice Garden • ₹{450 + i * 100}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  5 minutes ago
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Box>
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Button size="small">View All</Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default AdminLayout;