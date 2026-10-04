import { ConfigurationInspector } from '../components/ConfigurationInspector';
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
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
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
import { buildFactorySeedPayload, type FactorySeedTarget } from "@/core/dev/utils/factorySeed";
import { FloatingTrigger } from "../../../ui/buttons/FloatingTrigger";
import { appConfig } from "../../../config/app.config";

interface FloatingDevConsoleProps {
  allRestaurants: Record<string, unknown>[] | Restaurant[];
  featuredRestaurants: Record<string, unknown>[] | Restaurant[];
  loading: boolean;
  availableVersions: Record<string, string[]>;
  selectedVersions: Record<string, string>;
  cuisineLength: number;
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`devpanel-${index}`} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

const ALL_TARGETS: FactorySeedTarget[] = [
  "users",
  "deliveryPartners",
  "restaurants",
  "foodItems",
  "orders",
  "deliveries",
  "reviews",
  "notifications",
];

const PRESETS = {
  minimal: {
    users: 10,
    deliveryPartners: 2,
    restaurants: 3,
    foodItems: 15,
    orders: 10,
    deliveries: 5,
    reviews: 5,
    notifications: 10,
    roles: { admin: 1, owner: 3, partner: 2 }
  },
  development: {
    users: 100,
    deliveryPartners: 12,
    restaurants: 8,
    foodItems: 50,
    orders: 150,
    deliveries: 90,
    reviews: 50,
    notifications: 20,
    roles: { admin: 2, owner: 8, partner: 12 }
  },
  stress: {
    users: 1000,
    deliveryPartners: 50,
    restaurants: 20,
    foodItems: 200,
    orders: 1000,
    deliveries: 800,
    reviews: 500,
    notifications: 200,
    roles: { admin: 5, owner: 20, partner: 50 }
  }
};

