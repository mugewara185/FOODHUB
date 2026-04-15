import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Switch,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  AccessTime,
  Save,
  Restore,
  CheckCircle,
  Warning,
  Close,
} from '@mui/icons-material';

interface DaySchedule {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

const BusinessHours: React.FC = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'Monday', isOpen: true, openTime: '10:00', closeTime: '23:00' },
    { day: 'Tuesday', isOpen: true, openTime: '10:00', closeTime: '23:00' },
    { day: 'Wednesday', isOpen: true, openTime: '10:00', closeTime: '23:00' },
    { day: 'Thursday', isOpen: true, openTime: '10:00', closeTime: '23:00' },
    { day: 'Friday', isOpen: true, openTime: '10:00', closeTime: '23:00' },
    { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '00:00' },
    { day: 'Sunday', isOpen: true, openTime: '09:00', closeTime: '00:00' },
  ]);

  const [holidays, setHolidays] = useState<string[]>([
    '2024-01-26 (Republic Day)',
    '2024-08-15 (Independence Day)',
  ]);

  const handleToggleDay = (index: number) => {
    setSchedule(schedule.map((day, i) =>
      i === index ? { ...day, isOpen: !day.isOpen } : day
    ));
  };

  const handleTimeChange = (index: number, field: 'openTime' | 'closeTime', value: string) => {
    setSchedule(schedule.map((day, i) =>
      i === index ? { ...day, [field]: value } : day
    ));
  };

  const handleApplyToAll = (index: number) => {
    const template = schedule[index];
    setSchedule(schedule.map(day => ({
      ...day,
      openTime: template.openTime,
      closeTime: template.closeTime,
    })));
  };

  const isOpenNow = () => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const todaySchedule = schedule.find(d => d.day === day);
    if (!todaySchedule?.isOpen) return false;
    
    return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Business Hours
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Set your restaurant's operating hours
        </Typography>
      </Box>

      {/* Status Alert */}
      <Alert
        severity={isOpenNow() ? 'success' : 'info'}
        icon={isOpenNow() ? <CheckCircle /> : <AccessTime />}
        sx={{ mb: 4, borderRadius: 2 }}
      >
        {isOpenNow() 
          ? 'Your restaurant is currently open' 
          : 'Your restaurant is currently closed'}
      </Alert>

      <Grid container spacing={3}>
        {/* Hours Table */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Weekly Schedule
              </Typography>
              <Button startIcon={<Restore />} size="small">
                Reset to Default
              </Button>
            </Box>

            <Stack spacing={2}>
              {schedule.map((day, index) => (
                <Paper key={day.day} variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                          checked={day.isOpen}
                          onChange={() => handleToggleDay(index)}
                          size="small"
                        />
                        <Typography variant="subtitle1" fontWeight={600}>
                          {day.day}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {day.isOpen ? (
                      <>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Open"
                            type="time"
                            value={day.openTime}
                            onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <TextField
                            label="Close"
                            type="time"
                            value={day.closeTime}
                            onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Button
                            size="small"
                            onClick={() => handleApplyToAll(index)}
                            disabled={index === 0}
                          >
                            Apply to all days
                          </Button>
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={12} md={10}>
                        <Typography variant="body2" color="text.secondary">
                          Closed
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              ))}
            </Stack>

            <Divider sx={{ my: 3 }} />

            {/* Special Hours */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Special Hours
            </Typography>
            <Button variant="outlined" startIcon={<AccessTime />}>
              Add Special Hours
            </Button>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Holidays */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Holidays & Closures
              </Typography>
              
              <Stack spacing={2} sx={{ mt: 2 }}>
                {holidays.map((holiday, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{holiday}</Typography>
                    <IconButton size="small" color="error">
                      <Close />
                    </IconButton>
                  </Box>
                ))}
              </Stack>

              <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
                Add Holiday
              </Button>
            </CardContent>
          </Card>

          {/* Timezone Info */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Timezone
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                All times are in Indian Standard Time (IST)
              </Typography>
              <Chip label="UTC +5:30" size="small" />
            </CardContent>
          </Card>

          {/* Save Button */}
          <Box sx={{ mt: 3 }}>
            <Button fullWidth variant="contained" size="large" startIcon={<Save />}>
              Save Changes
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessHours;