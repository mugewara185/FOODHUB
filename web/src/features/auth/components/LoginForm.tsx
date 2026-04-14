import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
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
  Checkbox,
  FormControlLabel,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Google,
  Facebook,
  Apple,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '@contexts/AuthContext';
import { type LoginCredentials } from '@/data/types/auth';
import { ROUTE_PATHS } from '@core/constants/food';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!credentials.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = 'Email is invalid';
    }

    if (!credentials.password) {
      errors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(credentials);
      // Navigation happens automatically due to useEffect
    } catch (err) {
      // Error is handled in the auth context
    }
  };

  const handleChange = (field: keyof LoginCredentials) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCredentials(prev => ({
      ...prev,
      [field]: field === 'rememberMe' ? e.target.checked : e.target.value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`Logging in with ${provider}`);
    // Implement social login here
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" fontWeight={800} gutterBottom color="primary.main">
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your account to continue
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={credentials.email}
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

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
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

            {/* Remember Me & Forgot Password */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={credentials.rememberMe}
                    onChange={handleChange('rememberMe')}
                    color="primary"
                  />
                }
                label="Remember me"
              />
              <Link
                component={RouterLink}
                to="/forgot-password"
                underline="hover"
                color="primary"
              >
                Forgot password?
              </Link>
            </Box>

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
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Stack>
        </Box>

        {/* Divider */}
        <Box sx={{ my: 4, position: 'relative' }}>
          <Divider>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              Or continue with
            </Typography>
          </Divider>
        </Box>

        {/* Social Login Buttons */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { provider: 'google', icon: <Google />, label: 'Google' },
            { provider: 'facebook', icon: <Facebook />, label: 'Facebook' },
            { provider: 'apple', icon: <Apple />, label: 'Apple' },
          ].map((social) => (
            <Grid item xs={4} key={social.provider}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={social.icon}
                onClick={() => handleSocialLogin(social.provider)}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                {social.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Sign Up Link */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/signup"
              underline="hover"
              color="primary"
              fontWeight={600}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>

      {/* Additional Info */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          By signing in, you agree to our{' '}
          <Link href="#" underline="hover" color="primary">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" underline="hover" color="primary">
            Privacy Policy
          </Link>
        </Typography>
      </Box>
    </Container>
  );
};


