import React from 'react';
import { Box, Typography, Paper, Chip, Divider, Grid } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../app/store/V/Store_V';
import { AIInsightCard } from './components/AIInsightCard';
import { CheckCircle, Search } from '@mui/icons-material';

const InvestigationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // In a real app we'd fetch this. For now, try to use from Redux if it matches
  const { currentInvestigation } = useSelector((state: RootState) => state.adminAi);

  if (!currentInvestigation) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">Investigation not found or not loaded in memory.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">Investigation {id}</Typography>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {currentInvestigation.question}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Chip label={currentInvestigation.status.toUpperCase()} color={currentInvestigation.status === 'complete' ? 'success' : 'warning'} />
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center', ml: 2 }}>
            Started: {new Date(currentInvestigation.createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {currentInvestigation.insight && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Findings & Analysis</Typography>
              <AIInsightCard insight={currentInvestigation.insight} />
            </Box>
          )}

          {currentInvestigation.response && (
            <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>AI Summary</Typography>
              <Typography variant="body1">{currentInvestigation.response.message}</Typography>
            </Paper>
          )}

          {currentInvestigation.insight?.evidence && currentInvestigation.insight.evidence.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Evidence & Data Sources</Typography>
              {currentInvestigation.insight.evidence.map((ev, i) => (
                <Paper key={i} sx={{ p: 2, mb: 2, borderRadius: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Search fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight={600}>{ev.source}</Typography>
                    <Chip label={ev.toolName} size="small" variant="outlined" sx={{ ml: 'auto' }} />
                  </Box>
                  <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, mt: 1, overflowX: 'auto' }}>
                    <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                      {JSON.stringify(ev.dataPreview, null, 2)}
                    </pre>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Execution Details</Typography>
            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Tools Used</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {currentInvestigation.toolsUsed.map(tool => (
                <Chip key={tool} label={tool} size="small" />
              ))}
              {currentInvestigation.toolsUsed.length === 0 && (
                <Typography variant="body2" color="text.secondary">No tools used</Typography>
              )}
            </Box>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Execution Time</Typography>
            <Typography variant="body1" fontWeight={600}>~ 4.5s</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvestigationPage;
