// import React, { useState } from 'react';
// import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// import {
//   Box,
//   AppBar,
//   Toolbar,
//   IconButton,
//   Typography,
//   Badge,
//   Container,
//   Drawer,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   Divider,
//   Button,
//   Avatar,
//   InputBase,
//   Paper,
//   CircularProgress,
//   ListItemButton,
//   Tooltip,
//   Fade,
//   Zoom,
// } from '@mui/material';
// import {
//   Menu as MenuIcon,
//   Search as SearchIcon,
//   ShoppingCart,
//   Person,
//   FavoriteBorder,
//   LocationOn,
//   Home,
//   Restaurant,
//   LocalMall,
//   History,
//   Help,
//   Settings,
//   Login,
//   Logout,
//   ChevronLeft,
//   ChevronRight,
//   Dashboard,
//   Fastfood,
//   Star,
//   SupportAgent,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { APP_NAME } from '../../core/constants/food';
// import { useAuth } from '../../contexts/AuthContext';
// import { useAppSelector, useAppDispatch } from '../../app/store';
// import { DevVersionSwitcher } from '../../core/dev/components/DevVersionSwitcher';

// //cartSelector
// import { selectCartItems } from '../../features/cart/cartSlice';

// const MainLayout: React.FC = () => {
//   const { user, isAuthenticated, isLoading, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
//   const [isHovering, setIsHovering] = useState(false);
//   const cartItemsCount = useAppSelector(selectCartItems).length;

//   const menuItems = [
//     { text: 'Home', icon: <Home />, path: '/', color: '#FF6B6B' },
//     { text: 'Restaurants', icon: <Restaurant />, path: '/restaurants', color: '#4ECDC4' },
//     { text: 'My Orders', icon: <LocalMall />, path: '/orders', color: '#45B7D1' },
//     { text: 'Favorites', icon: <FavoriteBorder />, path: '/favorites', color: '#FFA07A' },
//     { text: 'Order History', icon: <History />, path: '/history', color: '#98D8C8' },
//     { text: 'Help', icon: <Help />, path: '/help', color: '#F7DC6F' },
//     { text: 'Settings', icon: <Settings />, path: '/settings', color: '#BB8FCE' },
//   ];

//   const handleNavigation = (path: string) => {
//     navigate(path);
//     if (!isSidebarExpanded && !isHovering) {
//       // If sidebar is collapsed, keep it collapsed after navigation
//       setIsSidebarExpanded(false);
//     }
//   };

//   const toggleSidebar = () => {
//     setIsSidebarExpanded(!isSidebarExpanded);
//     setIsHovering(false);
//   };

//   const handleMouseEnter = () => {
//     if (!isSidebarExpanded) {
//       setIsHovering(true);
//     }
//   };

//   const handleMouseLeave = () => {
//     if (!isSidebarExpanded) {
//       setIsHovering(false);
//     }
//   };

//   const sidebarWidth = isSidebarExpanded || isHovering ? 280 : 72;
//   const shouldShowText = isSidebarExpanded || isHovering;

//   return (
//     <Box sx={{ display: 'flex', minHeight: '100vh' }}>
//       {/* Custom Sidebar */}
//       <Box
//         component={motion.div}
//         animate={{ width: sidebarWidth }}
//         transition={{ type: 'spring', stiffness: 300, damping: 30 }}
//         onMouseEnter={handleMouseEnter}
//         onMouseLeave={handleMouseLeave}
//         sx={{
//           position: 'fixed',
//           left: 0,
//           top: 0,
//           height: '100vh',
//           bgcolor: 'background.paper',
//           borderRight: '1px solid',
//           borderColor: 'divider',
//           zIndex: 1200,
//           overflow: 'hidden',
//           display: 'flex',
//           flexDirection: 'column',
//           boxShadow: isSidebarExpanded || isHovering ? 4 : 0,
//           transition: 'box-shadow 0.3s ease',
//         }}
//       >
//         {/* Sidebar Header with Toggle Button */}
//         <Box
//           sx={{
//             p: 2,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: shouldShowText ? 'space-between' : 'center',
//             borderBottom: '1px solid',
//             borderColor: 'divider',
//             minHeight: 64,
//           }}
//         >
//           <AnimatePresence mode="wait">
//             {shouldShowText ? (
//               <motion.div
//                 key="expanded"
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -20 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <Typography variant="h6" fontWeight={700} noWrap>
//                   {APP_NAME}
//                 </Typography>
//               </motion.div>
//             ) : (
//               <motion.div
//                 key="collapsed"
//                 initial={{ opacity: 0, scale: 0.8 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.8 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <Fastfood sx={{ fontSize: 28, color: 'primary.main' }} />
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <IconButton
//             onClick={toggleSidebar}
//             size="small"
//             sx={{
//               ml: shouldShowText ? 1 : 0,
//               bgcolor: 'action.hover',
//               '&:hover': { bgcolor: 'action.selected' },
//             }}
//           >
//             {isSidebarExpanded ? <ChevronLeft /> : <ChevronRight />}
//           </IconButton>
//         </Box>

