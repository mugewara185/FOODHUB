import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableRow,
  Chip,
  Grid
} from '@mui/material';
import { getSanitizedConfigSnapshot, type DevConfigSnapshot } from '../../../config/configSnapshot';

const ConfigRow: React.FC<{ label: string; value: any; highlightOrigin?: boolean }> = ({ label, value, highlightOrigin }) => {
  let displayValue: React.ReactNode = String(value);

  if (typeof value === 'boolean') {
    displayValue = (
      <Chip 
        label={value ? "Enabled" : "Disabled"} 
        size="small" 
        color={value ? "success" : "default"} 
        variant={value ? "filled" : "outlined"}
      />
    );
  } else if (typeof value === 'string' && (value === 'mock' || value === 'api')) {
    displayValue = (
      <Chip 
        label={value.toUpperCase()} 
        size="small" 
        color={value === 'api' ? "primary" : "secondary"} 
      />
    );
  } else if (label.toLowerCase().includes('origin')) {
    displayValue = (
      <Typography variant="body2" color={value === 'development override' ? 'warning.main' : 'text.secondary'} sx={{ fontStyle: 'italic' }}>
        Source: {value}
      </Typography>
    );
  } else {
    displayValue = <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{displayValue}</Typography>;
  }

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
      <TableCell component="th" scope="row" sx={{ width: '40%', fontWeight: 500, color: 'text.secondary' }}>
        {label}
      </TableCell>
      <TableCell align="left">
        {displayValue}
      </TableCell>
    </TableRow>
  );
};

const ConfigSection: React.FC<{ title: string; data: Record<string, any> }> = ({ title, data }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ color: 'primary.main', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
        {title}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ boxShadow: 'none' }}>
        <Table size="small">
          <TableBody>
            {Object.entries(data).map(([key, value]) => (
              <ConfigRow key={key} label={key} value={value} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export const ConfigurationInspector: React.FC = () => {
  // We explicitly fetch the snapshot on mount.
  // We do not poll because appConfig is intentionally immutable during the session,
  // except for localStorage overrides which require a reload anyway.
  const snapshot: DevConfigSnapshot = React.useMemo(() => getSanitizedConfigSnapshot(), []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Configuration Inspector
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Read-only view of the normalized application configuration. 
        Raw environment variables are sanitized and excluded from this snapshot.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <ConfigSection 
            title="Environment" 
            data={{
              "Mode": snapshot.environment.mode,
              "Is Dev": snapshot.environment.isDev,
              "Is Prod": snapshot.environment.isProd,
              "Is Test": snapshot.environment.isTest,
            }} 
          />
          
          <ConfigSection 
            title="API & Data Source" 
            data={{
              "Active Data Source": snapshot.api.dataSource,
              "Source Origin": snapshot.api.dataSourceOrigin,
              "Base URL": snapshot.api.baseUrl,
              "Socket URL": snapshot.api.socketUrl || 'Not configured',
            }} 
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ConfigSection 
            title="Dev & Security" 
            data={{
              "Bypass Auth": snapshot.dev.bypassAuth,
            }} 
          />
          
          <ConfigSection 
            title="Logger Configuration" 
            data={{
              "Log Level": snapshot.dev.logger.logLevel,
              "Max Logs": snapshot.dev.logger.maxLogs,
              "Persist Logs": snapshot.dev.logger.persistLogs,
              "Stack Trace": snapshot.dev.logger.enableStackTrace,
              "Timestamps": snapshot.dev.logger.enableTimestamps,
              "Console UI": snapshot.dev.logger.consoleLoggingEnabled,
              "Render Logs": snapshot.dev.logger.renderLoggingEnabled,
              "Route Logs": snapshot.dev.logger.routeTrackingEnabled,
              "Redux Logs": snapshot.dev.logger.reduxLoggingEnabled,
              "API Logs": snapshot.dev.logger.apiLoggingEnabled,
            }} 
          />
        </Grid>
      </Grid>
    </Box>
  );
};
