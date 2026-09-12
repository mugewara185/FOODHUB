import React, { useState } from "react";
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
  Checkbox,
  FormControlLabel,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
} from "@mui/material";
import {
  Settings,
  Info,
  Code,
  DataObject,
  Palette,
  WidgetsOutlined,
  Close,
  RestartAlt,
} from "@mui/icons-material";
import type { Restaurant } from "@core/types";
import { useLogger } from "../../logger";
import { buildFactorySeedPayload, type FactorySeedTarget } from "../../utils/factorySeed";
import { FloatingTrigger } from "../../../ui/floating/FloatingTrigger";

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
  const { open: _logConsoleOpen, setOpen: _setLogConsoleOpen } = useLogger();
  const [isOpen, setIsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [seedStatus, setSeedStatus] = useState<{ loading: boolean; message: string | null; error: string | null }>({
    loading: false,
    message: null,
    error: null,
  });
  const [selectedSeedTargets, setSelectedSeedTargets] = useState<FactorySeedTarget[]>([
    "restaurants",
    "foodItems",
    "users",
    "orders",
    "reviews",
  ]);

  const [seedCounts, setSeedCounts] = useState<Record<FactorySeedTarget, number>>({
    restaurants: 12,
    foodItems: 50,
    users: 20,
    orders: 40,
    reviews: 30,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSeedTargetToggle = (target: FactorySeedTarget) => {
    setSelectedSeedTargets((prev) =>
      prev.includes(target) ? prev.filter((item) => item !== target) : [...prev, target]
    );
  };

  const handleCountChange = (target: FactorySeedTarget, value: string) => {
    const count = parseInt(value, 10);
    setSeedCounts((prev) => ({
      ...prev,
      [target]: isNaN(count) ? 0 : count,
    }));
  };

  const handleSeedFactoryData = async () => {
    setSeedStatus({ loading: true, message: "Generating factory-based demo data...", error: null });

    try {
      const payload = buildFactorySeedPayload(seedCounts.restaurants, {
        targets: selectedSeedTargets,
        config: {
          restaurants: { count: seedCounts.restaurants },
          foodItems: { count: seedCounts.foodItems },
          users: { count: seedCounts.users, includeTestAccounts: true },
          orders: { count: seedCounts.orders },
          reviews: { count: seedCounts.reviews },
        }
      });
      
      const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiBaseUrl}/dev/seed-factory-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.message || "The seed request failed.");
      }

      const seededCounts = result.data || {};
      const summary = Object.entries(seededCounts)
        .map(([model, count]) => `${count} ${model}s`)
        .filter((item) => !item.startsWith("0 "));

      setSeedStatus({
        loading: false,
        message: `${result?.message || "Factory data seeded successfully."} (${summary.join(" / ")})`,
        error: null,
      });
    } catch (error) {
      setSeedStatus({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : "Unable to seed factory data right now.",
      });
    }
  };

  const resetPosition = () => {
    const defaultPosition = {
      x: window.innerWidth - 56 - 20,
      y: window.innerHeight - 56 - 20,
    };
    localStorage.setItem("devConsolePosition", JSON.stringify(defaultPosition));
    // Provide a small visual cue or just force reload position by interacting with state if needed.
    // FloatingTrigger handles its own internal position state based on local storage, 
    // so forcing a re-render or letting the user drag again works.
    window.location.reload(); // Simple solution for dev console reset
  };

  return (
    <>
      <FloatingTrigger
        icon={<Code fontSize="small" sx={{ cursor: "grab" }} />}
        storageKey="devConsolePosition"
        onClick={() => setIsOpen(true)}
        onDoubleClick={() => _setLogConsoleOpen(!_logConsoleOpen)}
        color="warning.main"
        title="Click to open console | Drag freely | Double-click to reset"
      />

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

              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Seed demo data from factories
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Push the generated factory data into MongoDB so you can prototype against realistic records immediately.
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                    {(["restaurants", "foodItems", "users", "orders", "reviews"] as FactorySeedTarget[]).map((target) => (
                      <Stack direction="row" alignItems="center" spacing={1} key={target} sx={{ minWidth: 200, mb: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedSeedTargets.includes(target)}
                              onChange={() => handleSeedTargetToggle(target)}
                              size="small"
                            />
                          }
                          label={target.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())}
                          sx={{ m: 0, minWidth: 120 }}
                        />
                        <TextField
                          type="number"
                          size="small"
                          label="Count"
                          value={seedCounts[target]}
                          onChange={(e) => handleCountChange(target, e.target.value)}
                          disabled={!selectedSeedTargets.includes(target)}
                          sx={{ width: 80 }}
                          InputProps={{ inputProps: { min: 0, max: 10000 } }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleSeedFactoryData}
                      disabled={seedStatus.loading || selectedSeedTargets.length === 0}
                    >
                      {seedStatus.loading ? "Seeding..." : "Seed factory data"}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      This is intended for local development and demo work.
                    </Typography>
                  </Stack>
                  {seedStatus.message && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      {seedStatus.message}
                    </Alert>
                  )}
                  {seedStatus.error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {seedStatus.error}
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

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