//         {/* User Profile Section */}
//         <Box
//           sx={{
//             p: 2,
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: shouldShowText ? 'flex-start' : 'center',
//             gap: 2,
//             borderBottom: '1px solid',
//             borderColor: 'divider',
//             cursor: 'pointer',
//             '&:hover': { bgcolor: 'action.hover' },
//           }}
//           onClick={() => handleNavigation('/profile')}
//         >
//           <Avatar 
//             sx={{ 
//               bgcolor: 'primary.main',
//               width: shouldShowText ? 40 : 32,
//               height: shouldShowText ? 40 : 32,
//               transition: 'all 0.2s ease',
//             }}
//             src={user?.avatar}
//           >
//             {user?.name?.charAt(0) || <Person />}
//           </Avatar>
          
//           <AnimatePresence mode="wait">
//             {shouldShowText && (
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <Box>
//                   <Typography variant="body2" fontWeight={600} noWrap>
//                     {user?.name || 'Guest User'}
//                   </Typography>
//                   <Typography variant="caption" color="text.secondary" noWrap>
//                     {user?.email || 'Sign in to account'}
//                   </Typography>
//                 </Box>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </Box>

//         {/* Navigation Menu */}
//         <List sx={{ flex: 1, px: 1, py: 2 }}>
//           {menuItems.map((item) => {
//             const isActive = location.pathname === item.path;
//             return (
//               <Tooltip
//                 key={item.text}
//                 title={!shouldShowText ? item.text : ''}
//                 placement="right"
//                 arrow
//               >
//                 <ListItemButton
//                   component={motion.div}
//                   whileHover={{ scale: 1.05, x: 5 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={() => handleNavigation(item.path)}
//                   sx={{
//                     borderRadius: 2,
//                     mb: 0.5,
//                     justifyContent: shouldShowText ? 'initial' : 'center',
//                     px: shouldShowText ? 2 : 1,
//                     py: 1.5,
//                     bgcolor: isActive ? 'primary.main' : 'transparent',
//                     color: isActive ? 'white' : 'text.primary',
//                     '&:hover': {
//                       bgcolor: isActive ? 'primary.dark' : 'action.hover',
//                     },
//                   }}
//                 >
//                   <ListItemIcon
//                     sx={{
//                       minWidth: shouldShowText ? 40 : 'auto',
//                       justifyContent: 'center',
//                       color: isActive ? 'white' : item.color,
//                     }}
//                   >
//                     {item.icon}
//                   </ListItemIcon>
//                   <AnimatePresence mode="wait">
//                     {shouldShowText && (
//                       <motion.div
//                         initial={{ opacity: 0, x: -10 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         exit={{ opacity: 0, x: -10 }}
//                         transition={{ duration: 0.2 }}
//                       >
//                         <ListItemText 
//                           primary={item.text}
//                           primaryTypographyProps={{
//                             fontWeight: isActive ? 600 : 400,
//                             fontSize: '0.9rem',
//                           }}
//                         />
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </ListItemButton>
//               </Tooltip>
//             );
//           })}
//         </List>

//         <Divider />

//         {/* Bottom Actions */}
//         <Box sx={{ p: 2 }}>
//           <Tooltip title={!shouldShowText ? 'Cart' : ''} placement="right" arrow>
//             <ListItemButton
//               onClick={() => handleNavigation('/cart')}
//               sx={{
//                 borderRadius: 2,
//                 justifyContent: shouldShowText ? 'initial' : 'center',
//                 px: shouldShowText ? 2 : 1,
//                 py: 1.5,
//                 mb: 1,
//               }}
//             >
//               <ListItemIcon sx={{ minWidth: shouldShowText ? 40 : 'auto', justifyContent: 'center' }}>
//                 <Badge badgeContent={cartItemsCount} color="error">
//                   <ShoppingCart />
//                 </Badge>
//               </ListItemIcon>
//               <AnimatePresence mode="wait">
//                 {shouldShowText && (
//                   <motion.div
//                     initial={{ opacity: 0, x: -10 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     exit={{ opacity: 0, x: -10 }}
//                   >
//                     <ListItemText primary="Cart" />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </ListItemButton>
//           </Tooltip>

//           <Tooltip title={!shouldShowText ? (isAuthenticated ? 'Logout' : 'Login') : ''} placement="right" arrow>
//             <ListItemButton
//               onClick={() => isAuthenticated ? logout() : navigate('/login')}
//               sx={{
//                 borderRadius: 2,
//                 justifyContent: shouldShowText ? 'initial' : 'center',
//                 px: shouldShowText ? 2 : 1,
//                 py: 1.5,
//               }}
//             >
//               <ListItemIcon sx={{ minWidth: shouldShowText ? 40 : 'auto', justifyContent: 'center' }}>
//                 {isAuthenticated ? <Logout /> : <Login />}
//               </ListItemIcon>
//               <AnimatePresence mode="wait">
//                 {shouldShowText && (
//                   <motion.div
//                     initial={{ opacity: 0, x: -10 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     exit={{ opacity: 0, x: -10 }}
//                   >
//                     <ListItemText primary={isAuthenticated ? 'Logout' : 'Login'} />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </ListItemButton>
//           </Tooltip>
//         </Box>
//       </Box>

