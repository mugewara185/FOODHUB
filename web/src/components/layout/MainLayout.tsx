import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
  CircularProgress
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
  Login, Logout
} from '@mui/icons-material';
import { APP_NAME } from '../../constants/food';

import { useAuth } from '../../contexts/AuthContext';

const MainLayout: React.FC = () => {
  // console.log('%c<MainLayout/>','color:orange')
  const { user, isAuthenticated, isLoading, logout } = useAuth(); // Get auth state
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItemsCount] = useState(3);

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Restaurants', icon: <Restaurant />, path: '/restaurants' },
    { text: 'My Orders', icon: <LocalMall />, path: '/orders' },
    { text: 'Favorites', icon: <FavoriteBorder />, path: '/favorites' },
    { text: 'Order History', icon: <History />, path: '/history' },
    { text: 'Help', icon: <Help />, path: '/help' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar position="sticky" color="primary">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            {APP_NAME}
          </Typography>

          {/* Location Selector */}
          <Button
            color="inherit"
            startIcon={<LocationOn />}
            sx={{ mr: 2 }}
            onClick={() => navigate('/location')}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                Deliver to
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Home • 123 Street
              </Typography>
            </Box>
          </Button>

          {/* Cart */}
          <IconButton color="inherit" onClick={() => navigate('/cart')}>
            <Badge badgeContent={cartItemsCount} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>

          {/* Profile */}
          <IconButton
            onClick={() => navigate('/profile')}
            sx={{ ml: 2 }}
          >
            <Avatar sx={{ width: 32, height: 32 }} src={user?.avatar}>
              {user?.name?.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>

        {/* Search Bar */}
        <Box sx={{ px: 2, pb: 2 }}>
          <Paper
            component="form"
            sx={{
              p: '2px 16px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 20,
              bgcolor: 'white',
            }}
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/search');
            }}
          >
            <IconButton type="submit" sx={{ p: '10px' }}>
              <SearchIcon />
            </IconButton>
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Search for restaurants or dishes..."
              inputProps={{ 'aria-label': 'search food' }}
            />
          </Paper>
        </Box>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="body1" fontWeight={600}>
              John Doe
            </Typography>
            <Typography variant="body2" color="text.secondary">
              john@example.com
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.text}
              button
              onClick={() => {
                navigate(item.path);
                handleDrawerToggle();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => navigate('/login')}
          >
            Login / Sign Up
          </Button>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>

      {/* Bottom Navigation (Mobile) */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          zIndex: 1000,
        }}
      >
        {[
          { icon: <Home />, label: 'Home', path: '/' },
          { icon: <SearchIcon />, label: 'Search', path: '/search' },
          { icon: <ShoppingCart />, label: 'Cart', path: '/cart' },
          { icon: <Person />, label: 'Profile', path: '/profile' },
        ].map((item) => (
          <Button
            key={item.label}
            fullWidth
            onClick={() => navigate(item.path)}
            sx={{
              flexDirection: 'column',
              py: 1,
              minWidth: 0,
              color: 'text.secondary',
            }}
          >
            {item.icon}
            <Typography variant="caption">{item.label}</Typography>
          </Button>
        ))}
      </Box>
    </Box>
    </>
  );
};

export default MainLayout;