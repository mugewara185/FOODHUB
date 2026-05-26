import React from 'react';
import { Container, Box, Typography, Grid, Paper, Stack } from '@mui/material';

// Assuming you have your STEPS array imported or declared above:
// const STEPS = [ ... ]

const HowItWorksSection: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 12, position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Decorative Blur Gradients */}
      <Box sx={{
        position: 'absolute', top: '20%', left: '-10%', width: 300, height: 300,
        borderRadius: '50%', filter: 'blur(80px)', bgcolor: 'primary.light', opacity: 0.15, zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute', bottom: '10%', right: '-10%', width: 350, height: 350,
        borderRadius: '50%', filter: 'blur(100px)', bgcolor: 'secondary.light', opacity: 0.12, zIndex: 0
      }} />

      {/* Header */}
      <Box sx={{ mb: 10, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Typography variant="overline" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 2 }}>
          THREE SIMPLE STEPS
        </Typography>
        <Typography variant="h3" fontWeight={900} sx={{ mt: 1, mb: 2, letterSpacing: '-0.5px' }}>
          Your Next Meal is Just Clicks Away
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontSize: '1.1rem' }}>
          Skip the cooking hassle. Let us handle the details while you sit back and relax.
        </Typography>
      </Box>

      {/* Steps Grid Container */}
      <Grid container spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
        {STEPS.map((step, index) => (
          <Grid item xs={12} md={4} key={step.id}>
            <Paper
              elevation={0}
              sx={{
                p: 5,
                height: '100%',
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease',
                '&:hover': {
                  transform: 'translateY(-12px)',
                  boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.08)',
                  borderColor: step.color,
                  '& .step-icon-box': {
                    transform: 'scale(1.1) rotate(5deg)',
                    bgcolor: step.color,
                    color: 'white',
                  }
                },
              }}
            >
              <Stack spacing={3}>
                
                {/* Header Row inside card: Icon + Step Indicator */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box 
                    className="step-icon-box"
                    sx={{ 
                      p: 2, 
                      borderRadius: 3, 
                      bgcolor: `${step.color}15`, 
                      color: step.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      fontSize: '2rem'
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography 
                    variant="h2" 
                    fontWeight={900} 
                    sx={{ 
                      color: 'text.disabled', 
                      opacity: 0.15,
                      lineHeight: 1,
                      userSelect: 'none'
                    }}
                  >
                    0{step.id}
                  </Typography>
                </Stack>

                {/* Text Content */}
                <Stack spacing={1}>
                  <Typography variant="h5" fontWeight={800}>
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
                    {step.description}
                  </Typography>
                </Stack>

              </Stack>

              {/* Seamless horizontal connector line visible on large screens */}
              {index < STEPS.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '30%',
                    right: '-24px',
                    width: '48px',
                    height: '2px',
                    background: `linear-gradient(90deg, ${step.color} 0%, ${STEPS[index+1].color || 'divider'} 100%)`,
                    zIndex: 2,
                    display: { xs: 'none', md: 'block' },
                    opacity: 0.5
                  }}
                />
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HowItWorksSection;