//       {/* Main Content Area */}
//       <Box
//         component="main"
//         sx={{
//           flexGrow: 1,
//           ml: `${sidebarWidth}px`,
//           transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
//           minHeight: '100vh',
//           display: 'flex',
//           flexDirection: 'column',
//         }}
//       >
//         {/* Top App Bar */}
//         <AppBar position="sticky" color="primary" sx={{ zIndex: 1100 }}>
//           <Toolbar>
//             <Typography
//               variant="h6"
//               noWrap
//               component="div"
//               sx={{ flexGrow: 1, cursor: 'pointer' }}
//               onClick={() => navigate('/')}
//             >
//               {APP_NAME}
//             </Typography>

//             {/* Location Selector */}
//             <Button
//               color="inherit"
//               startIcon={<LocationOn />}
//               sx={{ mr: 2, display: { xs: 'none', md: 'flex' } }}
//               onClick={() => navigate('/location')}
//             >
//               <Box sx={{ textAlign: 'left' }}>
//                 <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
//                   Deliver to
//                 </Typography>
//                 <Typography variant="body2" sx={{ fontWeight: 600 }}>
//                   Home • 123 Street
//                 </Typography>
//               </Box>
//             </Button>

//             <DevVersionSwitcher />

//             {/* Profile Icon for Mobile */}
//             <IconButton
//               onClick={() => navigate('/profile')}
//               sx={{ ml: 1, display: { xs: 'flex', md: 'none' } }}
//             >
//               <Avatar sx={{ width: 32, height: 32 }} src={user?.avatar}>
//                 {user?.name?.charAt(0) || <Person />}
//               </Avatar>
//             </IconButton>
//           </Toolbar>

//           {/* Search Bar */}
//           <Box sx={{ px: 2, pb: 2 }}>
//             <Paper
//               component="form"
//               sx={{
//                 p: '2px 16px',
//                 display: 'flex',
//                 alignItems: 'center',
//                 borderRadius: 20,
//                 bgcolor: 'white',
//               }}
//               onSubmit={(e) => {
//                 e.preventDefault();
//                 navigate('/search');
//               }}
//             >
//               <IconButton type="submit" sx={{ p: '10px' }}>
//                 <SearchIcon />
//               </IconButton>
//               <InputBase
//                 sx={{ ml: 1, flex: 1 }}
//                 placeholder="Search for restaurants or dishes..."
//                 inputProps={{ 'aria-label': 'search food' }}
//               />
//             </Paper>
//           </Box>
//         </AppBar>

//         {/* Page Content */}
//         <Box sx={{ flexGrow: 1 }}>
//           <Outlet />
//         </Box>

//         {/* Bottom Navigation (Mobile) */}
//         <Box
//           sx={{
//             display: { xs: 'flex', md: 'none' },
//             position: 'fixed',
//             bottom: 0,
//             left: 0,
//             right: 0,
//             bgcolor: 'background.paper',
//             borderTop: 1,
//             borderColor: 'divider',
//             zIndex: 1000,
//           }}
//         >
//           {[
//             { icon: <Home />, label: 'Home', path: '/' },
//             { icon: <SearchIcon />, label: 'Search', path: '/search' },
//             { icon: <ShoppingCart />, label: 'Cart', path: '/cart' },
//             { icon: <Person />, label: 'Profile', path: '/profile' },
//           ].map((item) => (
//             <Button
//               key={item.label}
//               fullWidth
//               onClick={() => navigate(item.path)}
//               sx={{
//                 flexDirection: 'column',
//                 py: 1,
//                 minWidth: 0,
//                 color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
//               }}
//             >
//               {item.icon}
//               <Typography variant="caption">{item.label}</Typography>
//             </Button>
//           ))}
//         </Box>
//       </Box>
//     </Box>
//   );
// };

// export default MainLayout;

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
  CircularProgress,
  ListItemButton
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
import { APP_NAME } from '../../core/constants/food';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSelector, useAppDispatch } from '../../app/store';
import { DevVersionSwitcher } from '../../core/dev/renderer/DevVersionSwitcher';
import { NotificationBell } from '../../core/notifications/components/NotificationBell';

//cartSelector
import { selectCartItems } from '../../features/cart/cartSlice';

import { RoleSwitcher } from '../../shared/components/ui/RoleSwitcher';

const MainLayout: React.FC = () => {
  // console.log('%c<MainLayout/>','color:orange')
  const { user, isAuthenticated, isLoading, logout } = useAuth(); // Get auth state
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  // const [cartItemsCount] = useState(useAppSelector(selectCartItems).reduce((total, item) => total + item.quantity, 0));
  const cartItemsCount = useAppSelector(selectCartItems).length;

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
          
<DevVersionSwitcher />
<RoleSwitcher />

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

          <NotificationBell />

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
            <ListItemButton
              key={item.text}
              onClick={() => {
                navigate(item.path);
                handleDrawerToggle();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
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