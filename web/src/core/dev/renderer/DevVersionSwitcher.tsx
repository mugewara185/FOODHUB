import React, { useState } from 'react';
import {
  IconButton, Menu, MenuItem, Tooltip, Typography,
  ListItemIcon, Divider, Badge, Switch, FormControlLabel
} from '@mui/material';
import { DeveloperMode, Check } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useDevContext } from '../contexts/DevContext';
import { APP_CONFIG } from '@/core/config/app.config';

export const DevVersionSwitcher: React.FC = () => {
  const { user } = useAuth();
  const { availableVersions, selectedVersions, setVersion } = useDevContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const SESSION_ISOLATION_KEY = "zom2_dev_session_isolation";
  const [isIsolated, setIsIsolated] = useState(localStorage.getItem(SESSION_ISOLATION_KEY) === "true");

  const handleToggleIsolation = () => {
    const newValue = !isIsolated;
    setIsIsolated(newValue);
    localStorage.setItem(SESSION_ISOLATION_KEY, String(newValue));
    // Must reload to apply new Redux Persist storage engine
    window.location.reload();
  };

  // Strictly only Dev God user
  // if (!user || user.email !== 'dev@' ) {
  if (!user || !user.role?.includes('dev')) {
    if (!APP_CONFIG.DEV_BYPASS_AUTH) return null;
  }

  const registeredKeys = Object.keys(availableVersions);
  const totalOverrides = Object.keys(selectedVersions).length;

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  }

  return (
    <>
      <Tooltip title="Dev Version Registry">
        <IconButton color="warning" onClick={handleOpen}>
          <Badge badgeContent={totalOverrides} color="secondary">
            <DeveloperMode />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 250, p: 1 } }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, pb: 1, color: 'text.secondary' }}>
          ACTIVE COMPONENTS
        </Typography>
        <Divider />
        {registeredKeys.length === 0 && (
          <MenuItem disabled>No swappable components rendered.</MenuItem>
        )}
        {registeredKeys.map(pageKey => {
          const versions = availableVersions[pageKey];
          // If selectedVersions[pageKey] is empty, it means they are using the default
          const currentSelection = selectedVersions[pageKey];

          return (
            <div key={pageKey}>
              <Typography variant="caption" sx={{ px: 2, mt: 1, display: 'block', fontWeight: 'bold' }}>
                {pageKey.toUpperCase()}
              </Typography>
              {versions.map(v => {
                // Heuristic: if no explicit override, check if it matches the typical static default name (_V.tsx)
                const isActive = currentSelection ? currentSelection === v : v.endsWith('_V');
                return (
                  <MenuItem key={v} onClick={() => { setVersion(pageKey, v); setAnchorEl(null); }}>
                    <ListItemIcon>
                      {isActive ? <Check color="success" fontSize="small" /> : null}
                    </ListItemIcon>
                    <Typography variant="body2" color={isActive ? "success.main" : "text.primary"}>
                      {v}
                    </Typography>
                  </MenuItem>
                );
              })}
            </div>
          );
        })}

        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" sx={{ px: 2, pb: 1, color: 'text.secondary' }}>
          ENVIRONMENT SETTINGS
        </Typography>
        <MenuItem sx={{ py: 0 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isIsolated}
                onChange={handleToggleIsolation}
                color="warning"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Session Isolation
              </Typography>
            }
            sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
            labelPlacement="start"
          />
        </MenuItem>
        <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontStyle: 'italic', display: 'block' }}>
          Enables separate logins per tab. (Reloads app)
        </Typography>
      </Menu>
    </>
  );
};
