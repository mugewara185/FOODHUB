import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Notifications,
  Search,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useThemeMode } from '../../hooks';

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'Dashboard', onMenuClick }) => {
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        backgroundColor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        {onMenuClick && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuClick}
            edge="start"
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
        )}
        
        <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Search">
            <IconButton color="inherit">
              <Search />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle theme">
            <IconButton color="inherit" onClick={toggleTheme}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Notifications">
            <IconButton color="inherit">
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          onClick={handleProfileMenuClose}
        >
          <MenuItem>Profile</MenuItem>
          <MenuItem>My account</MenuItem>
          <Divider />
          <MenuItem>Settings</MenuItem>
          <MenuItem>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;