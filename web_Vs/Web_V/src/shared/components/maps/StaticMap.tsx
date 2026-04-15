import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Restaurant,
  Home,
  LocalShipping,
  MyLocation,
} from '@mui/icons-material';

interface StaticMapProps {
  markers?: Array<{
    type: 'restaurant' | 'customer' | 'partner' | 'current';
    title: string;
  }>;
  showRoute?: boolean;
  height?: string | number;
}

const StaticMap: React.FC<StaticMapProps> = ({
  markers = [],
  showRoute = false,
  height = '400px',
}) => {
  // Create a grid layout to simulate map
  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <Restaurant sx={{ color: '#FF6B35' }} />;
      case 'customer':
        return <Home sx={{ color: '#4CAF50' }} />;
      case 'partner':
        return <LocalShipping sx={{ color: '#2196F3' }} />;
      case 'current':
        return <MyLocation sx={{ color: '#f44336' }} />;
      default:
        return <LocationOn />;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height,
        width: '100%',
        bgcolor: '#e8f4f8',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
      }}
    >
      {/* Grid lines (simulate map) */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(200, 200, 200, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 200, 200, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Route line (simulated) */}
      {showRoute && (
        <Box
          sx={{
            position: 'absolute',
            top: '30%',
            left: '20%',
            width: '60%',
            height: '40%',
            border: '3px dashed',
            borderColor: 'primary.main',
            borderRadius: '50%',
            transform: 'rotate(45deg)',
            opacity: 0.5,
          }}
        />
      )}

      {/* Markers positioned at different spots */}
      {markers.map((marker, index) => {
        // Position markers at different spots to simulate real map
        const positions = [
          { top: '20%', left: '30%' },
          { top: '60%', left: '70%' },
          { top: '40%', left: '50%' },
          { top: '70%', left: '20%' },
          { top: '30%', left: '80%' },
        ];

        return (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              ...positions[index % positions.length],
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 2,
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: marker.type === 'partner' ? 'primary.main' : 'divider',
                width: 40,
                height: 40,
                mx: 'auto',
                mb: 0.5,
                boxShadow: 3,
              }}
            >
              {getMarkerIcon(marker.type)}
            </Avatar>
            <Chip
              label={marker.title}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          </Box>
        );
      })}

      {/* Map Attribution */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          bgcolor: 'rgba(255,255,255,0.7)',
          px: 1,
          borderRadius: 1,
        }}
      >
        Map Preview (Static Mode)
      </Typography>
    </Paper>
  );
};

export default StaticMap;