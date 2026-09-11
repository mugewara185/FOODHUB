import { Box, Container, Grid } from "@mui/material";
import { Chip, Typography, Paper, InputBase, IconButton, Stack, useMediaQuery, useTheme } from "@mui/material";
import { Search, Restaurant, LocalOffer, AccessTime } from "@mui/icons-material";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/animations";
import { Skeleton } from "@mui/material";
import React from "react";

//types
type HeroProps = {
  heroImageLoaded: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  stats?: { label: string; value: number|string; suffix?: string; icon: React.ElementType }[];
};

const Hero = ({handleSearch, searchQuery, setSearchQuery, heroImageLoaded, stats}:HeroProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Default stats if not provided
  const defaultStats = [
    { label: "Restaurants", value: "100+", icon: Restaurant },
    { label: "Offers", value: "50+", icon: LocalOffer },
    { label: "Delivery Time", value: "30", suffix: "min", icon: AccessTime },
  ];

  const displayStats = stats || defaultStats;

  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        py: { xs: 3, sm: 4, md: 5 }, // Reduced vertical padding
        position: "relative",
        overflow: "hidden",
        minHeight: { xs: "auto", sm: "auto", md: "auto" }, // Remove full height
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&auto=format)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.08,
          zIndex: 0,
        },
        // Subtle gradient overlay
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(0,0,0,0.2) 0%, transparent 100%)",
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={{ xs: 2, md: 3 }} alignItems="center">
          {/* Left Content */}
          <Grid item xs={12} md={7}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Development Badge */}
              <motion.div variants={fadeInUp}>
                <Chip
                  label="⚡ Development Mode - _V_ Renderer"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{
                    mb: { xs: 1.5, sm: 2, md: 2.5 },
                    color: "white",
                    borderColor: "rgba(255,255,255,0.3)",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    backdropFilter: "blur(10px)",
                    height: { xs: 24, sm: 28 },
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  }}
                />
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeInUp}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "1.8rem", sm: "2.5rem", md: "3rem", lg: "3.5rem" },
                    fontWeight: 800,
                    mb: { xs: 1, sm: 1.5, md: 2 },
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Craving something{" "}
                  <Box 
                    component="span" 
                    sx={{ 
                      color: "secondary.main",
                      position: "relative",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        bgcolor: "secondary.main",
                        opacity: 0.3,
                        borderRadius: 2,
                      }
                    }}
                  >
                    delicious?
                  </Box>
                </Typography>
              </motion.div>

              {/* Subtitle */}
              <motion.div variants={fadeInUp}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: { xs: 2, sm: 2.5, md: 3 },
                    opacity: 0.9,
                    fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.25rem" },
                    fontWeight: 400,
                  }}
                >
                  Order food from the best restaurants near you
                </Typography>
              </motion.div>

              {/* Search Bar - More Compact */}
              <motion.div variants={fadeInUp}>
                <Paper
                  component="form"
                  onSubmit={handleSearch}
                  sx={{
                    p: "3px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 4,
                    bgcolor: "white",
                    maxWidth: { xs: "100%", sm: "90%", md: "80%" },
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    transition: "box-shadow 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
                    },
                  }}
                >
                  <InputBase
                    sx={{ 
                      ml: { xs: 1.5, sm: 2 }, 
                      flex: 1, 
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      py: { xs: 0.5, sm: 0.75 },
                      color: "text.primary",
                    }}
                    placeholder="Search for restaurants or dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <IconButton
                    type="submit"
                    sx={{
                      p: { xs: "8px", sm: "10px", md: "12px" },
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: 3,
                      mr: "3px",
                      "&:hover": {
                        bgcolor: "primary.dark",
                        transform: "scale(1.05)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Search sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </IconButton>
                </Paper>
              </motion.div>

              {/* Quick Stats - More Compact */}
              <motion.div variants={fadeInUp}>
                <Stack
                  direction="row"
                  spacing={{ xs: 2, sm: 3, md: 4 }}
                  sx={{ 
                    mt: { xs: 2.5, sm: 3, md: 4 }, 
                    flexWrap: "wrap", 
                    gap: { xs: 1, sm: 2 },
                    justifyContent: { xs: "center", sm: "flex-start" },
                  }}
                >
                  {displayStats.map((stat, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        textAlign: "center",
                        px: { xs: 1, sm: 2 },
                        py: { xs: 0.5, sm: 1 },
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.05)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        minWidth: { xs: "70px", sm: "80px" },
                      }}
                    >
                      <Stack 
                        direction="row" 
                        spacing={0.5} 
                        alignItems="center" 
                        justifyContent="center"
                      >
                        <stat.icon sx={{ 
                          fontSize: { xs: 18, sm: 22, md: 26 }, 
                          opacity: 0.9,
                          color: "secondary.light",
                        }} />
                        <Typography 
                          variant="h4" 
                          fontWeight={700}
                          sx={{
                            fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
                          }}
                        >
                          {stat.value}
                          {stat.suffix}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{ 
                          opacity: 0.8, 
                          mt: 0.25,
                          fontSize: { xs: "0.6rem", sm: "0.7rem" },
                          display: "block",
                          fontWeight: 500,
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </motion.div>
            </motion.div>
          </Grid>

          {/* Right Image - Hidden on Mobile, Smaller on Tablet */}
          <Grid 
            item 
            xs={12} 
            md={5} 
            sx={{ 
              display: { xs: "none", md: "block" },
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: { md: 400, lg: 500 },
                  ml: "auto",
                }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop"
                  alt="Food Delivery"
                  onLoad={() => setHeroImageLoaded(false)}
                  sx={{
                    width: "100%",
                    height: { md: 280, lg: 320 },
                    objectFit: "cover",
                    borderRadius: 4,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                    transform: "perspective(1000px) rotateY(-3deg)",
                    transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
                    "&:hover": {
                      transform: "perspective(1000px) rotateY(0deg) scale(1.02)",
                    },
                  }}
                />
                {/* Decorative element */}
                <Box
                  sx={{
                    position: "absolute",
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    bgcolor: "secondary.main",
                    opacity: 0.15,
                    filter: "blur(40px)",
                    zIndex: -1,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: -20,
                    left: -20,
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "primary.light",
                    opacity: 0.1,
                    filter: "blur(30px)",
                    zIndex: -1,
                  }}
                />
                {!heroImageLoaded && (
                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={320}
                    sx={{ borderRadius: 4 }}
                  />
                )}
              </Box>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Decorative Bottom Wave */}
      <Box
        sx={{
          position: "absolute",
          bottom: -2,
          left: 0,
          right: 0,
          height: { xs: 20, sm: 30, md: 40 },
          background: "linear-gradient(to bottom right, transparent 49%, #f5f7fa 50%)",
          zIndex: 1,
        }}
      />
    </Box>
  );
};

export default Hero;