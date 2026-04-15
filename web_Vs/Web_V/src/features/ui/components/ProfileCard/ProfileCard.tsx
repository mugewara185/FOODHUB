import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  type SxProps,
  type Theme,
} from '@mui/material';
import { CameraAlt } from '@mui/icons-material';

export interface ProfileStat {
  label: string;
  value: string | number;
}

export interface ProfileNavItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export interface ProfileCardProps {
  name?: string;
  email?: string;
  avatarSrc?: string;
  avatarFallback?: string;
  verified?: boolean;
  stats?: ProfileStat[];
  navItems?: ProfileNavItem[];
  onAvatarEdit?: () => void;
  /** Content rendered at the bottom of the card (e.g. logout/change password) */
  footer?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  email,
  avatarSrc,
  avatarFallback,
  verified,
  stats,
  navItems,
  onAvatarEdit,
  footer,
  sx,
}) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20, ...sx }}>
      {/* Avatar */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Avatar
            src={avatarSrc}
            sx={{
              width: 120,
              height: 120,
              mb: 2,
              border: '4px solid',
              borderColor: 'primary.main',
            }}
          >
            {avatarFallback}
          </Avatar>
          {onAvatarEdit && (
            <IconButton
              onClick={onAvatarEdit}
              sx={{
                position: 'absolute',
                bottom: 10,
                right: 0,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <CameraAlt />
            </IconButton>
          )}
        </Box>

        {name && (
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {name}
          </Typography>
        )}
        {email && (
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
        )}
        {verified && (
          <Chip
            label="Verified Account"
            color="success"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {stats.map((stat) => (
              <Grid item xs={12 / stats.length} key={stat.label}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Nav Items */}
      {navItems && navItems.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <List>
            {navItems.map((item) => (
              <ListItem
                key={item.label}
                button
                onClick={item.onClick}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {/* Footer */}
      {footer && (
        <>
          <Divider sx={{ my: 3 }} />
          {footer}
        </>
      )}
    </Paper>
  );
};

export default ProfileCard;