const FloatingDevConsole: React.FC<FloatingDevConsoleProps> = ({
  allRestaurants,
  featuredRestaurants,
  loading: restLoading,
  availableVersions,
  selectedVersions,
  cuisineLength,
}) => {
  const { open: _logConsoleOpen, setOpen: _setLogConsoleOpen } = useLogger();
  const [isOpen, setIsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const [mode, setMode] = useState<"append" | "replace">("append");
  const [selectedTargets, setSelectedTargets] = useState<FactorySeedTarget[]>(ALL_TARGETS);
  
  const [counts, setCounts] = useState<Record<string, number>>(PRESETS.development);
  const [roles, setRoles] = useState<Record<string, number>>(PRESETS.development.roles);

  const [seedStatus, setSeedStatus] = useState<{
    loading: boolean;
    message: string | null;
    error: string | null;
    seeded?: Record<string, any>;
    warnings?: string[];
    durationMs?: number;
  }>({ loading: false, message: null, error: null });

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const p = PRESETS[presetKey];
    setCounts({ ...p });
    setRoles({ ...p.roles });
    setSelectedTargets(ALL_TARGETS);
  };

  const handleSeed = async () => {
    // Validation
    if (counts.users < (roles.admin + roles.owner + roles.partner)) {
      setSeedStatus({ loading: false, message: null, error: "Total users must be >= sum of assigned roles." });
      return;
    }

    setSeedStatus({ loading: true, message: "Generating Dataset Payload...", error: null });
    
    try {
      // 1. Build Payload
      const payload = buildFactorySeedPayload(counts.restaurants, {
        targets: selectedTargets,
        mode,
        config: {
          users: { 
            count: counts.users,
            roleDistribution: { admin: roles.admin, owner: roles.owner, partner: roles.partner }
          },
          deliveryPartners: { count: counts.deliveryPartners },
          restaurants: { count: counts.restaurants },
          foodItems: { count: counts.foodItems },
          orders: { count: counts.orders },
          deliveries: { count: counts.deliveries },
          reviews: { count: counts.reviews },
          notifications: { count: counts.notifications },
        },
      });

      // 2. Execute
      const apiBaseUrl = appConfig.api.baseUrl;
      const response = await fetch(`${apiBaseUrl}/dev/seed-factory-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || "The seed request failed.");

      // 3. Results
      setSeedStatus({
        loading: false,
        message: result?.message || "Seed completed.",
        error: null,
        seeded: result.data?.seeded,
        warnings: result.data?.warnings,
        durationMs: result.data?.durationMs,
      });
    } catch (error) {
      setSeedStatus({
        loading: false,
        message: null,
        error: error instanceof Error ? error.message : "Unable to seed factory data.",
      });
    }
  };

  const resetPosition = () => {
    localStorage.setItem("devConsolePosition", JSON.stringify({ x: window.innerWidth - 76, y: window.innerHeight - 76 }));
    window.location.reload();
  };

  return (
    <>
      <FloatingTrigger
        icon={<Code fontSize="small" sx={{ cursor: "grab" }} />}
        storageKey="devConsolePosition"
        onClick={() => setIsOpen(true)}
        onDoubleClick={() => _setLogConsoleOpen(!_logConsoleOpen)}
        color="warning.main"
        title="Dev Console"
      />

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2, border: "2px solid", borderColor: "warning.main" } }}>
        <DialogTitle sx={{ bgcolor: "warning.main", color: "white", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Settings fontSize="small" /><span>DEV CONSOLE</span>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" color={appConfig.api.dataSource === 'api' ? 'success' : 'secondary'} onClick={() => { localStorage.setItem('DEV_DATA_SOURCE', appConfig.api.dataSource === 'api' ? 'mock' : 'api'); window.location.reload(); }} sx={{ boxShadow: 'none' }}>
              {appConfig.api.dataSource === 'api' ? 'API Mode' : 'Mock Mode'}
            </Button>
            <IconButton onClick={() => setIsOpen(false)} sx={{ color: "white" }} size="small"><Close /></IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0, minHeight: '600px' }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)}>
              <Tab label="🌱 Data Platform & Factory" id="devtab-0" />
              <Tab label="📊 Store & Config" id="devtab-1" />
              <Tab label="🎨 UI Versions" id="devtab-2" />
            </Tabs>
          </Box>

          {/* TAB 0: Data Factory */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3, display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Left Column: Configuration */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>Dataset Configuration</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Button size="small" variant="outlined" onClick={() => applyPreset('minimal')}>Minimal</Button>
                  <Button size="small" variant="outlined" onClick={() => applyPreset('development')}>Development</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => applyPreset('stress')}>Stress</Button>
                </Stack>

                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend" sx={{ fontWeight: 'bold' }}>Seed Mode</FormLabel>
                  <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value as any)}>
                    <FormControlLabel value="append" control={<Radio size="small" />} label="Append (Add to existing data)" />
                    <FormControlLabel value="replace" control={<Radio size="small" color="error" />} label="Replace (Delete target collections first)" />
                  </RadioGroup>
                </FormControl>

                <Typography variant="subtitle2" fontWeight={700} gutterBottom>Targets & Counts</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 3 }}>
                  {ALL_TARGETS.map(t => (
                    <Stack direction="row" alignItems="center" key={t}>
                      <FormControlLabel
                        control={<Checkbox size="small" checked={selectedTargets.includes(t)} onChange={() => setSelectedTargets(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} />}
                        label={t.replace(/([A-Z])/g, " $1").replace(/^./, (v) => v.toUpperCase())}
                        sx={{ minWidth: 150 }}
                      />
                      <TextField 
                        size="small" type="number" 
                        value={counts[t] || 0} 
                        onChange={(e) => setCounts({...counts, [t]: Math.max(0, parseInt(e.target.value)||0)})}
                        disabled={!selectedTargets.includes(t)}
                        sx={{ width: 80 }}
                        InputProps={{ sx: { height: 32 } }}
                      />
                    </Stack>
                  ))}
                </Box>

                <Typography variant="subtitle2" fontWeight={700} gutterBottom>User Role Distribution (Applies to Users)</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  Note: DeliveryPartners and Restaurants are separate domains that reference users with 'partner' and 'owner' roles. The factory will ensure relationships are strictly valid.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                  {['admin', 'owner', 'partner'].map(r => (
                     <TextField 
                       key={r} size="small" type="number" label={r}
                       value={roles[r] || 0}
                       onChange={(e) => setRoles({...roles, [r]: Math.max(0, parseInt(e.target.value)||0)})}
                       sx={{ width: 80 }}
                       disabled={!selectedTargets.includes('users')}
                       InputProps={{ sx: { height: 32 } }}
                     />
                  ))}
                  <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Remaining ({Math.max(0, counts.users - roles.admin - roles.owner - roles.partner)}) → normal users
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Right Column: Preview & Execution */}
              <Box sx={{ width: { xs: '100%', md: '400px' } }}>
                <Card variant="outlined" sx={{ bgcolor: 'grey.50', mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom>Preview & Execution</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={0.5} sx={{ mb: 2 }}>
                       {ALL_TARGETS.filter(t => selectedTargets.includes(t)).map(t => (
                         <Box key={t} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                           <Typography variant="body2">{t}</Typography>
                           <Typography variant="body2" fontWeight="bold">{counts[t]}</Typography>
                         </Box>
                       ))}
                    </Stack>
                    
                    <Alert severity={mode === 'replace' ? 'error' : 'info'} sx={{ mb: 2, py: 0 }}>
                      {mode === 'replace' ? 'DESTRUCTIVE: Selected collections will be wiped!' : 'Safe Append: Existing data is preserved.'}
                    </Alert>

                    <Button variant="contained" color={mode === 'replace' ? 'error' : 'primary'} fullWidth onClick={handleSeed} disabled={seedStatus.loading || selectedTargets.length === 0}>
                      {seedStatus.loading ? "Executing Factory..." : `Execute ${mode === 'replace' ? 'Replace' : 'Append'} Seed`}
                    </Button>
                  </CardContent>
                </Card>

                {seedStatus.message && (
                  <Card variant="outlined" sx={{ borderColor: seedStatus.error ? 'error.main' : 'success.main' }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Seed Results
                      </Typography>
                      {seedStatus.error ? (
                        <Typography variant="body2" color="error">{seedStatus.error}</Typography>
                      ) : (
                        <>
                          {seedStatus.seeded && (
                             <Table size="small" sx={{ mb: 2 }}>
                               <TableHead>
                                 <TableRow>
                                   <TableCell sx={{ p: 0.5 }}>Collection</TableCell>
                                   <TableCell align="right" sx={{ p: 0.5 }}>Req</TableCell>
                                   <TableCell align="right" sx={{ p: 0.5 }}>Ins</TableCell>
                                   <TableCell align="right" sx={{ p: 0.5 }}>Skip</TableCell>
                                   <TableCell align="right" sx={{ p: 0.5 }}>Fail</TableCell>
                                 </TableRow>
                               </TableHead>
                               <TableBody>
                                 {Object.entries(seedStatus.seeded).map(([col, stats]: [string, any]) => (
                                   <TableRow key={col}>
                                     <TableCell sx={{ p: 0.5 }}><Typography variant="body2">{col}</Typography></TableCell>
                                     <TableCell align="right" sx={{ p: 0.5 }}>{stats.requested}</TableCell>
                                     <TableCell align="right" sx={{ p: 0.5 }}>
                                       <Typography variant="body2" color={stats.inserted < stats.requested && stats.failed > 0 ? 'warning.main' : 'success.main'}>{stats.inserted}</Typography>
                                     </TableCell>
                                     <TableCell align="right" sx={{ p: 0.5 }}>
                                       <Typography variant="body2" color={stats.skipped > 0 ? 'info.main' : 'text.secondary'}>{stats.skipped || 0}</Typography>
                                     </TableCell>
                                     <TableCell align="right" sx={{ p: 0.5 }}>
                                        <Typography variant="body2" color={stats.failed > 0 ? 'error.main' : 'text.secondary'}>{stats.failed}</Typography>
                                     </TableCell>
                                   </TableRow>
                                 ))}
                               </TableBody>
                             </Table>
                          )}
                          <Typography variant="caption" color="text.secondary">Completed in {seedStatus.durationMs}ms</Typography>
                          {seedStatus.warnings?.map((w, i) => (
                            <Typography key={i} variant="caption" display="block" color="warning.dark">⚠ {w}</Typography>
                          ))}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
             <Box sx={{ p: 3 }}>
                <ConfigurationInspector />
             </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography>Component Variants (Placeholder)</Typography>
            </Box>
          </TabPanel>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingDevConsole;

