import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Stack,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  Lock,
  ArrowBack,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '@contexts/AuthContext';
import { type SignupData } from '@/data/types/auth';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<SignupData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Calculate password strength
  useEffect(() => {
    const calculateStrength = (password: string) => {
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (/[A-Z]/.test(password)) strength += 25;
      if (/[0-9]/.test(password)) strength += 25;
      if (/[^A-Za-z0-9]/.test(password)) strength += 25;
      setPasswordStrength(strength);
    };

    calculateStrength(formData.password);
  }, [formData.password]);

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number is invalid';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 75) {
      errors.password = 'Password is too weak';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await signup(formData);
      // Navigation happens automatically due to useEffect
    } catch (err) {
      // Error is handled in the auth context
    }
  };

  const handleChange = (field: keyof SignupData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = e.target.value;
    
    // Format phone number
    if (field === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return 'success';
    if (passwordStrength >= 50) return 'warning';
    return 'error';
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength >= 75) return 'Strong';
    if (passwordStrength >= 50) return 'Medium';
    if (passwordStrength >= 25) return 'Weak';
    return 'Very Weak';
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Grid container spacing={4}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              height: '100%',
            }}
          >
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" fontWeight={800} gutterBottom color="primary.main">
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Join FoodHub and start ordering delicious food
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            {/* Signup Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={3}>
                {/* Name Field */}
                <TextField
                  fullWidth
                  label="Full Name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="John Doe"
                />

                {/* Email Field */}
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!validationErrors.email}
                  helperText={validationErrors.email}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="you@example.com"
                />

                {/* Phone Field */}
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  error={!!validationErrors.phone}
                  helperText={validationErrors.phone}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="9876543210"
                />

                {/* Password Field */}
                <Box>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange('password')}
                    error={!!validationErrors.password}
                    helperText={validationErrors.password}
                    disabled={isLoading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    placeholder="••••••••"
                  />
                  
                  {/* Password Strength Meter */}
                  {formData.password && (
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box
                          sx={{
                            flexGrow: 1,
                            height: 4,
                            bgcolor: 'grey.200',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${passwordStrength}%`,
                              height: '100%',
                              bgcolor: `${getPasswordStrengthColor()}.main`,
                              transition: 'width 0.3s',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color={`${getPasswordStrengthColor()}.main`}
                          sx={{ ml: 1, fontWeight: 600 }}
                        >
                          {getPasswordStrengthLabel()}
                        </Typography>
                      </Box>
                      
                      {/* Password Requirements */}
                      <Grid container spacing={1}>
                        {[
                          { text: 'At least 8 characters', met: formData.password.length >= 8 },
                          { text: 'One uppercase letter', met: /[A-Z]/.test(formData.password) },
                          { text: 'One number', met: /[0-9]/.test(formData.password) },
                          { text: 'One special character', met: /[^A-Za-z0-9]/.test(formData.password) },
                        ].map((req, index) => (
                          <Grid item xs={6} key={index}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {req.met ? (
                                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                              ) : (
                                <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: 1, borderColor: 'grey.400' }} />
                              )}
                              <Typography
                                variant="caption"
                                color={req.met ? 'success.main' : 'text.secondary'}
                              >
                                {req.text}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>

                {/* Confirm Password Field */}
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  error={!!validationErrors.confirmPassword}
                  helperText={validationErrors.confirmPassword}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  placeholder="••••••••"
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    mt: 2,
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </Stack>
            </Box>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  underline="hover"
                  color="primary"
                  fontWeight={600}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column - Benefits */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 4,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
              }}
            >
              <Typography variant="h5" fontWeight={700} gutterBottom>
                Why Join FoodHub?
              </Typography>
              
              <Stack spacing={3} sx={{ mt: 3 }}>
                {[
                  {
                    icon: '🚚',
                    title: 'Fast Delivery',
                    description: 'Get your food delivered in 30 minutes or less',
                  },
                  {
                    icon: '🎁',
                    title: 'Exclusive Offers',
                    description: 'Enjoy members-only discounts and cashback',
                  },
                  {
                    icon: '⭐',
                    title: 'Priority Support',
                    description: 'Get 24/7 customer support for your orders',
                  },
                  {
                    icon: '💳',
                    title: 'Easy Payments',
                    description: 'Multiple secure payment options',
                  },
                ].map((benefit, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Typography variant="h4">{benefit.icon}</Typography>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Terms & Conditions */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                By creating an account, you agree to our{' '}
                <Link href="#" underline="hover" color="primary">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" underline="hover" color="primary">
                  Privacy Policy
                </Link>
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};


