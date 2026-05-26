// import React, { useState } from 'react';
// import {
//   Box,
//   Paper,
//   IconButton,
//   Tooltip,
//   Badge,
//   Menu,
//   MenuItem,
//   ListItemIcon,
//   ListItemText,
//   Divider,
//   Typography,
//   Chip,
//   Drawer,
//   Tabs,
//   Tab,
//   Stack,
//   Button,
//   Switch,
//   FormControlLabel,
// } from '@mui/material';
// import {
//   Code,
//   DeveloperMode,
//   Speed,
//   BugReport,
//   Visibility,
//   Storage,
//   Palette,
//   Description,
//   Close,
//   CheckCircle,
//   Warning,
//   Error as ErrorIcon,
//   Info,
//   Timeline,
//   Memory,
//   NetworkCheck,
//   Refresh,
// } from '@mui/icons-material';
// import { useDev } from '../context/DevContext';
// import DevDashboard from '../pages/DevDashboard';
// import ComponentPlayground from '../pages/ComponentPlayground';
// import APITester from '../pages/APITester';
// import PerformanceDashboard from '../pages/PerformanceDashboard';
// import StateVisualizer from '../pages/StateVisualizer';
// import LogViewer from '../pages/LogViewer';
// import ThemeCustomizer from '../pages/ThemeCustomizer';
// import Documentation from '../pages/Documentation';

// const DevToolbar: React.FC = () => {
//   const { isDevMode, toggleDevMode, devTools, toggleDevTool, performance, logs } = useDev();
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState(0);

//   const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleOpenTool = (toolId: keyof typeof devTools) => {
//     toggleDevTool(toolId);
//     handleMenuClose();
//   };

//   const getLogCount = (type: DevLog['type']) => {
//     return logs.filter(log => log.type === type).length;
//   };

//   const menuItems = [
//     { 
//       id: 'dashboard', 
//       label: 'Developer Dashboard', 
//       icon: <DeveloperMode />, 
//       action: () => { setDrawerOpen(true); setActiveTab(0); }
//     },
//     { 
//       id: 'componentPlayground', 
//       label: 'Component Playground', 
//       icon: <Code />, 
//       action: () => handleOpenTool('componentPlayground'),
//       badge: devTools.componentPlayground,
//     },
//     { 
//       id: 'performanceMonitor', 
//       label: 'Performance Monitor', 
//       icon: <Speed />, 
//       action: () => handleOpenTool('performanceMonitor'),
//       badge: devTools.performanceMonitor,
//     },
//     { 
//       id: 'stateInspector', 
//       label: 'State Inspector', 
//       icon: <Storage />, 
//       action: () => handleOpenTool('stateInspector'),
//       badge: devTools.stateInspector,
//     },
//     { 
//       id: 'apiTester', 
//       label: 'API Tester', 
//       icon: <NetworkCheck />, 
//       action: () => handleOpenTool('apiTester'),
//       badge: devTools.apiTester,
//     },
//     { 
//       id: 'logViewer', 
//       label: 'Log Viewer', 
//       icon: <BugReport />, 
//       action: () => handleOpenTool('logViewer'),
//       badge: devTools.logViewer,
//     },
//     { 
//       id: 'themeCustomizer', 
//       label: 'Theme Customizer', 
//       icon: <Palette />, 
//       action: () => handleOpenTool('themeCustomizer'),
//       badge: devTools.themeCustomizer,
//     },
//     { 
//       id: 'documentation', 
//       label: 'Documentation', 
//       icon: <Description />, 
//       action: () => handleOpenTool('documentation'),
//       badge: devTools.documentation,
//     },
//   ];

//   if (!isDevMode) return null;

//   return (
//     <>
//       {/* Dev Mode Button */}
//       <Box
//         sx={{
//           position: 'fixed',
//           bottom: 20,
//           right: 20,
//           zIndex: 9999,
//         }}
//       >
//         <Paper
//           elevation={6}
//           sx={{
//             borderRadius: 4,
//             overflow: 'hidden',
//             background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//           }}
//         >
//           <Tooltip title="Developer Tools">
//             <IconButton
//               onClick={handleMenuOpen}
//               sx={{
//                 color: 'white',
//                 p: 1.5,
//                 '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
//               }}
//             >
//               <Badge
//                 badgeContent={logs.filter(l => l.type === 'error').length}
//                 color="error"
//                 variant="dot"
//               >
//                 <DeveloperMode />
//               </Badge>
//             </IconButton>
//           </Tooltip>
//         </Paper>
//       </Box>

//       {/* Dev Menu */}
//       <Menu
//         anchorEl={anchorEl}
//         open={Boolean(anchorEl)}
//         onClose={handleMenuClose}
//         PaperProps={{
//           sx: {
//             width: 320,
//             maxHeight: 500,
//             borderRadius: 2,
//             mt: 1,
//           },
//         }}
//       >
//         {/* Header */}
//         <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
//           <Typography variant="subtitle1" fontWeight={700}>
//             Developer Tools
//           </Typography>
//           <Typography variant="caption" sx={{ opacity: 0.8 }}>
//             Version {process.env.REACT_APP_VERSION || '2.0.0'}
//           </Typography>
//         </Box>

//         <Divider />

//         {/* Performance Metrics */}
//         <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
//           <Typography variant="caption" fontWeight={600} gutterBottom>
//             Quick Stats
//           </Typography>
//           <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
//             <Chip
//               size="small"
//               icon={<Speed />}
//               label={`${performance.fps} FPS`}
//               color={performance.fps > 50 ? 'success' : performance.fps > 30 ? 'warning' : 'error'}
//             />
//             <Chip
//               size="small"
//               icon={<Memory />}
//               label={`${performance.memory || 0} MB`}
//             />
//             <Chip
//               size="small"
//               icon={<BugReport />}
//               label={`${logs.length} logs`}
//             />
//           </Stack>
//         </Box>

//         <Divider />

//         {/* Menu Items */}
//         {menuItems.map((item) => (
//           <MenuItem key={item.id} onClick={item.action}>
//             <ListItemIcon>{item.icon}</ListItemIcon>
//             <ListItemText>{item.label}</ListItemText>
//             {item.badge && <CheckCircle fontSize="small" color="success" />}
//           </MenuItem>
//         ))}

//         <Divider />

//         {/* Dev Mode Toggle */}
//         <Box sx={{ p: 2 }}>
//           <FormControlLabel
//             control={<Switch checked={isDevMode} onChange={toggleDevMode} />}
//             label="Developer Mode"
//             labelPlacement="start"
//             sx={{ width: '100%', justifyContent: 'space-between', mx: 0 }}
//           />
//         </Box>
//       </Menu>

//       {/* Developer Dashboard Drawer */}
//       <Drawer
//         anchor="right"
//         open={drawerOpen}
//         onClose={() => setDrawerOpen(false)}
//         PaperProps={{
//           sx: {
//             width: { xs: '100%', sm: 800 },
//             maxWidth: '100%',
//           },
//         }}
//       >
//         <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
//           {/* Header */}
//           <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <Typography variant="h6" fontWeight={700}>
//               Developer Dashboard
//             </Typography>
//             <IconButton onClick={() => setDrawerOpen(false)}>
//               <Close />
//             </IconButton>
//           </Box>

//           {/* Tabs */}
//           <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2, pt: 1 }}>
//             <Tab label="Dashboard" />
//             <Tab label="Playground" />
//             <Tab label="Performance" />
//             <Tab label="State" />
//             <Tab label="API" />
//             <Tab label="Logs" />
//             <Tab label="Theme" />
//             <Tab label="Docs" />
//           </Tabs>

//           {/* Content */}
//           <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
//             {activeTab === 0 && <DevDashboard />}
//             {activeTab === 1 && <ComponentPlayground />}
//             {activeTab === 2 && <PerformanceDashboard />}
//             {activeTab === 3 && <StateVisualizer />}
//             {activeTab === 4 && <APITester />}
//             {activeTab === 5 && <LogViewer />}
//             {activeTab === 6 && <ThemeCustomizer />}
//             {activeTab === 7 && <Documentation />}
//           </Box>
//         </Box>
//       </Drawer>

//       {/* Floating Tool Windows */}
//       {devTools.componentPlayground && <ComponentPlayground />}
//       {devTools.apiTester && <APITester />}
//       {devTools.performanceMonitor && <PerformanceDashboard />}
//       {devTools.stateInspector && <StateVisualizer />}
//       {devTools.logViewer && <LogViewer />}
//       {devTools.themeCustomizer && <ThemeCustomizer />}
//       {devTools.documentation && <Documentation />}
//     </>
//   );
// };

// export default DevToolbar;