import React from 'react';
import { Box, Typography, Chip, Paper, CircularProgress, Skeleton } from '@mui/material';
import { Terminal, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { type ToolCallRecord } from '../../../../features/admin/ai/adminAiApi';

interface Props {
  toolCalls: ToolCallRecord[];
  isLoading?: boolean;
}

export const ToolExecutionPanel: React.FC<Props> = ({ toolCalls, isLoading }) => {
  if (toolCalls.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, borderBottom: '1px solid #333', pb: 1 }}>
        <Terminal fontSize="small" sx={{ color: '#4CAF50' }} />
        <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#fff' }}>
          Tool Execution
        </Typography>
      </Box>

      {toolCalls.length === 0 && isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">Executing MCP tools...</Typography>
          <Skeleton variant="rectangular" height={24} sx={{ bgcolor: '#333' }} />
          <Skeleton variant="rectangular" height={24} sx={{ bgcolor: '#333' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {toolCalls.map((tool, idx) => (
            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#2d2d2d', p: 1, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {tool.status === 'success' && <CheckCircle sx={{ color: '#4CAF50', fontSize: 16 }} />}
                {tool.status === 'error' && <ErrorIcon sx={{ color: '#f44336', fontSize: 16 }} />}
                {tool.status === 'running' && <CircularProgress size={12} sx={{ color: '#2196F3' }} />}
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {tool.name}()
                </Typography>
              </Box>
              {tool.durationMs && (
                <Typography variant="caption" sx={{ color: '#888' }}>
                  {tool.durationMs}ms
                </Typography>
              )}
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={12} sx={{ color: '#2196F3' }} />
              <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic' }}>
                Analyzing results...
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};
