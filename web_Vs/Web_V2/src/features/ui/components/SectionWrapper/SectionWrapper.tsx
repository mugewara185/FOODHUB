import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';
import DebugWrapper from '../DebugWrapper';

export interface SectionWrapperProps {
  children: React.ReactNode;
  /** vertical spacing using MUI spacing scale */
  spacing?: number;
  sx?: SxProps<Theme>;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  children,
  spacing = 8,
  sx,
}) => {
  return (
    <DebugWrapper componentName="SectionWrapper">
      <Box sx={{ my: spacing, ...sx }}>
        {children}
      </Box>
    </DebugWrapper>
  );
};

export default SectionWrapper;
