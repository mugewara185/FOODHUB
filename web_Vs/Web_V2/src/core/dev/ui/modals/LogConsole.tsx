import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Close,
  Download,
  Delete,
  BugReport,
  Info,
} from '@mui/icons-material';
import { useLogger } from '../../contexts/LoggerContext';
import type { LogLevel, FilterOptions } from '../../logger/types';

interface LogConsoleProps {
  open: boolean;
  onClose: () => void;
}

const LogConsole: React.FC<LogConsoleProps> = ({ open, onClose }) => {
  const { logs, stats, debug, info, warn, error, critical, clearLogs, exportLogs, getLogs } = useLogger();
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilteredLogs = (): FilterOptions => ({
    search: searchQuery || undefined,
    level: selectedLevel ? selectedLevel : undefined,
    category: selectedCategory || undefined,
  });

  const filteredLogs = getLogs(getFilteredLogs());

  const getLevelColor = (level: LogLevel): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const colors: Record<LogLevel, any> = {
      DEBUG: 'default',
      INFO: 'info',
      WARN: 'warning',
      ERROR: 'error',
      CRITICAL: 'error',
    };
    return colors[level];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'success.main',
        }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'success.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <BugReport fontSize="small" />
          <span>LOG CONSOLE - Development Tracker</span>
        </Stack>
        <IconButton
          onClick={onClose}
          sx={{ color: 'white' }}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: '#f5f5f5' }}>
        {/* Search & Filters */}
        <Box sx={{ p: 2, bgcolor: 'white', borderBottom: 1, borderColor: 'divider' }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
            />

            <Stack direction="row" spacing={1} flexWrap="wrap">
              {(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'] as LogLevel[]).map((level) => (
                <Chip
                  key={level}
                  label={`${level} (${stats.byLevel[level]})`}
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                  color={selectedLevel === level ? 'primary' : 'default'}
                  variant={selectedLevel === level ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Download fontSize="small" />}
                  onClick={() => {
                    const json = exportLogs('json');
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `logs-${new Date().getTime()}.json`;
                    a.click();
                  }}
                >
                  Export JSON
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Delete fontSize="small" />}
                  onClick={clearLogs}
                  color="error"
                >
                  Clear All
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Total Logs: {logs.length} | Filtered: {filteredLogs.length}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable">
            <Tab label="📋 All Logs" />
            <Tab label="📊 Statistics" />
            <Tab label="⚙️ Categories" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell><strong>Time</strong></TableCell>
                    <TableCell><strong>Level</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Message</strong></TableCell>
                    <TableCell><strong>Data</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.slice().reverse().map((log) => (
                    <TableRow key={log.id} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                      <TableCell sx={{ fontSize: '0.75rem', width: '120px' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell sx={{ width: '80px' }}>
                        <Chip
                          label={log.level}
                          color={getLevelColor(log.level)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ width: '100px' }}>
                        <Chip label={log.category} size="small" variant="filled" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: '300px' }}>
                        <Typography variant="body2">{log.message}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: '200px', fontSize: '0.7rem' }}>
                        {log.data ? (
                          <Box component="pre" sx={{
                            m: 0,
                            p: 1,
                            bgcolor: '#f5f5f5',
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: '100px'
                          }}>
                            {JSON.stringify(log.data, null, 2)}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {filteredLogs.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No logs found</Typography>
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" variant="caption">Total Logs</Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </CardContent>
              </Card>
              {(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'] as LogLevel[]).map((level) => (
                <Card key={level}>
                  <CardContent>
                    <Typography color="text.secondary" variant="caption">{level}</Typography>
                    <Typography variant="h4">{stats.byLevel[level]}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <Card key={category} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Info fontSize="small" color="primary" />
                      <Typography variant="subtitle2">{category}</Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ mt: 1 }}>{count} logs</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LogConsole;
