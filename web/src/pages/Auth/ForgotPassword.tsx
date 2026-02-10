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
  Alert,
  Stack,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Email, ArrowBack, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { type ForgotPasswordData } from '../../types/auth';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setValidationError('Email is required');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Email is invalid');
      return false;
    }
    
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    try {
      await forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled in the auth context
    }
  };

  if (isSubmitted) {
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
            textAlign: 'center',
          }}
        >
          {/* Success Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4,
            }}
          >
            <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
          </Box>

          {/* Success Message */}
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Check Your Email
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            We've sent a password reset link to:
          </Typography>
          
          <Typography
            variant="h6"
            fontWeight={600}
            color="primary.main"
            sx={{ mb: 3 }}
          >
            {email}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Please check your inbox and follow the instructions to reset your password.
          </Typography>

          {/* Tips */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Didn't receive the email?</strong>
              <br />
              • Check your spam folder
              <br />
              • Make sure you entered the correct email address
              <br />
              • Wait a few minutes and try again
            </Typography>
          </Alert>

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              onClick={() => setEmail('')}
              sx={{ borderRadius: 2 }}
            >
              Try Another Email
            </Button>
            
            <Button
              variant="outlined"
              component={RouterLink}
              to="/login"
              sx={{ borderRadius: 2 }}
            >
              Back to Login
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

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
            Forgot Password
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your email address to receive a password reset link
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            {/* Email Field */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationError) setValidationError('');
              }}
              error={!!validationError}
              helperText={validationError}
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
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </Stack>
        </Box>

        {/* Back to Login Link */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Remember your password?{' '}
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

        {/* Additional Info */}
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="body2">
            You'll receive an email with a link to reset your password. 
            The link will expire in 1 hour for security reasons.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;