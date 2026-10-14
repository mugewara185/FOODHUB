import React from 'react';
import { Box, Container, type ContainerProps } from '@mui/material';

export interface SectionContainerProps {
  children: React.ReactNode;
  id?: string;
  maxWidth?: ContainerProps['maxWidth'];
  alternateBg?: boolean;
  sx?: object;
}

/**
 * SectionContainer
 * Provides standardized vertical cadence and responsive horizontal padding
 * across all Home page content sections (S07 Layout Foundation).
 */
export const SectionContainer: React.FC<SectionContainerProps> = ({
  children,
  id,
  maxWidth = 'lg',
  alternateBg = false,
  sx = {},
}) => {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        py: { xs: 4, sm: 5, md: 6 },
        bgcolor: alternateBg ? 'action.hover' : 'transparent',
        transition: 'background-color 0.2s ease',
        ...sx,
      }}
    >
      <Container maxWidth={maxWidth} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {children}
      </Container>
    </Box>
  );
};

export default SectionContainer;
