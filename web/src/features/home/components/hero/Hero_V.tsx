import { Box, Container, Grid } from "@mui/material";
import { Chip, Typography, Paper, InputBase, IconButton, Stack } from "@mui/material";
import { Search } from "@mui/icons-material";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/animations";
// import { useState } from "react";
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
    // const {}=props;
  return (
    <Box
      sx={{
        bgcolor: "primary.main",
        color: "white",
        py: { xs: 4, md: 8 },
        position: "relative",
        overflow: "hidden",
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
          opacity: 0.1,
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <Chip
                  label="⚡ Development Mode - _V_ Renderer"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{
                    mb: 3,
                    color: "white",
                    borderColor: "rgba(255,255,255,0.3)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                  }}
                />
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: "2.5rem", md: "3.5rem" },
                    fontWeight: 800,
                    mb: 2,
                    lineHeight: 1.2,
                  }}
                >
                  Craving something{" "}
                  <Box component="span" sx={{ color: "secondary.main" }}>
                    delicious?
                  </Box>
                </Typography>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.95,
                    fontSize: { xs: "1.2rem", md: "1.5rem" },
                  }}
                >
                  Order food from the best restaurants near you
                </Typography>
              </motion.div>

              <motion.div variants={fadeInUp}>
                {/* Search Bar */}
                <Paper
                  component="form"
                  onSubmit={handleSearch}
                  sx={{
                    p: "4px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 5,
                    bgcolor: "white",
                    maxWidth: 600,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                  }}
                >
                  <InputBase
                    sx={{ ml: 2, flex: 1, fontSize: "1.1rem" }}
                    placeholder="Search for restaurants or dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <IconButton
                    type="submit"
                    sx={{
                      p: "12px",
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: 4,
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    }}
                  >
                    <Search />
                  </IconButton>
                </Paper>
              </motion.div>

              {/* Quick Stats */}
              <motion.div variants={fadeInUp}>
                <Stack
                  direction="row"
                  spacing={{ xs: 2, md: 4 }}
                  sx={{ mt: 5, flexWrap: "wrap", gap: 2 }}
                >
                  {stats.map((stat, index) => (
                    <Box key={index} sx={{ textAlign: "center" }}>
                      <Stack direction="row" spacing={1} alignItems="baseline">
                        <stat.icon sx={{ fontSize: 28, opacity: 0.9 }} />
                        <Typography variant="h3" fontWeight={700}>
                          {stat.value}
                          {stat.suffix}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.8, mt: 0.5 }}
                      >
                        {stat.label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </motion.div>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop"
                alt="Food Delivery"
                onLoad={() => setHeroImageLoaded(false)}
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  transform: "perspective(1000px) rotateY(-5deg)",
                  transition: "transform 0.3s ease",
                  "&:hover": {
                    transform: "perspective(1000px) rotateY(0deg)",
                  },
                }}
              />
              {!heroImageLoaded && (
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={400}
                  sx={{ borderRadius: 4 }}
                />
              )}
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Hero;
