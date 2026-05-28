import React, { useState, useRef, useEffect } from 'react';
import { Container, Box, Typography, Stack, Fade, useMediaQuery, useTheme } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

// Animation keyframes
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulseGlow = keyframes`
  0% { opacity: 0.3; filter: blur(20px); }
  50% { opacity: 0.6; filter: blur(25px); }
  100% { opacity: 0.3; filter: blur(20px); }
`;

// Styled components
const StepNumber = styled(Box)(({ theme }) => ({
  fontSize: 'clamp(4rem, 10vw, 7rem)',
  fontWeight: 800,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  lineHeight: 1,
  letterSpacing: '-0.03em',
}));

const GlowOrb = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '60%',
  height: '60%',
  borderRadius: '50%',
  filter: 'blur(80px)',
  zIndex: 0,
  pointerEvents: 'none',
}));

const StepCard = styled(Box)(({ theme }) => ({
  position: 'relative',
  cursor: 'pointer',
  transition: 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
  '&:hover': {
    transform: 'translateY(-8px)',
    '& .step-content': {
      transform: 'scale(1.02)',
    },
    '& .step-glow': {
      opacity: 0.15,
    },
  },
}));

// Your STEPS array (customize icons as needed)
const STEPS = [
  {
    id: 1,
    title: "Choose Your Meal",
    description: "Browse our curated menu of chef-crafted dishes, from healthy bowls to comfort food classics.",
    icon: "🍽️",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#667eea"
  },
  {
    id: 2,
    title: "Customize & Order",
    description: "Personalize your meal with dietary preferences, spice levels, and portion sizes to match your taste.",
    icon: "✨",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    color: "#f5576c"
  },
  {
    id: 3,
    title: "Enjoy Delivery",
    description: "Track your meal in real-time and enjoy hot, fresh food delivered right to your doorstep.",
    icon: "🚀",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    color: "#4facfe"
  }
];

const HowItWorksSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleSteps(prev => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -100px 0px' }
    );

    const elements = document.querySelectorAll('[data-step]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={sectionRef}
      component="section"
      sx={{
        position: 'relative',
        py: { xs: 8, md: 15 },
        px: { xs: 2, md: 4 },
        overflow: 'hidden',
        bgcolor: 'black',
        color: 'white',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Background Gradient Orbs */}
      <GlowOrb
        sx={{
          top: '-20%',
          left: '-10%',
          background: 'radial-gradient(circle, #667eea 0%, transparent 70%)',
          animation: `${pulseGlow} 8s ease-in-out infinite`,
        }}
      />
      <GlowOrb
        sx={{
          bottom: '-20%',
          right: '-10%',
          background: 'radial-gradient(circle, #f093fb 0%, transparent 70%)',
          animation: `${pulseGlow} 10s ease-in-out infinite reverse`,
        }}
      />
      <GlowOrb
        sx={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(79,172,254,0.15) 0%, transparent 80%)',
          animation: `${pulseGlow} 12s ease-in-out infinite`,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        {/* Header Section */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 12 } }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 600,
                letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.75rem',
                mb: 2,
                display: 'inline-block',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                pb: 1,
              }}
            >
              SIMPLE PROCESS
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                mb: 2,
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.1rem',
                maxWidth: '600px',
                mx: 'auto',
              }}
            >
              Three simple steps to your perfect meal experience
            </Typography>
          </Box>
        </Fade>

        {/* Steps Grid */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 6 }}
          justifyContent="center"
          alignItems="stretch"
        >
          {STEPS.map((step, index) => (
            <Box
              key={step.id}
              data-step
              data-index={index}
              sx={{
                flex: 1,
                opacity: visibleSteps.includes(index) ? 1 : 0,
                transform: visibleSteps.includes(index) ? 'translateY(0)' : 'translateY(40px)',
                transition: `all 0.6s cubic-bezier(0.23, 1, 0.32, 1) ${index * 0.15}s`,
              }}
            >
              <StepCard onMouseEnter={() => setHoveredStep(step.id)} onMouseLeave={() => setHoveredStep(null)}>
                {/* Glow Effect on Hover */}
                <Box
                  className="step-glow"
                  sx={{
                    position: 'absolute',
                    inset: '-20px',
                    background: step.gradient,
                    opacity: 0,
                    borderRadius: '50%',
                    filter: 'blur(40px)',
                    transition: 'opacity 0.4s ease',
                    pointerEvents: 'none',
                  }}
                />

                <Box
                  className="step-content"
                  sx={{
                    position: 'relative',
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    p: { xs: 3, md: 4 },
                    transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Icon with floating animation */}
                  <Box
                    sx={{
                      fontSize: '3.5rem',
                      mb: 3,
                      display: 'inline-block',
                      animation: hoveredStep === step.id ? `${float} 2s ease-in-out infinite` : 'none',
                    }}
                  >
                    {step.icon}
                  </Box>

                  {/* Step Number */}
                  <StepNumber>
                    0{step.id}
                  </StepNumber>

                  {/* Title */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                      mt: 2,
                      letterSpacing: '-0.01em',
                      background: step.gradient,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {step.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      lineHeight: 1.6,
                      mb: 2,
                    }}
                  >
                    {step.description}
                  </Typography>

                  {/* Decorative line */}
                  <Box
                    sx={{
                      width: '40px',
                      height: '2px',
                      background: step.gradient,
                      mt: 'auto',
                      transition: 'width 0.3s ease',
                      ...(hoveredStep === step.id && { width: '80px' }),
                    }}
                  />
                </Box>
              </StepCard>
            </Box>
          ))}
        </Stack>

        {/* Bottom CTA */}
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', mt: { xs: 6, md: 10 } }}>
            <Typography
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.875rem',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'color 0.3s ease',
                '&:hover': {
                  color: 'white',
                  '& svg': {
                    transform: 'translateX(5px)',
                  },
                },
              }}
            >
              Ready to start?
              <Box component="span" sx={{ transition: 'transform 0.3s ease' }}>
                →
              </Box>
            </Typography>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default HowItWorksSection;