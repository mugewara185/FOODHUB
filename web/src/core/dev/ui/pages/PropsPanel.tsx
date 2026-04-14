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
  TextField,
  Button,
  Switch,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import { propsOverrideData, type ComponentPropsConfig, type PropDefinition } from '../mockData';

const PropsPanel: React.FC = () => {
  const [selectedComp, setSelectedComp] = useState<ComponentPropsConfig>(propsOverrideData[0]);

  const renderInputForType = (prop: PropDefinition) => {
    switch (prop.type) {
      case 'boolean':
        return <Switch defaultChecked={prop.currentValue === 'true'} />;
      case '(id: string) => void':
      case '(item: CartItem) => void':
      case 'ReactNode':
        return (
          <TextField
            fullWidth
            size="small"
            disabled
            value={prop.currentValue}
            InputProps={{ readOnly: true }}
            helperText="Read-only function or node"
          />
        );
      case 'string[]':
      case 'Restaurant':
      case 'FoodItem':
        return (
          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            defaultValue={prop.currentValue}
          />
        );
      default:
        return (
          <TextField
            fullWidth
            size="small"
            defaultValue={prop.currentValue}
          />
        );
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Props & Overrides
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Simulate prop injections and override component states.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="subtitle2">Target Component</Typography>
            </Box>
            <List disablePadding>
              {propsOverrideData.map((config) => (
                <React.Fragment key={config.componentName}>
                  <ListItemButton 
                    selected={selectedComp.componentName === config.componentName}
                    onClick={() => setSelectedComp(config)}
                  >
                    <ListItemText 
                      primary={config.componentName}
                      secondary={config.path}
                      secondaryTypographyProps={{ 
                        noWrap: true, 
                        variant: 'caption',
                        sx: { display: 'block', maxWidth: 200 } 
                      }}
                    />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'auto', p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box>
                <Typography variant="h6" color="primary">
                  {selectedComp.componentName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {selectedComp.path}
                </Typography>
              </Box>
              <Button variant="contained" color="secondary" size="small">
                Apply Overrides
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              Overrides applied here will only affect the component in the Dev Playground, not the active app state.
            </Alert>

            {selectedComp.props.map((prop) => (
              <Box key={prop.name} sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ mr: 1 }}>{prop.name}</Typography>
                      {prop.required && <Chip label="Required" size="small" color="error" sx={{ height: 16, fontSize: '0.6rem' }} />}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {prop.description}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', mt: 1, display: 'inline-block' }}>
                      {prop.type}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    {renderInputForType(prop)}
                  </Grid>
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PropsPanel;
