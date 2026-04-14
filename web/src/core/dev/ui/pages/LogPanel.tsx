import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { timelineEvents } from '../mockData';

const LogPanel: React.FC = () => {

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user_action': return 'primary';
      case 'state_update': return 'info';
      case 'api_call': return 'success';
      case 'render': return 'secondary';
      case 'error': return 'error';
      case 'navigation': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Events & Logs Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unified timeline of user interactions, Redux traces, route changes, and raw logs.
          </Typography>
        </Box>
        <Box>
          <IconButton color="primary"><FilterListIcon /></IconButton>
          <IconButton color="error"><DeleteSweepIcon /></IconButton>
        </Box>
      </Box>

      <Paper sx={{ flexGrow: 1, overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Source</TableCell>
                <TableCell align="right">Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {timelineEvents.map((event) => (
                <TableRow
                  key={event.id}
                  hover
                  sx={{
                    bgcolor: event.type === 'error' ? 'error.50' : 'inherit',
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {event.timestamp}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.type.replace('_', ' ')}
                      size="small"
                      color={getTypeColor(event.type)}
                      sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{event.category}</TableCell>
                  <TableCell sx={{ fontWeight: event.type === 'error' ? 'bold' : 'normal', color: event.type === 'error' ? 'error.main' : 'inherit' }}>
                    {event.message}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{event.source || '-'}</TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                    {event.duration ? `${event.duration}ms` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default LogPanel;
