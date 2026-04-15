import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { componentVersions } from '../mockData';

const VersionSwitcher: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Component Version Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Toggle between different architectural variations of core components.
      </Typography>

      <Grid container spacing={4}>
        {componentVersions.map((comp) => (
          <Grid item xs={12} key={comp.pageKey}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                {comp.componentName}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                {comp.versions.map((ver) => {
                  const isActive = ver.name === comp.activeVersion;
                  return (
                    <Grid item xs={12} md={6} key={ver.name}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          height: '100%',
                          borderColor: isActive ? 'success.main' : 'divider',
                          bgcolor: isActive ? 'success.50' : 'background.paper',
                          ...(isActive && { boxShadow: 1 }),
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1" fontWeight={700} sx={{ mr: 1 }}>
                                {ver.label} ({ver.name})
                              </Typography>
                              {isActive && <CheckCircleIcon color="success" fontSize="small" />}
                            </Box>
                            <Chip 
                              label={ver.status} 
                              size="small" 
                              color={ver.status === 'stable' ? 'success' : ver.status === 'beta' ? 'warning' : 'default'} 
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                            {ver.description}
                          </Typography>

                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" fontWeight={600} display="block" gutterBottom>
                              Features:
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                              {ver.features.map(f => (
                                <Chip key={f} label={f} size="small" variant="outlined" />
                              ))}
                            </Stack>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Typography variant="caption" color="text.secondary">
                              Author: {ver.author}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {ver.linesOfCode} LoC • Updated {ver.lastUpdated}
                            </Typography>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <Button 
                            fullWidth 
                            variant={isActive ? "contained" : "outlined"} 
                            color={isActive ? "success" : "primary"}
                            disabled={isActive}
                          >
                            {isActive ? "Currently Active" : "Activate Version"}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VersionSwitcher;
