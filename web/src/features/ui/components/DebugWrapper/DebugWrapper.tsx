import React from 'react';
import { Box, type BoxProps } from '@mui/material';
import { uiConfig } from '../../../../core/config/uiConfig';

export interface DebugWrapperProps extends BoxProps {
  componentName?: string;
}

const DebugWrapper: React.FC<DebugWrapperProps> = ({ children, sx, componentName, ...props }) => {
  if (!uiConfig.debug.showBorders) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        border: '1px dashed red',
        position: 'relative',
        '&:hover::after': componentName ? {
          content: `"${componentName}"`,
          position: 'absolute',
          top: 0,
          left: 0,
          bgcolor: 'error.main',
          color: 'white',
          fontSize: '10px',
          px: 0.5,
          zIndex: 9999,
        } : undefined,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default DebugWrapper;
