import React, { useState, useMemo } from 'react';
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
  Collapse,
  Button,
  TextField,
  MenuItem,
  Stack,
  FormControlLabel,
  Switch,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useLogger } from '../../contexts/LoggerContext';
import type { LogEntry } from '../../logger/types';

const LogRow: React.FC<{ event: LogEntry }> = ({ event }) => {
  const [open, setOpen] = useState(false);

  const getTypeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'error';
      case 'ERROR': return 'error';
      case 'WARN': return 'warning';
      case 'INFO': return 'info';
      case 'DEBUG': return 'default';
      default: return 'default';
    }
  };

  const timeString = new Date(event.timestamp).toISOString().split('T')[1].slice(0, -1);

  return (
    <React.Fragment>
      <TableRow
        hover
        onClick={() => setOpen(!open)}
        sx={{
          cursor: 'pointer',
          bgcolor: event.level === 'ERROR' || event.level === 'CRITICAL' ? 'error.50' : (event.level === 'WARN' ? 'warning.50' : 'inherit'),
          '& > *': { borderBottom: 'unset' }
        }}
      >
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {timeString}
        </TableCell>
        <TableCell>
          <Chip
            label={event.level}
            size="small"
            color={getTypeColor(event.level) as any}
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {event.category} {event.event ? `· ${event.event}` : ''}
          </Typography>
        </TableCell>
        <TableCell sx={{ fontWeight: event.level === 'ERROR' ? 'bold' : 'normal', color: event.level === 'ERROR' ? 'error.main' : 'inherit' }}>
          {event.message}
        </TableCell>
        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{event.traceId || '-'}</TableCell>
        <TableCell align="right" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
          {event.duration ? `${event.duration.toFixed(1)}ms` : '-'}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom component="div">
                  Log Details
                </Typography>
                <IconButton size="small" onClick={() => navigator.clipboard.writeText(JSON.stringify(event, null, 2))}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>
              <Table size="small" aria-label="details">
                <TableBody>
                  {event.source && <TableRow><TableCell variant="head">Source</TableCell><TableCell>{event.source}</TableCell></TableRow>}
                  {event.route && <TableRow><TableCell variant="head">Route</TableCell><TableCell>{event.route}</TableCell></TableRow>}
                  {event.data && (
                    <TableRow>
                      <TableCell variant="head">Data</TableCell>
                      <TableCell><pre style={{ margin: 0, fontSize: '0.8rem', overflowX: 'auto' }}>{JSON.stringify(event.data, null, 2)}</pre></TableCell>
                    </TableRow>
                  )}
                  {event.error && (
                    <TableRow>
                      <TableCell variant="head">Error</TableCell>
                      <TableCell><pre style={{ margin: 0, fontSize: '0.8rem', color: 'red', overflowX: 'auto' }}>{JSON.stringify(event.error, null, 2)}</pre></TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const LogPanel: React.FC = () => {
  const logger = useLogger();
  const [isLive, setIsLive] = useState(true);
  const [frozenLogs, setFrozenLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');

  const handleToggleLive = () => {
    if (isLive) {
      setFrozenLogs(logger.logs);
    }
    setIsLive(!isLive);
  };

  const activeLogs = isLive ? logger.logs : frozenLogs;

  const filteredLogs = useMemo(() => {
    let result = activeLogs;
    if (levelFilter !== 'ALL') {
      result = result.filter(l => l.level === levelFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => 
        l.message.toLowerCase().includes(s) || 
        l.category.toLowerCase().includes(s) || 
        (l.traceId && l.traceId.toLowerCase().includes(s))
      );
    }
    // Reverse to show newest on top
    return [...result].reverse();
  }, [activeLogs, levelFilter, search]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Application Execution Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Structured logs, traces, and application events.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={logger.config.consoleLoggingEnabled}
                onChange={(e) => logger.setConfig({ consoleLoggingEnabled: e.target.checked })}
              />
            }
            label="Browser Console"
            labelPlacement="start"
          />
          <FormControlLabel
            control={
              <Switch
                checked={logger.config.persistLogs}
                onChange={(e) => logger.setConfig({ persistLogs: e.target.checked })}
              />
            }
            label="Persist"
            labelPlacement="start"
          />
          <Button
            variant="outlined"
            size="small"
            color={isLive ? "primary" : "warning"}
            startIcon={isLive ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={handleToggleLive}
          >
            {isLive ? "Pause" : "Resume"}
          </Button>
          <IconButton color="error" onClick={() => logger.clearLogs()} title="Clear Logs">
            <DeleteSweepIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search message, category, trace..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
        />
        <TextField
          select
          size="small"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          sx={{ width: 150 }}
        >
          <MenuItem value="ALL">All Levels</MenuItem>
          <MenuItem value="DEBUG">Debug</MenuItem>
          <MenuItem value="INFO">Info</MenuItem>
          <MenuItem value="WARN">Warn</MenuItem>
          <MenuItem value="ERROR">Error</MenuItem>
        </TextField>
      </Box>

      <Paper sx={{ flexGrow: 1, overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer sx={{ height: 'calc(100vh - 250px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell>Time</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Trace ID</TableCell>
                <TableCell align="right">Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((event) => (
                <LogRow key={event.id} event={event} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default LogPanel;

