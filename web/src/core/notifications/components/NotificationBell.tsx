import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Divider,
  IconButton as MuiIconButton,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
  Circle,
  DoneAll
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { selectNotifications, selectUnreadCount, markAsRead, markAllAsRead, clearAll } from '../notificationSlice';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    dispatch(markAsRead(id));
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'info':
      default:
        return <Info color="info" />;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick} aria-describedby={id}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 360, maxHeight: 500, display: 'flex', flexDirection: 'column' }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <MuiIconButton size="small" color="inherit" onClick={() => dispatch(markAllAsRead())}>
                  <DoneAll fontSize="small" />
                </MuiIconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        <Divider />
        <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No notifications yet</Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.selected' }
                  }}
                  onClick={() => {
                    if (!notification.isRead) dispatch(markAsRead(notification.id));
                  }}
                  secondaryAction={
                    !notification.isRead && (
                      <Tooltip title="Mark as read">
                        <MuiIconButton edge="end" size="small" onClick={(e) => handleMarkAsRead(notification.id, e)}>
                          <Circle sx={{ fontSize: 12, color: 'primary.main' }} />
                        </MuiIconButton>
                      </Tooltip>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={notification.isRead ? 500 : 700}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary" sx={{ display: 'block', mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))
          )}
        </List>
        {notifications.length > 0 && (
          <Box sx={{ p: 1, textAlign: 'center', bgcolor: 'background.default' }}>
            <Button size="small" color="error" onClick={() => dispatch(clearAll())}>
              Clear All
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};