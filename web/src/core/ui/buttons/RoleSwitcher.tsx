import React, { useState } from 'react';
import { Box, Tooltip, Popover, Typography, Chip, Badge } from '@mui/material';
import {
  AdminPanelSettings,
  Person,
  Storefront,
  DeliveryDining,
  SwitchAccessShortcut,
  Shield,
  CheckCircle,
  Tune,
  Key
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface RoleOption {
  id: string;
  label: string;
  subtitle: string;
  badgeText: string;
  path: string;
  icon: React.ReactNode;
  activeColor: string;
  glowColor: string;
  gradient: string;
  isSelected: (pathname: string) => boolean;
}

import { DraggableContainer } from '../draggable/DraggableContainer';

export const RoleSwitcher: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLeverFlipped, setIsLeverFlipped] = useState(false);
  const [switchingRoleId, setSwitchingRoleId] = useState<string | null>(null);

  // Extract roles safely whether user.role is array or string
  const userRoles: string[] = React.useMemo(() => {
    if (!user) return [];
    if (Array.isArray(user.role)) return user.role;
    if (Array.isArray((user as any).roles)) return (user as any).roles;
    if (typeof user.role === 'string') return [user.role];
    return [];
  }, [user]);

  if (!user || userRoles.length <= 1) {
    return null; // No need to switch if the user has 1 or fewer roles
  }

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setIsLeverFlipped(true);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setIsLeverFlipped(false);
    setAnchorEl(null);
  };

  const handleSwitch = (roleId: string, path: string) => {
    setSwitchingRoleId(roleId);
    setTimeout(() => {
      navigate(path);
      setSwitchingRoleId(null);
      handleClose();
    }, 280);
  };

  const roleDefinitions: RoleOption[] = [
    {
      id: 'user',
      label: 'Customer App',
      subtitle: 'Standard User Interface & Food Catalog',
      badgeText: 'PUBLIC VIEW',
      path: '/',
      icon: <Person sx={{ fontSize: 22 }} />,
      activeColor: '#3b82f6',
      glowColor: 'rgba(59, 130, 246, 0.4)',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
      isSelected: (pathname) =>
        !pathname.startsWith('/admin') &&
        !pathname.startsWith('/owner') &&
        !pathname.startsWith('/partner'),
    },
    {
      id: 'admin',
      label: 'Admin Command Panel',
      subtitle: 'Root Governance, Analytics & System Config',
      badgeText: 'LEVEL 4 ACCESS',
      path: '/admin',
      icon: <AdminPanelSettings sx={{ fontSize: 22 }} />,
      activeColor: '#ef4444',
      glowColor: 'rgba(239, 68, 68, 0.5)',
      gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
      isSelected: (pathname) => pathname.startsWith('/admin'),
    },
    {
      id: 'restaurant_owner',
      label: 'Merchant Owner Hub',
      subtitle: 'Restaurant Operations, Menu & Orders',
      badgeText: 'OWNER CONTROL',
      path: '/owner',
      icon: <Storefront sx={{ fontSize: 22 }} />,
      activeColor: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)',
      isSelected: (pathname) => pathname.startsWith('/owner'),
    },
    {
      id: 'delivery_partner',
      label: 'Logistics Fleet',
      subtitle: 'Delivery Operations, Live Dispatch & Routes',
      badgeText: 'FLEET MODE',
      path: '/partner',
      icon: <DeliveryDining sx={{ fontSize: 22 }} />,
      activeColor: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.5)',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
      isSelected: (pathname) => pathname.startsWith('/partner'),
    },
  ];

  const availableRoles = roleDefinitions.filter((role) => userRoles.includes(role.id));

  // Determine current active role config
  const currentActiveRole =
    availableRoles.find((role) => role.isSelected(location.pathname)) || availableRoles[0];

  return (
    <>
      <DraggableContainer
        storageKey="zom2.roleswitcher.pos.v3"
        width={76}
        height={40}
        defaultPosition={{
          x: 30, // Top left, clears sidebars in Admin/Dev layouts
          y: 820
        }}
        onClick={() => {
          // Trigger the popover on click instead of relying on the Box onClick
          if (!anchorEl) {
            const customEvent = { currentTarget: document.getElementById('role-switcher-anchor') } as unknown as React.MouseEvent<HTMLElement>;
            handleOpen(customEvent);
          }
        }}
      >
        <Tooltip title="Tactile Master Access Switch Lever" arrow placement="bottom">
          <Box
            id="role-switcher-anchor"
            component={motion.div}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.2,
              px: 1.8,
              py: 0.75,
              ml: 1.5,
              cursor: 'pointer',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid',
              borderColor: Boolean(anchorEl) ? currentActiveRole.activeColor : 'rgba(255, 255, 255, 0.15)',
              boxShadow: Boolean(anchorEl)
                ? `0 0 20px ${currentActiveRole.glowColor}`
                : '0 4px 14px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
              position: 'relative',
              userSelect: 'none',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {/* LED Signal Indicator Light */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Box
                component={motion.div}
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: currentActiveRole.activeColor,
                  boxShadow: `0 0 10px ${currentActiveRole.activeColor}`,
                }}
              />
            </Box>

            {/* Icon Badge */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentActiveRole.activeColor,
              }}
            >
              {currentActiveRole.icon}
            </Box>

            {/* Text Info */}
            {/* <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', textAlign: 'left' }}> */}
            {/* <Typography
              variant="caption"
              sx={{
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              Access Lever
            </Typography> */}
            {/* <Typography
              variant="body2"
              sx={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#f8fafc',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {currentActiveRole.label.split(' ')[0]}
            </Typography>
          </Box> */}

            {/* 3D Physical Switch Lever Trigger representation */}
            <Box
              sx={{
                width: 38,
                height: 22,
                borderRadius: '12px',
                bgcolor: '#090d16',
                border: '1px solid rgba(255,255,255,0.12)',
                position: 'relative',
                p: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component={motion.div}
                animate={{
                  x: isLeverFlipped ? 16 : 0,
                  rotate: isLeverFlipped ? 15 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '8px',
                  background: isLeverFlipped
                    ? currentActiveRole.gradient
                    : 'linear-gradient(180deg, #94a3b8 0%, #475569 100%)',
                  boxShadow: isLeverFlipped
                    ? `0 0 10px ${currentActiveRole.activeColor}`
                    : '0 2px 4px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SwitchAccessShortcut sx={{ fontSize: 11, color: '#fff' }} />
              </Box>
            </Box>
          </Box>
        </Tooltip>
      </DraggableContainer>

      {/* Futuristic Glassmorphic Lever Switch Control Console Popover */}
      <Popover
        open={Boolean(anchorEl)}
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
        SlotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: { xs: 320, sm: 380 },
              borderRadius: '24px',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.15)',
              overflow: 'hidden',
              p: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2.5, position: 'relative' }}>
          {/* Console Glow Backdrop */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: currentActiveRole.glowColor,
              filter: 'blur(45px)',
              pointerEvents: 'none',
            }}
          />

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield sx={{ color: currentActiveRole.activeColor, fontSize: 22 }} />
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    letterSpacing: '0.02em',
                  }}
                >
                  Clearance Switch Console
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                  Select active environment view
                </Typography>
              </Box>
            </Box>

            <Chip
              icon={<Tune sx={{ fontSize: '12px !important', color: '#38bdf8 !important' }} />}
              label="EXECUTIVE"
              size="small"
              sx={{
                bgcolor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '0.05em',
                height: 22,
              }}
            />
          </Box>

          {/* Role Cards with Interactive Lever Toggles */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
            {availableRoles.map((roleOption) => {
              const isSelected = roleOption.isSelected(location.pathname);
              const isSwitching = switchingRoleId === roleOption.id;

              return (
                <Box
                  key={roleOption.id}
                  onClick={() => !isSelected && handleSwitch(roleOption.id, roleOption.path)}
                  component={motion.div}
                  whileHover={{ scale: isSelected ? 1 : 1.02 }}
                  whileTap={{ scale: isSelected ? 1 : 0.98 }}
                  sx={{
                    p: 1.8,
                    borderRadius: '16px',
                    background: isSelected
                      ? 'rgba(30, 41, 59, 0.85)'
                      : 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid',
                    borderColor: isSelected
                      ? roleOption.activeColor
                      : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isSelected
                      ? `0 0 18px ${roleOption.glowColor}`
                      : 'none',
                    cursor: isSelected ? 'default' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: isSelected ? roleOption.activeColor : 'rgba(255, 255, 255, 0.25)',
                      bgcolor: isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.4)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Role Details */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '12px',
                          background: isSelected
                            ? roleOption.gradient
                            : 'rgba(255, 255, 255, 0.05)',
                          color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: isSelected ? `0 0 12px ${roleOption.glowColor}` : 'none',
                        }}
                      >
                        {roleOption.icon}
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                              fontSize: '0.88rem',
                            }}
                          >
                            {roleOption.label}
                          </Typography>
                          {isSelected && (
                            <CheckCircle sx={{ color: roleOption.activeColor, fontSize: 16 }} />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.45)',
                            fontSize: '0.72rem',
                            display: 'block',
                            lineHeight: 1.2,
                          }}
                        >
                          {roleOption.subtitle}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Interactive Lever Switch Widget */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      {/* Lever Chassis */}
                      <Box
                        sx={{
                          width: 48,
                          height: 26,
                          borderRadius: '14px',
                          bgcolor: isSelected ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid',
                          borderColor: isSelected ? roleOption.activeColor : 'rgba(255, 255, 255, 0.15)',
                          p: '3px',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Box
                          component={motion.div}
                          animate={{
                            x: isSelected || isSwitching ? 22 : 0,
                            scale: isSwitching ? [1, 1.2, 1] : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '10px',
                            background: isSelected || isSwitching
                              ? roleOption.gradient
                              : 'linear-gradient(180deg, #64748b 0%, #334155 100%)',
                            boxShadow: isSelected || isSwitching
                              ? `0 0 12px ${roleOption.glowColor}`
                              : '0 2px 4px rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Key sx={{ fontSize: 11, color: '#ffffff' }} />
                        </Box>
                      </Box>

                      {/* Status Label */}
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                          color: isSelected ? roleOption.activeColor : 'rgba(255, 255, 255, 0.35)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isSelected ? 'ENGAGED' : 'STANDBY'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

