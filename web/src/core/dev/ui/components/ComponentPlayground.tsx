import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Rating,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import {
  Code,
  Preview,
  Settings,
  CopyAll,
  CheckCircle,
  Brightness4,
} from '@mui/icons-material';
import RestaurantCard from '@features/restaurant/components/RestaurantCard/RestaurantCard_V';

const ComponentPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const components = [
    {
      name: 'RestaurantCard',
      component: () => (
        <RestaurantCard
          restaurant={{
            id: '1',
            name: 'Spice Garden',
            location: { lat: 40.7128, lng: -74.006 },
            description: 'Authentic Indian cuisine',
            cuisine: ['Indian', 'North Indian'],
            rating: 4.5,
            deliveryTime: '25-30 min',
            deliveryFee: 29,
            minOrder: 199,
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
            address: '123 Food Street',
            isOpen: true,
            isFeatured: true,
            tags: ['Popular', 'Best Seller'],
          }}
        />
      ),
      code: `<RestaurantCard
  restaurant={{
    name: "Spice Garden",
    rating: 4.5,
    deliveryTime: "25-30 min",
    ...
  }}
/>`,
    },
    {
      name: 'Custom Button',
      component: () => (
        <Stack spacing={2}>
          <Button variant="contained">Primary Button</Button>
          <Button variant="outlined">Outlined Button</Button>
          <Button variant="text">Text Button</Button>
          <Button variant="contained" startIcon={<CheckCircle />}>
            With Icon
          </Button>
        </Stack>
      ),
      code: `<Button variant="contained">Primary Button</Button>
<Button variant="outlined">Outlined Button</Button>
<Button variant="text">Text Button</Button>`,
    },
    {
      name: 'Form Elements',
      component: () => (
        <Stack spacing={2}>
          <TextField label="Text Field" variant="outlined" fullWidth />
          <TextField label="Password" type="password" fullWidth />
          <FormControlLabel control={<Switch />} label="Toggle Switch" />
          <Rating />
          <Select value="option1" fullWidth>
            <MenuItem value="option1">Option 1</MenuItem>
            <MenuItem value="option2">Option 2</MenuItem>
          </Select>
        </Stack>
      ),
      code: `<TextField label="Text Field" />
<Switch />
<Rating />
<Select>
  <MenuItem>Option 1</MenuItem>
</Select>`,
    },
    {
      name: 'Cards & Alerts',
      component: () => (
        <Stack spacing={2}>
          <Card>
            <CardContent>
              <Typography variant="h6">Sample Card</Typography>
              <Typography>Card content goes here</Typography>
            </CardContent>
          </Card>
          <Alert severity="success">Success message</Alert>
          <Alert severity="error">Error message</Alert>
          <Alert severity="warning">Warning message</Alert>
          <Alert severity="info">Info message</Alert>
        </Stack>
      ),
      code: `<Card>
  <CardContent>
    <Typography>Sample Card</Typography>
  </CardContent>
</Card>
<Alert severity="success">Success!</Alert>`,
    },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Component Playground
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Test and preview components in real-time
      </Typography>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2, pt: 1 }}>
          {components.map((comp, idx) => (
            <Tab key={idx} label={comp.name} />
          ))}
          <Box sx={{ flex: 1 }} />
          <IconButton onClick={() => setShowCode(!showCode)} size="small">
            <Code />
          </IconButton>
        </Tabs>

        <Divider />

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Preview Area */}
            <Grid item xs={12} md={showCode ? 6 : 12}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, minHeight: 300 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Preview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {components[activeTab].component()}
              </Paper>
            </Grid>

            {/* Code View */}
            {showCode && (
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, position: 'relative' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2">Code</Typography>
                    <IconButton size="small" onClick={() => handleCopyCode(components[activeTab].code)}>
                      {copied ? <CheckCircle color="success" /> : <CopyAll />}
                    </IconButton>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    <code>{components[activeTab].code}</code>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Component Props Editor */}
          <Paper variant="outlined" sx={{ p: 3, mt: 3, borderRadius: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Props Editor
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Prop Name" fullWidth size="small" placeholder="e.g., variant" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Prop Value" fullWidth size="small" placeholder="e.g., contained" />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button variant="outlined" fullWidth>
                  Apply Changes
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
};

export default ComponentPlayground;