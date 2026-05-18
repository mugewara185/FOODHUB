import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

export interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
  sx?: SxProps<Theme>;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, sx }) => {
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`}>
      {value === index && (
        <Box sx={{ p: 3, ...sx }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default TabPanel;
