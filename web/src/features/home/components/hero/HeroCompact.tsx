import React from "react";
import {
  Box,
  Container,
  Grid,
  Chip,
  Typography,
  Paper,
  InputBase,
  IconButton,
  Button,
  Stack,
  Skeleton,
  useTheme,
} from "@mui/material";
import { Search, Restaurant, LocalOffer, AccessTime, ArrowForward, RocketLaunch } from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { SafeImage } from "@/shared/components/ui/SafeImage";

export type HeroProps = {
  heroImageLoaded?: boolean;
  setHeroImageLoaded?: (loaded: boolean) => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  stats?: { label: string; value: number | string; suffix?: string; icon: React.ElementType }[];
  loading?: boolean;
  heroImage?: string;
  onBrowseAll?: () => void;
  defaultCardStyle?: 'legacy' | 'compact';
};

export const HeroCompact: React.FC<HeroProps> = ({
  handleSearch,
  searchQuery,
  setSearchQuery,
  heroImageLoaded = false,
  setHeroImageLoaded,
  stats,
  loading = false,
  heroImage,
  onBrowseAll,
  defaultCardStyle,
}) => {
  const theme = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const [cardStyle, setCardStyle] = React.useState<'legacy' | 'compact'>(() => {
    try {
      const saved = localStorage.getItem('foodhub_hero_card_style');
      if (saved === 'legacy' || saved === 'compact') return saved;
    } catch {}
    return defaultCardStyle || 'legacy';
  });

  const handleSwitchStyle = (style: 'legacy' | 'compact') => {
    setCardStyle(style);
    try {
      localStorage.setItem('foodhub_hero_card_style', style);
    } catch {}
  };

  const defaultStats = [
    { label: "Restaurants", value: "Curated", icon: Restaurant },
    { label: "Cuisines", value: "Diverse", icon: LocalOffer },
    { label: "Delivery", value: "Fast", icon: AccessTime },
  ];

  const displayStats = stats || defaultStats;

  // Reduced-motion variants
  const containerVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.12 },
        },
      };

  const itemVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
        },
      };

  return (
    <Box
      component="header"
      sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.primary.light} 100%)`,
        color: "white",
        pt: { xs: 3, sm: 4, md: 6 },
        pb: { xs: 4, sm: 5, md: 7 },
        position: "relative",
        overflow: "hidden",
        // Subtle decorative geometric scrim using local brand tokens (no third-party stock images)
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 40%), radial-gradient(circle at 10% 80%, rgba(0,0,0,0.15) 0%, transparent 45%)",
          zIndex: 0,
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
          {/* Left Content */}
          <Grid size={{ xs: 12, md: 7 }}>
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
              {/* Development Mode Badge */}
              <motion.div variants={itemVariants}>
                <Chip
                  label="⚡ Development Mode - _V_ Renderer"
                  size="small"
                  variant="outlined"
                  sx={{
                    mb: { xs: 1.5, sm: 2 },
                    color: "white",
                    borderColor: "rgba(255,255,255,0.35)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                    fontWeight: 600,
                    height: { xs: 24, sm: 28 },
                    fontSize: { xs: "0.68rem", sm: "0.75rem" },
                  }}
                />
              </motion.div>

              {/* Headline */}
              <motion.div variants={itemVariants}>
                <Typography
                  component="h1"
                  variant="h1"
                  sx={{
                    fontSize: { xs: "1.75rem", sm: "2.5rem", md: "3rem", lg: "3.25rem" },
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: "-0.025em",
                    mb: { xs: 1, sm: 1.5 },
                    textShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  }}
                >
                  Craving something{" "}
                  <Box
                    component="span"
                    sx={{
                      color: "#FFE082", // High-contrast warm accent on blue (contrast ratio > 6:1)
                      display: "inline-block",
                      position: "relative",
                    }}
                  >
                    delicious?
                  </Box>
                </Typography>
              </motion.div>

              {/* Subtitle */}
              <motion.div variants={itemVariants}>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: "0.95rem", sm: "1.1rem", md: "1.2rem" },
                    fontWeight: 400,
                    color: "rgba(255,255,255,0.92)",
                    maxWidth: 540,
                    lineHeight: 1.45,
                    mb: { xs: 2.5, sm: 3 },
                    textShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  Order freshly prepared food from curated local kitchens delivered fast to your door.
                </Typography>
              </motion.div>

              {/* Search Bar */}
              <motion.div variants={itemVariants}>
                <Paper
                  component="form"
                  onSubmit={handleSearch}
                  elevation={4}
                  sx={{
                    p: "4px",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 3,
                    bgcolor: "white",
                    maxWidth: { xs: "100%", sm: 520 },
                    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <InputBase
                    sx={{
                      ml: { xs: 1.5, sm: 2 },
                      flex: 1,
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      py: 0.75,
                      color: "text.primary",
                    }}
                    placeholder="Search restaurants, cuisines, dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    inputProps={{
                      "aria-label": "Search restaurants or dishes",
                    }}
                  />
                  <IconButton
                    type="submit"
                    aria-label="Search"
                    sx={{
                      p: { xs: 1, sm: 1.25 },
                      bgcolor: "primary.main",
                      color: "white",
                      borderRadius: 2.5,
                      minWidth: 44,
                      minHeight: 44, // WCAG 2.1 touch target
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <Search />
                  </IconButton>
                </Paper>
              </motion.div>

              {/* Secondary CTA & Quick Navigation */}
              <motion.div variants={itemVariants}>
                <Box sx={{ mt: 1.5, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                  {onBrowseAll && (
                    <Button
                      onClick={onBrowseAll}
                      size="small"
                      endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                      sx={{
                        color: "white",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        px: 1,
                        opacity: 0.95,
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.12)",
                          opacity: 1,
                        },
                      }}
                    >
                      Or browse all restaurants
                    </Button>
                  )}
                  <Button
                    component={RouterLink}
                    to="/showcase"
                    size="small"
                    startIcon={<RocketLaunch sx={{ fontSize: 16 }} />}
                    sx={{
                      color: "#38bdf8",
                      bgcolor: "rgba(56, 189, 248, 0.15)",
                      border: "1px solid rgba(56, 189, 248, 0.4)",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: { xs: "0.8rem", sm: "0.875rem" },
                      px: 1.5,
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "rgba(56, 189, 248, 0.28)",
                      },
                    }}
                  >
                    ⚡ Engineering Showcase
                  </Button>
                </Box>
              </motion.div>

              {/* Live Metric Chips */}
              <motion.div variants={itemVariants}>
                <Stack
                  direction="row"
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{
                    mt: { xs: 2.5, sm: 3 },
                    flexWrap: "wrap",
                    gap: { xs: 1, sm: 1.5 },
                  }}
                >
                  {displayStats.map((stat, index) => (
                    <Box
                      key={index}
                      sx={{
                        textAlign: "center",
                        px: { xs: 1.5, sm: 2 },
                        py: { xs: 0.75, sm: 1 },
                        borderRadius: 2.5,
                        bgcolor: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.16)",
                        minWidth: { xs: 75, sm: 90 },
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                        {Boolean(stat.icon) &&
                          (React.isValidElement(stat.icon)
                            ? stat.icon
                            : React.createElement(stat.icon, {
                                sx: {
                                  fontSize: { xs: 18, sm: 22 },
                                  color: "#FFE082",
                                },
                              }))}
                        {loading ? (
                          <Skeleton
                            variant="text"
                            width={32}
                            height={28}
                            sx={{ bgcolor: "rgba(255,255,255,0.25)" }}
                          />
                        ) : (
                          <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{
                              fontSize: { xs: "1.1rem", sm: "1.35rem" },
                              lineHeight: 1,
                            }}
                          >
                            {stat.value}
                            {stat.suffix}
                          </Typography>
                        )}
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{
                          opacity: 0.9,
                          mt: 0.5,
                          fontSize: { xs: "0.68rem", sm: "0.75rem" },
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

          {/* Right Hero Image (Desktop & Tablet) */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: { xs: "none", md: "block" },
            }}
          >
            {/* Visual Style Switcher */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1.5 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: "3px",
                  borderRadius: 3,
                  bgcolor: "rgba(0,0,0,0.28)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                }}
              >
                <Button
                  size="small"
                  onClick={() => handleSwitchStyle("legacy")}
                  sx={{
                    py: 0.35,
                    px: 1.5,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    borderRadius: 2.5,
                    textTransform: "none",
                    color: cardStyle === "legacy" ? "primary.main" : "rgba(255,255,255,0.9)",
                    bgcolor: cardStyle === "legacy" ? "white" : "transparent",
                    boxShadow: cardStyle === "legacy" ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: cardStyle === "legacy" ? "white" : "rgba(255,255,255,0.12)",
                    },
                  }}
                >
                  🍕 3D Gourmet (Legacy)
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSwitchStyle("compact")}
                  sx={{
                    py: 0.35,
                    px: 1.5,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    borderRadius: 2.5,
                    textTransform: "none",
                    color: cardStyle === "compact" ? "primary.main" : "rgba(255,255,255,0.9)",
                    bgcolor: cardStyle === "compact" ? "white" : "transparent",
                    boxShadow: cardStyle === "compact" ? "0 2px 8px rgba(0,0,0,0.2)" : "none",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: cardStyle === "compact" ? "white" : "rgba(255,255,255,0.12)",
                    },
                  }}
                >
                  🏬 Restaurant View
                </Button>
              </Box>
            </Box>

            {cardStyle === "legacy" ? (
              <motion.div
                key="legacy-3d"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, x: 50 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.7, type: "spring", bounce: 0.25 }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    maxWidth: { md: 400, lg: 440 },
                    ml: "auto",
                    perspective: "1000px",
                  }}
                >
                  <Box
                    component="img"
                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop"
                    alt="Delicious Gourmet Dish"
                    onLoad={() => setHeroImageLoaded?.(true)}
                    sx={{
                      width: "100%",
                      borderRadius: 4,
                      boxShadow: "0 22px 46px rgba(0,0,0,0.36)",
                      transform: "perspective(1000px) rotateY(-6deg) rotateX(2deg)",
                      transition: "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.35s ease",
                      display: "block",
                      cursor: "pointer",
                      "&:hover": {
                        transform: "perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1.02)",
                        boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
                      },
                    }}
                  />
                </Box>
              </motion.div>
            ) : (
              <motion.div
                key="compact-photo"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    maxWidth: { md: 380, lg: 440 },
                    aspectRatio: "4/3",
                    ml: "auto",
                    borderRadius: 4,
                    overflow: "hidden",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.32)",
                    border: "2px solid rgba(255,255,255,0.2)",
                    bgcolor: "rgba(0,0,0,0.15)",
                  }}
                >
                  <SafeImage
                    src={heroImage || ""}
                    alt="Featured culinary highlight"
                    loading="eager"
                    fetchPriority="high"
                    onLoad={() => setHeroImageLoaded?.(true)}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              </motion.div>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroCompact;