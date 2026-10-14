import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  Collapse,
} from '@mui/material';
import {
  Architecture,
  SyncAlt,
  Storage,
  Router,
  Person,
  Storefront,
  DeliveryDining,
  AdminPanelSettings,
  Code,
  Info,
} from '@mui/icons-material';
import { ARCHITECTURE_NODES } from '../showcaseData';
import type { ArchitectureNode } from '../types';

export const ArchitectureMap: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('client-customer');
  const selectedNode = ARCHITECTURE_NODES.find((n) => n.id === selectedNodeId) || ARCHITECTURE_NODES[0];

  const getNodeIcon = (id: string) => {
    switch (id) {
      case 'client-customer':
        return <Person />;
      case 'client-owner':
        return <Storefront />;
      case 'client-partner':
        return <DeliveryDining />;
      case 'client-admin':
        return <AdminPanelSettings />;
      case 'gateway-api':
        return <Router />;
      case 'simulator-gps':
        return <SyncAlt />;
      case 'database-mongo':
        return <Storage />;
      default:
        return <Code />;
    }
  };

  return (
    <Box id="architecture-diagram" sx={{ mb: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Architecture color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={800}>
          Distributed System Topology & Realtime Event Loop
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 800 }}>
        FoodHub is engineered around an event-driven pub/sub architecture. User actions in one actor domain immediately propagate state across all connected actors via Socket.IO order rooms and atomic REST endpoints.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        {/* Visual Multi-Actor Grid */}
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, letterSpacing: '0.05em' }}>
          ACTOR DOMAINS (FRONTEND CLIENTS)
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {ARCHITECTURE_NODES.filter((n) => n.type === 'actor').map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <Grid item xs={12} sm={6} md={3} key={node.id}>
                <Card
                  variant="outlined"
                  onClick={() => setSelectedNodeId(node.id)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.25s ease-in-out',
                    border: '2px solid',
                    borderColor: isSelected ? node.color : 'divider',
                    bgcolor: isSelected ? `${node.color}10` : 'background.paper',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? `0 6px 20px ${node.color}30` : 'none',
                    '&:hover': {
                      borderColor: node.color,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: `${node.color}20`,
                          color: node.color,
                          display: 'flex',
                        }}
                      >
                        {getNodeIcon(node.id)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {node.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {node.subtitle}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Central Gateway & Services Grid */}
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, letterSpacing: '0.05em' }}>
          BACKEND SERVICES, TRANSPORT & STORAGE
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {ARCHITECTURE_NODES.filter((n) => n.type !== 'actor').map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <Grid item xs={12} sm={6} md={3} key={node.id}>
                <Card
                  variant="outlined"
                  onClick={() => setSelectedNodeId(node.id)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.25s ease-in-out',
                    border: '2px solid',
                    borderColor: isSelected ? node.color : 'divider',
                    bgcolor: isSelected ? `${node.color}10` : 'background.paper',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                    boxShadow: isSelected ? `0 6px 20px ${node.color}30` : 'none',
                    '&:hover': {
                      borderColor: node.color,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: `${node.color}20`,
                          color: node.color,
                          display: 'flex',
                        }}
                      >
                        {getNodeIcon(node.id)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {node.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {node.subtitle}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Selected Node Details Box */}
        {selectedNode && (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: selectedNode.color,
                    boxShadow: `0 0 10px ${selectedNode.color}`,
                  }}
                />
                <Typography variant="h6" fontWeight={800}>
                  {selectedNode.label}
                </Typography>
                <Chip label={selectedNode.type.toUpperCase()} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {selectedNode.subtitle}
              </Typography>
            </Stack>

            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Active contracts, communication channels, and boundary protocols associated with this node:
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedNode.portsOrChannels.map((port) => (
                <Chip
                  key={port}
                  label={port}
                  size="small"
                  variant="outlined"
                  sx={{
                    bgcolor: 'background.paper',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    borderColor: 'divider',
                  }}
                />
              ))}
            </Stack>
          </Paper>
        )}
      </Paper>
    </Box>
  );
};
