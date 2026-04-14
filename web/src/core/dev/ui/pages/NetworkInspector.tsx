import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { mockApiCalls, type MockApiCall } from '../mockData';
import HttpIcon from '@mui/icons-material/Http';

const NetworkInspector: React.FC = () => {
  const [selectedCall, setSelectedCall] = useState<MockApiCall | null>(mockApiCalls[0]);
  const [tab, setTab] = useState(0);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'info';
      case 'POST': return 'success';
      case 'PUT': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success.main';
    if (status >= 400 && status < 500) return 'warning.main';
    if (status >= 500) return 'error.main';
    return 'text.secondary';
  };

  const renderHeaders = (headers: Record<string, string>) => (
    <Box component="pre" sx={{ p: 2, m: 0, bgcolor: '#1e1e1e', color: '#d4d4d4', borderRadius: 1, overflow: 'auto', fontSize: '0.85rem', fontFamily: 'monospace' }}>
      {Object.entries(headers).map(([key, value]) => (
        <React.Fragment key={key}>
          <span style={{ color: '#9cdcfe' }}>{key}:</span> <span style={{ color: '#ce9178' }}>{value}</span>
          <br />
        </React.Fragment>
      ))}
    </Box>
  );

  const renderJson = (body: any) => (
    <Box component="pre" sx={{ p: 2, m: 0, bgcolor: '#1e1e1e', color: '#d4d4d4', borderRadius: 1, overflow: 'auto', fontSize: '0.85rem', fontFamily: 'monospace' }}>
      {body ? JSON.stringify(body, null, 2) : 'No content'}
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Network / API Inspector
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitor mock API calls, intercept requests, and inspect payloads.
      </Typography>

      <Paper sx={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        {/* Left Side: Request List */}
        <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Latest Requests ({mockApiCalls.length})
            </Typography>
          </Box>
          <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
            {mockApiCalls.map((call) => (
              <React.Fragment key={call.id}>
                <ListItemButton
                  selected={selectedCall?.id === call.id}
                  onClick={() => setSelectedCall(call)}
                  sx={{ py: 1.5 }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label={call.method} size="small" color={getMethodColor(call.method)} sx={{ fontWeight: 'bold', fontSize: '0.65rem', height: 20 }} />
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
                          {call.endpoint}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: getStatusColor(call.status), fontWeight: 'bold' }}>
                        {call.status}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        {call.duration}ms • {call.size}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {call.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                </ListItemButton>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Right Side: Request Details */}
        <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
          {selectedCall ? (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Chip label={selectedCall.method} size="small" color={getMethodColor(selectedCall.method)} />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ wordBreak: 'break-all' }}>
                    {selectedCall.endpoint}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography variant="body2" sx={{ color: getStatusColor(selectedCall.status), fontWeight: 'bold' }}>
                    {selectedCall.status} {selectedCall.statusText}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time: {selectedCall.duration}ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Size: {selectedCall.size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Initiator: {selectedCall.initiator}
                  </Typography>
                </Box>
              </Box>

              <Tabs value={tab} onChange={(_, val) => setTab(val)} sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Headers" />
                <Tab label="Payload / Body" />
                <Tab label="Response" />
              </Tabs>

              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, bgcolor: '#1e1e1e' }}>
                {tab === 0 && (
                  <Box>
                    <Typography variant="caption" color="grey.500" gutterBottom display="block">Request Headers</Typography>
                    {renderHeaders(selectedCall.requestHeaders)}
                    <Typography variant="caption" color="grey.500" gutterBottom display="block" sx={{ mt: 2 }}>Response Headers</Typography>
                    {renderHeaders(selectedCall.responseHeaders)}
                  </Box>
                )}
                {tab === 1 && (
                  <Box>
                    <Typography variant="caption" color="grey.500" gutterBottom display="block">Request Payload</Typography>
                    {renderJson(selectedCall.requestBody)}
                  </Box>
                )}
                {tab === 2 && (
                  <Box>
                    <Typography variant="caption" color="grey.500" gutterBottom display="block">Response Body</Typography>
                    {renderJson(selectedCall.responseBody)}
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
              <HttpIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
              <Typography>Select a request to view details</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default NetworkInspector;
