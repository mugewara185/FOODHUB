import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
  Divider,
  Avatar,
  IconButton,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Add,
  Delete,
  Restaurant,
  LocalOffer,
  AccessTime,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AddMenuItem: React.FC = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [addons, setAddons] = useState<{ name: string; price: number }[]>([]);
  const [variants, setVariants] = useState<{ name: string; price: number }[]>([]);

  const handleAddAddon = () => {
    setAddons([...addons, { name: '', price: 0 }]);
  };

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: 0 }]);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Add New Menu Item
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create a new dish for your restaurant
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={3}>
              {/* Basic Info */}
              <TextField
                label="Item Name *"
                fullWidth
                placeholder="e.g., Butter Chicken"
              />

              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select label="Category *">
                  <MenuItem value="starters">Starters</MenuItem>
                  <MenuItem value="main">Main Course</MenuItem>
                  <MenuItem value="breads">Breads</MenuItem>
                  <MenuItem value="rice">Rice & Biryani</MenuItem>
                  <MenuItem value="desserts">Desserts</MenuItem>
                  <MenuItem value="beverages">Beverages</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Description"
                multiline
                rows={3}
                fullWidth
                placeholder="Describe your dish..."
              />

              {/* Pricing */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Price *"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Discounted Price"
                    type="number"
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>

              {/* Preparation Time */}
              <TextField
                label="Preparation Time (minutes)"
                type="number"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTime />
                    </InputAdornment>
                  ),
                }}
              />

              <Divider />

              {/* Dietary Info */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Dietary Information
                </Typography>
                <Stack direction="row" spacing={3}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Vegetarian"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Spicy"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Best Seller"
                  />
                </Stack>
              </Box>

              <Divider />

              {/* Add-ons */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Add-ons (Optional)
                </Typography>
                {addons.map((addon, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Add-on Name"
                          value={addon.name}
                          placeholder="e.g., Extra Cheese"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Price"
                          type="number"
                          value={addon.price}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <IconButton color="error" onClick={() => setAddons(addons.filter((_, i) => i !== index))}>
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button
                  startIcon={<Add />}
                  onClick={handleAddAddon}
                  variant="outlined"
                >
                  Add Add-on
                </Button>
              </Box>

              <Divider />

              {/* Variants */}
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Variants (Optional)
                </Typography>
                {variants.map((variant, index) => (
                  <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={5}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Variant Name"
                          value={variant.name}
                          placeholder="e.g., Half Plate"
                        />
                      </Grid>
                      <Grid item xs={4}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Price"
                          type="number"
                          value={variant.price}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <IconButton color="error" onClick={() => setVariants(variants.filter((_, i) => i !== index))}>
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button
                  startIcon={<Add />}
                  onClick={handleAddVariant}
                  variant="outlined"
                >
                  Add Variant
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Image Upload */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Item Images
            </Typography>
            
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' },
              }}
              component="label"
            >
              <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2">Click to upload images</Typography>
              <Typography variant="caption" color="text.secondary">
                Recommended: 800x600px, up to 5 images
              </Typography>
              <input type="file" hidden accept="image/*" multiple />
            </Box>

            {images.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {images.map((img, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <Avatar src={img} variant="rounded" sx={{ width: 60, height: 60 }} />
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'error.main', color: 'white' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>

          {/* Availability */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Availability
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Available for ordering"
            />
          </Paper>

          {/* Nutritional Info */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Nutritional Info (Optional)
            </Typography>
            <Stack spacing={2}>
              <TextField label="Calories" type="number" size="small" fullWidth />
              <TextField label="Protein (g)" type="number" size="small" fullWidth />
              <TextField label="Carbs (g)" type="number" size="small" fullWidth />
              <TextField label="Fat (g)" type="number" size="small" fullWidth />
            </Stack>
          </Paper>

          {/* Submit */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Button fullWidth variant="contained" size="large">
              Create Menu Item
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddMenuItem;