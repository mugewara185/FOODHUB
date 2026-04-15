import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  type SxProps,
  type Theme,
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import DebugWrapper from '../DebugWrapper';

export interface InfoCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconColor?: string; // e.g. 'primary', 'success', 'warning'
  change?: string;
  trend?: 'up' | 'down';
  sx?: SxProps<Theme>;
}

const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  icon,
  iconColor = 'primary',
  change,
  trend,
  sx,
}) => {
  return (
    <DebugWrapper componentName="InfoCard">
      <Card sx={{ borderRadius: 3, ...sx }}>
        <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          {icon && (
            <Avatar
              sx={{
                bgcolor: `${iconColor}.light`,
                color: `${iconColor}.main`,
                width: 56,
                height: 56,
              }}
            >
              {icon}
            </Avatar>
          )}
          {change && trend && (
            <Chip
              icon={trend === 'up' ? <ArrowUpward /> : <ArrowDownward />}
              label={change}
              color={trend === 'up' ? 'success' : 'error'}
              size="small"
              sx={{ height: 24 }}
            />
          )}
        </Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        </CardContent>
      </Card>
    </DebugWrapper>
  );
};

export default InfoCard;
