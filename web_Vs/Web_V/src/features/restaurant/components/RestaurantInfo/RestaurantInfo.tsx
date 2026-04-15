import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { LocationOn, Info, AccessTime, Phone, Mail } from '@mui/icons-material';
import { FilterGroup, InfoCard } from '../../../ui/components';
import type { Restaurant } from '@core/types';

export interface RestaurantInfoProps {
  restaurant: Restaurant;
}

const RestaurantInfo: React.FC<RestaurantInfoProps> = ({ restaurant }) => {
  return (
    <Box sx={{ mb: 4 }}>
      <FilterGroup label="Location & Directions" defaultExpanded>
        <List sx={{ pt: 0 }}>
          <ListItem sx={{ px: 0 }}>
            <ListItemIcon>
              <LocationOn color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={restaurant.name}
              secondary={restaurant.address}
            />
          </ListItem>
        </List>
        {/* Map placeholder */}
        <Box
          sx={{
            height: 200,
            bgcolor: 'grey.100',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 2
          }}
        >
          <Typography color="text.secondary">Map View Placeholder</Typography>
        </Box>
      </FilterGroup>

      <Box sx={{ mt: 2 }}>
        <FilterGroup label="Restaurant Information" defaultExpanded>
          <List sx={{ pt: 0 }}>
            {restaurant.openingHours && restaurant.openingHours.map((hour, idx) => (
              <ListItem key={idx} sx={{ px: 0 }}>
                <ListItemIcon><AccessTime color="primary" /></ListItemIcon>
                <ListItemText primary={hour.day} secondary={`${hour.open} - ${hour.close}`} />
              </ListItem>
            ))}
            {restaurant.contact?.phone && (
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Phone color="primary" /></ListItemIcon>
                <ListItemText primary="Phone" secondary={restaurant.contact.phone} />
              </ListItem>
            )}
            {restaurant.contact?.email && (
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Mail color="primary" /></ListItemIcon>
                <ListItemText primary="Email" secondary={restaurant.contact.email} />
              </ListItem>
            )}
          </List>
          {restaurant.description && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom><Info sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1, color: 'primary.main' }} /> About</Typography>
              <Typography variant="body2" color="text.secondary">{restaurant.description}</Typography>
            </Box>
          )}
        </FilterGroup>
      </Box>
    </Box>
  );
};

export default RestaurantInfo;
