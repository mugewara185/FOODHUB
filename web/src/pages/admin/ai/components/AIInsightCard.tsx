import React from 'react';
import { Card, CardContent, Typography, Chip, LinearProgress, Grid, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Warning, Info, Error as ErrorIcon, CheckCircle, Assessment } from '@mui/icons-material';
import { type AIInsight } from '../../../../features/admin/ai/adminAiApi';

interface Props {
  insight: AIInsight;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'default';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical': return <ErrorIcon fontSize="small" />;
    case 'warning': return <Warning fontSize="small" />;
    case 'info': return <Info fontSize="small" />;
    default: return <Assessment fontSize="small" />;
  }
};

export const AIInsightCard: React.FC<Props> = ({ insight }) => {
  return (
    <Card sx={{ mt: 2, mb: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getSeverityIcon(insight.severity)}
              label={insight.severity.toUpperCase()}
              color={getSeverityColor(insight.severity) as any}
              size="small"
            />
            <Typography variant="subtitle1" fontWeight={700}>
              {insight.entityName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Confidence
            </Typography>
            <Box sx={{ width: 60 }}>
              <LinearProgress variant="determinate" value={insight.confidence} color={insight.confidence > 80 ? 'success' : insight.confidence > 50 ? 'warning' : 'error'} />
            </Box>
            <Typography variant="caption" fontWeight={600}>{insight.confidence}%</Typography>
          </Box>
        </Box>

        <Typography variant="body1" fontWeight={600} gutterBottom>
          {insight.finding}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2, mt: 1 }}>
          {insight.metrics.map((metric, idx) => (
            <Grid item xs={6} sm={4} key={idx}>
              <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  {metric.name}
                </Typography>
                <Typography variant="subtitle2" fontWeight={700}>
                  {metric.value} {metric.unit}
                </Typography>
                {metric.benchmark && (
                  <Typography variant="caption" color="text.secondary">
                    vs {metric.benchmark}
                  </Typography>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
          Likely Causes
        </Typography>
        <List dense disablePadding sx={{ mb: 2 }}>
          {insight.likelyCauses.map((cause, idx) => (
            <ListItem key={idx} disablePadding sx={{ pl: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 24 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.secondary' }} /></ListItemIcon>
              <ListItemText primary={cause} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Recommendations
        </Typography>
        <List dense disablePadding sx={{ mb: 2 }}>
          {insight.recommendations.map((rec, idx) => (
            <ListItem key={idx} disablePadding sx={{ pl: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 24 }}><CheckCircle color="success" sx={{ fontSize: 16 }} /></ListItemIcon>
              <ListItemText primary={rec} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>

        <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.dark', borderRadius: 1 }}>
          <Typography variant="body2">
            <strong>Summary:</strong> {insight.summary}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
