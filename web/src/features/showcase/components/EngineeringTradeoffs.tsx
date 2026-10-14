import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Terminal,
  CompareArrows,
  CheckCircle,
  HelpOutline,
} from '@mui/icons-material';
import { ENGINEERING_TRADEOFFS } from '../showcaseData';

export const EngineeringTradeoffs: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>('atomic-concurrency');

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box id="engineering-tradeoffs" sx={{ mb: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <CompareArrows color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={800}>
          Engineering Decisions, Problem-Solving & Trade-Offs
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 800 }}>
        High-signal evidence of engineering maturity: real technical obstacles encountered during development, the architectural solutions implemented, and the trade-offs evaluated.
      </Typography>

      <Stack spacing={2}>
        {ENGINEERING_TRADEOFFS.map((tradeoff) => {
          const isCurrentExpanded = expanded === tradeoff.id;
          return (
            <Accordion
              key={tradeoff.id}
              expanded={isCurrentExpanded}
              onChange={handleChange(tradeoff.id)}
              sx={{
                borderRadius: '12px !important',
                border: '1px solid',
                borderColor: isCurrentExpanded ? 'primary.main' : 'divider',
                boxShadow: isCurrentExpanded ? '0 4px 16px rgba(59, 130, 246, 0.15)' : 'none',
                overflow: 'hidden',
                '&:before': { display: 'none' },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  px: 3,
                  py: 1.5,
                  bgcolor: isCurrentExpanded ? 'background.default' : 'background.paper',
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ width: '100%', pr: 2 }}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {tradeoff.title}
                  </Typography>
                  <Chip
                    label={tradeoff.status}
                    color="success"
                    size="small"
                    sx={{ fontWeight: 700, fontSize: '0.68rem', flexShrink: 0 }}
                  />
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 3, pb: 3, pt: 2, bgcolor: 'background.paper' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="error.main" gutterBottom>
                    ⚠️ The Challenge / Problem:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {tradeoff.problem}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main" gutterBottom>
                    💡 Architectural Solution:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                    {tradeoff.solution}
                  </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="success.main" gutterBottom>
                    🎯 Verified Impact:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                    {tradeoff.impact}
                  </Typography>

                  <Typography variant="subtitle2" fontWeight={800} color="warning.main" gutterBottom>
                    ⚖️ Trade-off Consideration:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {tradeoff.tradeoffConsideration}
                  </Typography>
                </Paper>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom>
                  AUTHORITATIVE REPOSITORY SOURCE FILES:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {tradeoff.sourceFiles.map((file) => (
                    <Chip
                      key={file}
                      label={`📂 ${file}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontFamily: 'monospace', fontSize: '0.72rem', borderColor: 'divider' }}
                    />
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    </Box>
  );
};
