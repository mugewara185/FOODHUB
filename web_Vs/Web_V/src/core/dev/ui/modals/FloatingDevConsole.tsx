import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  Chip,
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  // Grid,
} from "@mui/material";
import {
  Settings,
  Info,
  Code,
  DataObject,
  Palette,
  WidgetsOutlined,
  Close,
  DragIndicator,
  RestartAlt,
} from "@mui/icons-material";
import type { Restaurant } from "@core/types";
import { useLogger } from "../../logger";

interface FloatingDevConsoleProps {
  allRestaurants: Record<string, unknown>[] | Restaurant[];
  featuredRestaurants: Record<string, unknown>[] | Restaurant[];
  loading: boolean;
  availableVersions: Record<string, string[]>;
  selectedVersions: Record<string, string>;
  cuisineLength: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`devpanel-${index}`}
      aria-labelledby={`devtab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const FloatingDevConsole: React.FC<FloatingDevConsoleProps> = ({
  allRestaurants,
  featuredRestaurants,
  loading,
  availableVersions,
  selectedVersions,
  cuisineLength,
}) => {
  //contexts
  const { open: LogConsoleOpen, setOpen: setLogConsoleOpen } = useLogger();
  //debounce click to prevent open from doubleclick
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DOUBLE_CLICK_DELAY = 300;

  // Constants for FAB dimensions
  const FAB_WIDTH = 56;
  const FAB_HEIGHT = 56;
  const DRAG_THRESHOLD = 5; // pixels
  const DEFAULT_OFFSET = 20; // pixels from bottom/right
  const defaultX = window.innerWidth - FAB_WIDTH - DEFAULT_OFFSET;
  const defaultY = window.innerHeight - FAB_HEIGHT - DEFAULT_OFFSET;
  const [isOpen, setIsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [position, setPosition] = useState({ x: defaultX, y: defaultY }); // Will be set after mount
  const dragDistance = useRef(0);
  const dragStartPos = useRef({ x: defaultX, y: defaultY });
  const fabRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Get default position (bottom right)
  const getDefaultPosition = () => {
    return {
      x: window.innerWidth - FAB_WIDTH - DEFAULT_OFFSET,
      y: window.innerHeight - FAB_HEIGHT - DEFAULT_OFFSET,
    };
  };

  // Load position from localStorage on mount or set to bottom right
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const savedPosition = localStorage.getItem("devConsolePosition");
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          // Validate and clamp the saved position
          const clampedX = Math.max(
            0,
            Math.min(parsed.x, window.innerWidth - FAB_WIDTH),
          );
          const clampedY = Math.max(
            0,
            Math.min(parsed.y, window.innerHeight - FAB_HEIGHT),
          );
          setPosition({ x: clampedX, y: clampedY });
        } catch (e) {
          console.error("Failed to parse saved position", e);
          localStorage.removeItem("devConsolePosition");
          setPosition(getDefaultPosition());
        }
      } else {
        // Set to bottom right by default
        setPosition(getDefaultPosition());
      }
    }
  }, []);

  // Handle window resize - keep FAB within bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const newX = Math.max(
          0,
          Math.min(prev.x, window.innerWidth - FAB_WIDTH),
        );
        const newY = Math.max(
          0,
          Math.min(prev.y, window.innerHeight - FAB_HEIGHT),
        );
        if (newX !== prev.x || newY !== prev.y) {
          return { x: newX, y: newY };
        }
        return prev;
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate bounds for dragging
  const getDragBounds = () => {
    return {
      left: 0,
      right: window.innerWidth - FAB_WIDTH,
      top: 0,
      bottom: window.innerHeight - FAB_HEIGHT,
    };
  };

  const handleDragStart = () => {
    dragStartPos.current = position;
    dragDistance.current = 0;
  };

  const handleDrag = (
    _: unknown,
    info: { offset: { x: number; y: number } },
  ) => {
    dragDistance.current = Math.sqrt(info.offset.x ** 2 + info.offset.y ** 2);
  };

  const handleDragEnd = (
    _: unknown,
    info: { point: { x: number; y: number } },
  ) => {
    // Get the bounds
    const bounds = getDragBounds();

    // Use the drag offset from motion
    const dragOffset = (info as any).offset;
    if (dragOffset) {
      let newX = position.x + dragOffset.x;
      let newY = position.y + dragOffset.y;

      // Apply bounds
      newX = Math.max(bounds.left, Math.min(newX, bounds.right));
      newY = Math.max(bounds.top, Math.min(newY, bounds.bottom));

      setPosition({ x: newX, y: newY });
      localStorage.setItem(
        "devConsolePosition",
        JSON.stringify({ x: newX, y: newY }),
      );
    }

    dragDistance.current = 0;
  };

  const handleFabClick = () => {
    // If a second click happens within delay → treat as double click → cancel
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      return;
    }
    // First click → wait to confirm it's not a double click
    clickTimeout.current = setTimeout(() => {
      // Only open modal if it wasn't actually dragged
      if (dragDistance.current < DRAG_THRESHOLD) {
        setIsOpen((prev) => !prev);
      }
      clickTimeout.current = null;
    }, DOUBLE_CLICK_DELAY);
  };

  const resetPosition = () => {
    const defaultPosition = getDefaultPosition();
    setPosition(defaultPosition);
    localStorage.setItem("devConsolePosition", JSON.stringify(defaultPosition));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      {/* Floating FAB Icon */}
      <motion.div
        ref={fabRef}
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={getDragBounds()}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: position.x, y: position.y }}
        initial={{ x: position.x, y: position.y }}
        transition={{ type: "just" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          cursor: "grab",
        }}
        whileDrag={{ cursor: "grabbing" }}
      >
        <Box
          onClick={handleFabClick}
          // onDoubleClick={resetPosition}
          onDoubleClick={() => setLogConsoleOpen(!LogConsoleOpen)}
          sx={{
            width: FAB_WIDTH,
            height: FAB_HEIGHT,
            borderRadius: "50%",
            bgcolor: "warning.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: 4,
            color: "white",
            transition: "all 0.2s ease",
            userSelect: "none",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: 6,
            },
            "&:active": {
              cursor: "grabbing",
            },
          }}
          role="button"
          tabIndex={0}
          title="Click to open console | Drag freely | Double-click to reset"
          onKeyDown={(e) => e.key === "Enter" && handleFabClick()}
        >
          <Stack alignItems="center" spacing={0.5}>
            <Code fontSize="small" sx={{ cursor: "grab" }} />
            <DragIndicator sx={{ fontSize: 10, opacity: 0.7 }} />
          </Stack>
        </Box>
      </motion.div>

      {/* Modal Dialog */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: "2px solid",
            borderColor: "warning.main",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "warning.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 700,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Settings fontSize="small" />
            <span>DEV CONSOLE - Core/Dev Framework</span>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAlt fontSize="small" />}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.5)",
                fontSize: "0.75rem",
              }}
              onClick={resetPosition}
            >
              Reset Position
            </Button>
            <IconButton
              onClick={() => setIsOpen(false)}
              sx={{ color: "white" }}
              size="small"
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="📊 State Overview" id="devtab-0" />
              <Tab label="🎨 Component Versions" id="devtab-1" />
              <Tab label="⚙️ Redux Store" id="devtab-2" />
              <Tab label="📱 Framework Info" id="devtab-3" />
            </Tabs>
          </Box>

          {/* State Overview */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 2,
                }}
              >
                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <DataObject color="primary" fontSize="small" />
                      <Typography variant="caption" color="text.secondary">
                        Restaurants
                      </Typography>
                    </Stack>
                    <Typography variant="h4">
                      {allRestaurants.length}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={loading ? "warning.main" : "success.main"}
                    >
                      {loading ? "Loading..." : "Ready"}
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <WidgetsOutlined color="primary" fontSize="small" />
                      <Typography variant="caption" color="text.secondary">
                        Featured
                      </Typography>
                    </Stack>
                    <Typography variant="h4">
                      {featuredRestaurants.length}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      Ready
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Palette color="primary" fontSize="small" />
                      <Typography variant="caption" color="text.secondary">
                        Cuisines
                      </Typography>
                    </Stack>
                    <Typography variant="h4">{cuisineLength}</Typography>
                    <Typography variant="caption" color="success.main">
                      Loaded
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Info color="primary" fontSize="small" />
                      <Typography variant="caption" color="text.secondary">
                        Version
                      </Typography>
                    </Stack>
                    <Typography variant="h4">V2</Typography>
                    <Typography variant="caption" color="info.main">
                      Developer
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>

          {/* Component Versions */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Alert
                icon={<Info fontSize="small" />}
                severity="info"
                sx={{ mb: 2 }}
              >
                Click the developer icon in the top toolbar to switch between
                component versions dynamically.
              </Alert>

              {Object.keys(availableVersions).length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "action.hover" }}>
                      <TableRow>
                        <TableCell>
                          <strong>Page</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Available Versions</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Active</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(availableVersions).map(
                        ([pageKey, versions]) => (
                          <TableRow key={pageKey}>
                            <TableCell>
                              <Chip
                                label={pageKey}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Stack
                                direction="row"
                                spacing={0.5}
                                flexWrap="wrap"
                              >
                                {versions.map((v) => (
                                  <Chip
                                    key={v}
                                    label={v}
                                    size="small"
                                    color={
                                      selectedVersions[pageKey] === v
                                        ? "primary"
                                        : "default"
                                    }
                                    variant={
                                      selectedVersions[pageKey] === v
                                        ? "filled"
                                        : "outlined"
                                    }
                                  />
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={selectedVersions[pageKey] || versions[0]}
                                size="small"
                                color="success"
                              />
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No swappable components registered. Ensure DevVersionRenderer
                  wraps your pages.
                </Alert>
              )}
            </Box>
          </TabPanel>

          {/* Redux Store Info */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Restaurant State
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "grey.100",
                      p: 2,
                      borderRadius: 1,
                      overflow: "auto",
                      fontSize: "0.75rem",
                      maxHeight: 300,
                    }}
                  >
                    {JSON.stringify(
                      {
                        allRestaurants: allRestaurants.length,
                        featuredRestaurants: featuredRestaurants.length,
                        loading: loading,
                        sample: allRestaurants[0] || null,
                      },
                      null,
                      2,
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          {/* Framework Info */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 2,
                }}
              >
                <Card>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      gutterBottom
                    >
                      ✨ Core/Dev Features
                    </Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <li>DevVersionRenderer - Hot swap components</li>
                      <li>DevContext - State management for versions</li>
                      <li>DevVersionSwitcher - UI control menu</li>
                      <li>DevErrorBoundary - Error recovery</li>
                      <li>ComponentPlayground - Isolated testing</li>
                      <li>LocalStorage persistence - Survives reloads</li>
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      gutterBottom
                    >
                      🎯 Use Cases
                    </Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                      <li>A/B Testing variants</li>
                      <li>Progressive feature rollout</li>
                      <li>Design system exploration</li>
                      <li>Performance comparisons</li>
                      <li>User feedback testing</li>
                      <li>Rapid iteration & prototyping</li>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingDevConsole;
