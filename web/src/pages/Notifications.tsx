import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Button,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Badge,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Restaurant,
  LocalOffer,
  LocalShipping,
  Payment,
  MoreVert,
  Delete,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';

interface Notification {
  id: string;
  type: 'order' | 'offer' | 'delivery' | 'payment' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order',
    title: 'Order Confirmed',
    message: 'Your order #ORD-001 from Spice Garden has been confirmed',
    time: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'delivery',
    title: 'Out for Delivery',
    message: 'Your order is on the way! Delivery partner Rahul will arrive in 10 mins',
    time: '15 minutes ago',
    read: false,
  },
  {
    id: '3',
    type: 'offer',
    title: 'Special Offer',
    message: 'Get 50% off on your next order from Pizza Paradise',
    time: '1 hour ago',
    read: true,
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Payment of ₹890 for order #ORD-001 completed',
    time: '2 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'App Update',
    message: 'New features added! Check out our new wallet system',
    time: '1 day ago',
    read: true,
  },
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 0) return true;
    if (activeTab === 1) return !notification.read;
    if (activeTab === 2) return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setAnchorEl(null);
  };

  const handleDeleteAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Restaurant />;
      case 'offer':
        return <LocalOffer />;
      case 'delivery':
        return <LocalShipping />;
      case 'payment':
        return <Payment />;
      case 'system':
        return <Info />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'primary';
      case 'offer':
        return 'warning';
      case 'delivery':
        return 'success';
      case 'payment':
        return 'info';
      case 'system':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Left Column - Settings */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <NotificationsIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Notification Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your preferences
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={pushEnabled}
                    onChange={(e) => setPushEnabled(e.target.checked)}
                  />
                }
                label="Push Notifications"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={emailEnabled}
                    onChange={(e) => setEmailEnabled(e.target.checked)}
                  />
                }
                label="Email Notifications"
                labelPlacement="start"
                sx={{ justifyContent: 'space-between', mx: 0 }}
              />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Notification Types
            </Typography>
            
            <List dense>
              {[
                { label: 'Order Updates', checked: true },
                { label: 'Delivery Status', checked: true },
                { label: 'Offers & Promotions', checked: true },
                { label: 'Payment Confirmations', checked: true },
                { label: 'System Updates', checked: false },
              ].map((item) => (
                <ListItem key={item.label} sx={{ px: 0 }}>
                  <ListItemText primary={item.label} />
                  <Switch defaultChecked={item.checked} size="small" />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Last synced: 2 minutes ago
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column - Notifications List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 3 }}>
            {/* Header */}
            <Box sx={{ p: 3, pb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" fontWeight={700}>
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Chip
                      label={`${unreadCount} new`}
                      color="primary"
                      size="small"
                    />
                  )}
                </Box>
                <Box>
                  <Button
                    size="small"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all as read
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleDeleteAll}
                    disabled={notifications.length === 0}
                  >
                    Clear all
                  </Button>
                </Box>
              </Box>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="All" />
                <Tab label="Unread" />
                <Tab label="Read" />
              </Tabs>
            </Box>

            {/* Notifications List */}
            {filteredNotifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <NotificationsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 
                    ? "You're all caught up!" 
                    : activeTab === 1 
                    ? "No unread notifications" 
                    : "No read notifications"}
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        py: 2,
                        px: 3,
                        bgcolor: notification.read ? 'transparent' : 'action.hover',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      secondaryAction={
                        <Box>
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              setAnchorEl(e.currentTarget);
                              setSelectedNotification(notification.id);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Badge
                          color="primary"
                          variant="dot"
                          invisible={notification.read}
                        >
                          <Avatar
                            sx={{
                              bgcolor: `${getNotificationColor(notification.type)}.light`,
                              color: `${getNotificationColor(notification.type)}.main`,
                            }}
                          >
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Chip
                                label="New"
                                size="small"
                                color="primary"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {notification.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {notification.time}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < filteredNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Notification Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {selectedNotification && (
          <>
            <MenuItem
              onClick={() => {
                handleMarkAsRead(selectedNotification);
                setAnchorEl(null);
              }}
              disabled={notifications.find(n => n.id === selectedNotification)?.read}
            >
              <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
              Mark as read
            </MenuItem>
            <MenuItem
              onClick={() => handleDelete(selectedNotification)}
              sx={{ color: 'error.main' }}
            >
              <Delete sx={{ mr: 1, fontSize: 20 }} />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>
    </Container>
  );
};

export default Notifications;