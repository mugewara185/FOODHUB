import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
  FormHelperText,
  Switch,
  FormControlLabel,
  InputAdornment,
  Autocomplete,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  CloudUpload,
  Add,
  Delete,
  LocationOn,
  Phone,
  Email,
  Schedule,
  Restaurant,
  AttachMoney,
  Percent,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { logComponent } from '../../../core/dev/logger';

const steps = ['Basic Information', 'Location & Contact', 'Menu Categories', 'Business Hours', 'Review & Submit'];

const cuisines = [
  'Indian', 'Chinese', 'Italian', 'Mexican', 'Japanese', 'Thai', 
  'Continental', 'Fast Food', 'Street Food', 'Bakery', 'South Indian',
  'North Indian', 'Punjabi', 'Gujarati', 'Bengali', 'Kerala'
];

const AddRestaurant: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    description: '',
    cuisine: [] as string[],
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    gstNumber: '',
    fssaiLicense: '',
    panNumber: '',
    bankAccount: '',
    ifscCode: '',
    
    // Step 2: Location
    address: '',
    city: '',
    state: '',
    zipCode: '',
    landmark: '',
    latitude: '',
    longitude: '',
    
    // Step 3: Menu Categories
    categories: [] as { name: string; description: string }[],
    
    // Step 4: Business Hours
    openingTime: '09:00',
    closingTime: '23:00',
    workingDays: [] as string[],
    isOpen24x7: false,
    
    // Settings
    commission: 15,
    minOrder: 100,
    deliveryFee: 29,
    estimatedDeliveryTime: '30-40',
    isVeg: false,
    isFeatured: false,
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);

  React.useEffect(() => {
    logComponent.mount('AddRestaurants');
    return () => {
      logComponent.unmount('AddRestaurants');
    };
  }, []);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = () => {
    // Submit form
    console.log('Form submitted:', formData);
    // Show success message and redirect
    navigate('/admin/restaurants');
  };

  const handleAddCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, { name: '', description: '' }]
    }));
  };

  const handleRemoveCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => {
    const files = event.target.files;
    if (files) {
      if (type === 'logo') {
        setLogo(files[0]);
      } else if (type === 'cover') {
        setCoverImage(files[0]);
      } else {
        setImages(prev => [...prev, ...Array.from(files)]);
      }
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            {/* Restaurant Name */}
            <TextField
              label="Restaurant Name *"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            {/* Description */}
            <TextField
              label="Description *"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              helperText="Brief description of your restaurant and cuisine"
            />
            
            {/* Cuisine Selection */}
            <Autocomplete
              multiple
              options={cuisines}
              value={formData.cuisine}
              onChange={(_, newValue) => setFormData({ ...formData, cuisine: newValue })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cuisine Types *"
                  placeholder="Select cuisines"
                  required
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                  />
                ))
              }
            />
            
            <Divider sx={{ my: 2 }} />
            
            {/* Owner Details */}
            <Typography variant="subtitle1" fontWeight={600}>
              Owner Information
            </Typography>
            
            <TextField
              label="Owner Name *"
              fullWidth
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              required
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Owner Email *"
                  type="email"
                  fullWidth
                  value={formData.ownerEmail}
                  onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Owner Phone *"
                  fullWidth
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Business Documents */}
            <Typography variant="subtitle1" fontWeight={600}>
              Business Documents
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="GST Number"
                  fullWidth
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="FSSAI License"
                  fullWidth
                  value={formData.fssaiLicense}
                  onChange={(e) => setFormData({ ...formData, fssaiLicense: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="PAN Number"
                  fullWidth
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Bank Details */}
            <Typography variant="subtitle1" fontWeight={600}>
              Bank Account Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Account Number"
                  fullWidth
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="IFSC Code"
                  fullWidth
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                />
              </Grid>
            </Grid>
          </Stack>
        );
        
      case 1:
        return (
          <Stack spacing={3}>
            {/* Address */}
            <TextField
              label="Street Address *"
              fullWidth
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="City *"
                  fullWidth
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="State *"
                  fullWidth
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ZIP Code *"
                  fullWidth
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Landmark (Optional)"
              fullWidth
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            />
            
            <Divider sx={{ my: 2 }} />
            
            {/* Location Coordinates */}
            <Typography variant="subtitle1" fontWeight={600}>
              Location Coordinates (Optional)
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Latitude"
                  fullWidth
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 19.0760"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Longitude"
                  fullWidth
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., 72.8777"
                />
              </Grid>
            </Grid>
            
            <Alert severity="info">
              Leave blank to auto-detect from address
            </Alert>
          </Stack>
        );
        
      case 2:
        return (
          <Stack spacing={3}>
            <Typography variant="subtitle1" fontWeight={600}>
              Menu Categories
            </Typography>
            
            {formData.categories.map((category, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Category Name"
                      value={category.name}
                      onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      value={category.description}
                      onChange={(e) => handleCategoryChange(index, 'description', e.target.value)}
                      size="small"
                    />
                  </Box>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveCategory(index)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Paper>
            ))}
            
            <Button
              startIcon={<Add />}
              onClick={handleAddCategory}
              variant="outlined"
            >
              Add Category
            </Button>
            
            <Alert severity="info">
              You can add menu items after restaurant creation
            </Alert>
          </Stack>
        );
        
      case 3:
        return (
          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isOpen24x7}
                  onChange={(e) => setFormData({ ...formData, isOpen24x7: e.target.checked })}
                />
              }
              label="Open 24x7"
            />
            
            {!formData.isOpen24x7 && (
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Opening Time"
                      type="time"
                      fullWidth
                      value={formData.openingTime}
                      onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Closing Time"
                      type="time"
                      fullWidth
                      value={formData.closingTime}
                      onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
                
                <FormControl fullWidth>
                  <InputLabel>Working Days</InputLabel>
                  <Select
                    multiple
                    value={formData.workingDays}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      workingDays: typeof e.target.value === 'string' 
                        ? e.target.value.split(',') 
                        : e.target.value 
                    })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        );
        
      case 4:
        return (
          <Stack spacing={3}>
            {/* Review Summary */}
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Restaurant Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formData.name || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cuisine:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formData.cuisine.join(', ') || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Address:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formData.address || 'Not provided'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Owner Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formData.ownerName || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formData.ownerPhone || 'Not provided'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Business Hours
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Opening Time:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formData.isOpen24x7 ? '24x7' : formData.openingTime}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Closing Time:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formData.isOpen24x7 ? '24x7' : formData.closingTime}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Alert severity="info">
              Please review all information before submitting. You can edit later.
            </Alert>
          </Stack>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box 
    // display={'flex'} flexDirection={'column'} 
    // justifyContent={'center'}
    >
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Add New Restaurant
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete the form to onboard a new restaurant partner
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4} wrap='nowrap'>
        {/* Main Form */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                  <StepContent>
                    {renderStepContent(index)}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                      >
                        {activeStep === steps.length - 1 ? 'Submit' : 'Continue'}
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Right Column - Uploads & Settings */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Restaurant Images
            </Typography>
            
            {/* Logo Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Restaurant Logo
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                component="label"
              >
                {logo ? (
                  <Box>
                    <Avatar
                      src={URL.createObjectURL(logo)}
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 1 }}
                    />
                    <Typography variant="body2">{logo.name}</Typography>
                  </Box>
                ) : (
                  <>
                    <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2">Click to upload logo</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Recommended: 200x200px
                    </Typography>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                />
              </Box>
            </Box>

            {/* Cover Image Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Cover Image
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                component="label"
              >
                {coverImage ? (
                  <Typography variant="body2">{coverImage.name}</Typography>
                ) : (
                  <>
                    <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2">Click to upload cover image</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Recommended: 1200x400px
                    </Typography>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'cover')}
                />
              </Box>
            </Box>

            {/* Gallery Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Gallery Images
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                component="label"
              >
                <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2">Click to upload images</Typography>
                <Typography variant="caption" color="text.secondary">
                  You can upload multiple images
                </Typography>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  multiple
                  onChange={(e) => handleImageUpload(e, 'gallery')}
                />
              </Box>
              
              {images.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  {images.map((image, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Gallery ${index}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Restaurant Settings */}
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Restaurant Settings
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Commission (%)"
                type="number"
                size="small"
                fullWidth
                value={formData.commission}
                onChange={(e) => setFormData({ ...formData, commission: parseInt(e.target.value) })}
                InputProps={{
                  startAdornment: <Percent fontSize="small" />,
                }}
              />

              <TextField
                label="Minimum Order (₹)"
                type="number"
                size="small"
                fullWidth
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: parseInt(e.target.value) })}
                InputProps={{
                  startAdornment: <AttachMoney fontSize="small" />,
                }}
              />

              <TextField
                label="Delivery Fee (₹)"
                type="number"
                size="small"
                fullWidth
                value={formData.deliveryFee}
                onChange={(e) => setFormData({ ...formData, deliveryFee: parseInt(e.target.value) })}
              />

              <TextField
                label="Est. Delivery Time"
                size="small"
                fullWidth
                value={formData.estimatedDeliveryTime}
                onChange={(e) => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })}
                placeholder="e.g., 30-40"
                helperText="Time in minutes"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isVeg}
                    onChange={(e) => setFormData({ ...formData, isVeg: e.target.checked })}
                  />
                }
                label="Pure Vegetarian"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                }
                label="Feature this restaurant"
              />
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddRestaurant;