import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';

export interface FilterGroupProps {
  label: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

const FilterGroup: React.FC<FilterGroupProps> = ({
  label,
  defaultExpanded = true,
  children,
  sx,
}) => {
  return (
    <Accordion defaultExpanded={defaultExpanded} sx={sx}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography fontWeight={600}>{label}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );
};

export default FilterGroup;
