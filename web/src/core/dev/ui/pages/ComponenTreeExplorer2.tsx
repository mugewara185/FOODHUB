import React, { useState, useMemo, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    Card,
    CardContent,
    Divider,
    Chip,
    Grid,
    TextField,
    InputAdornment,
    IconButton,
    Badge,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    LinearProgress,
    Table,
    TableBody,
    TableRow,
    TableCell,
    alpha,
    useTheme,
    Zoom,
    Fade,
    Button,
    Stack,
    Alert,
    Rating,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ChevronRight as ChevronRightIcon,
    Code as CodeIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Refresh as RefreshIcon,
    Timeline as TimelineIcon,
    Memory as MemoryIcon,
    Speed as SpeedIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    FiberManualRecord as FiberManualRecordIcon,
    Layers as LayersIcon,
    AccountTree as AccountTreeIcon,
    BubbleChart as BubbleChartIcon,
    Store as StoreIcon,
    Api as ApiIcon,
    Http as HttpIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { componentTree, type ComponentNode } from '../mockData';

// Enhanced mock data with more metrics
const enhancedComponentTree = {
    ...componentTree,
    metrics: {
        totalComponents: 42,
        avgRenderTime: 2.4,
        slowestComponent: 'RestaurantCard',
        reRenderCount: 156,
        performanceScore: 87,
    }
};

const ComponentTreeExplorer2: React.FC = () => {
    const theme = useTheme();
    const [selectedNode, setSelectedNode] = useState<ComponentNode | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'tree' | 'graph'>('tree');
    const [showMetrics, setShowMetrics] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
        // Auto-expand first 2 levels by default
        const autoExpand: Record<string, boolean> = {};
        const expandLevels = (node: ComponentNode, depth: number) => {
            if (depth <= 2) {
                autoExpand[node.id] = true;
                node.children?.forEach(child => expandLevels(child, depth + 1));
            }
        };
        expandLevels(componentTree, 0);
        return autoExpand;
    });

    // Filter tree based on search
    const filteredTree = useMemo(() => {
        if (!searchTerm) return componentTree;

        const filterNodes = (node: ComponentNode): ComponentNode | null => {
            const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                node.type.toLowerCase().includes(searchTerm.toLowerCase());
            const filteredChildren = node.children
                ?.map(child => filterNodes(child))
                .filter((child): child is ComponentNode => child !== null) || [];

            if (matchesSearch || filteredChildren.length > 0) {
                // Auto-expand matching nodes
                if (!expandedNodes[node.id]) {
                    setExpandedNodes(prev => ({ ...prev, [node.id]: true }));
                }
                return { ...node, children: filteredChildren };
            }
            return null;
        };

        const result = filterNodes(componentTree);
        return result || componentTree;
    }, [searchTerm, expandedNodes]);

    const handleSelect = useCallback((nodeId: string) => {
        const findNode = (node: ComponentNode, id: string): ComponentNode | null => {
            if (node.id === id) return node;
            if (node.children) {
                for (const child of node.children) {
                    const found = findNode(child, id);
                    if (found) return found;
                }
            }
            return null;
        };
        const node = findNode(componentTree, nodeId);
        setSelectedNode(node);
    }, []);

    const handleToggleExpand = useCallback((nodeId: string, event: React.MouseEvent) => {
        event.stopPropagation();
        setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    }, []);

    const expandAll = useCallback(() => {
        const expandAllNodes = (node: ComponentNode) => {
            setExpandedNodes(prev => ({ ...prev, [node.id]: true }));
            node.children?.forEach(expandAllNodes);
        };
        expandAllNodes(componentTree);
    }, []);

    const collapseAll = useCallback(() => {
        setExpandedNodes({});
    }, []);

    const getPerformanceColor = (renderTime: number) => {
        if (renderTime < 10) return 'success';
        if (renderTime < 50) return 'warning';
        return 'error';
    };

    const getPerformanceIcon = (renderTime: number) => {
        if (renderTime < 10) return <CheckCircleIcon fontSize="small" />;
        if (renderTime < 50) return <SpeedIcon fontSize="small" />;
        return <WarningIcon fontSize="small" />;
    };

    const renderTree = (nodes: ComponentNode, depth: number = 0) => {
        const hasChildren = Array.isArray(nodes.children) && nodes.children.length > 0;
        const isExpanded = !!expandedNodes[nodes.id];
        const isSelected = selectedNode?.id === nodes.id;
        const performanceLevel = getPerformanceColor(nodes.renderTime || 0);

        return (
            <Box key={nodes.id}>
                <ListItemButton
                    selected={isSelected}
                    onClick={() => handleSelect(nodes.id)}
                    sx={{
                        pl: depth * 2,
                        py: 1,
                        borderRadius: 1,
                        mb: 0.5,
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                        },
                    }}
                >
                    <Box
                        sx={{
                            width: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: hasChildren ? 'pointer' : 'default',
                        }}
                        onClick={(e) => hasChildren && handleToggleExpand(nodes.id, e)}
                    >
                        {hasChildren && (
                            isExpanded
                                ? <ExpandMoreIcon fontSize="small" color="action" />
                                : <ChevronRightIcon fontSize="small" color="action" />
                        )}
                    </Box>

                    <Box sx={{ position: 'relative' }}>
                        <CodeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        {nodes.renderCount && nodes.renderCount > 10 && (
                            <Badge
                                badgeContent={nodes.renderCount}
                                color="warning"
                                sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.6rem',
                                        height: 16,
                                        minWidth: 16,
                                    }
                                }}
                            />
                        )}
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, flex: 1 }}>
                        {nodes.name}
                    </Typography>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                        {nodes.renderTime && (
                            <Tooltip title={`Render time: ${nodes.renderTime}ms`}>
                                <Chip
                                    icon={getPerformanceIcon(nodes.renderTime)}
                                    label={`${nodes.renderTime}ms`}
                                    size="small"
                                    color={performanceLevel}
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                            </Tooltip>
                        )}

                        <Chip
                            label={nodes.type}
                            size="small"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                            color={
                                nodes.type === 'provider' ? 'secondary' :
                                    nodes.type === 'feature' ? 'primary' :
                                        nodes.type === 'ui' ? 'success' : 'default'
                            }
                        />
                    </Stack>
                </ListItemButton>

                {hasChildren && (
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            {nodes.children!.map((node) => renderTree(node, depth + 1))}
                        </List>
                    </Collapse>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ height: '100%', p: 3 }}>
            {/* Header with Stats */}
            <Paper sx={{ p: 3, mb: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h4" fontWeight={800} gutterBottom>
                            Component Tree Explorer
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Inspect React component hierarchy, analyze performance, and debug render cycles in real-time
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Expand All">
                            <IconButton onClick={expandAll} size="small">
                                <LayersIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Collapse All">
                            <IconButton onClick={collapseAll} size="small">
                                <AccountTreeIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Refresh Metrics">
                            <IconButton size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                {/* Performance Metrics Bar */}
                {showMetrics && (
                    <Fade in={showMetrics}>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <BubbleChartIcon color="primary" fontSize="small" />
                                            <Typography variant="caption" color="text.secondary">Total Components</Typography>
                                            <Typography variant="h6" sx={{ ml: 'auto' }}>42</Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <TimelineIcon color="warning" fontSize="small" />
                                            <Typography variant="caption" color="text.secondary">Avg Render Time</Typography>
                                            <Typography variant="h6" sx={{ ml: 'auto' }}>2.4ms</Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <MemoryIcon color="info" fontSize="small" />
                                            <Typography variant="caption" color="text.secondary">Total Re-renders</Typography>
                                            <Typography variant="h6" sx={{ ml: 'auto' }}>156</Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card variant="outlined" sx={{ bgcolor: 'background.paper' }}>
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <SpeedIcon color="success" fontSize="small" />
                                            <Typography variant="caption" color="text.secondary">Performance Score</Typography>
                                            <Typography variant="h6" sx={{ ml: 'auto' }}>87/100</Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Fade>
                )}
            </Paper>

            {/* Controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                    <TextField
                        placeholder="Search components..."
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flex: 1, minWidth: 200 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, value) => value && setViewMode(value)}
                        size="small"
                    >
                        <ToggleButton value="tree">
                            <AccountTreeIcon fontSize="small" sx={{ mr: 1 }} />
                            Tree View
                        </ToggleButton>
                        <ToggleButton value="graph" disabled>
                            <BubbleChartIcon fontSize="small" sx={{ mr: 1 }} />
                            Graph View (Beta)
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Tooltip title={showMetrics ? "Hide Metrics" : "Show Metrics"}>
                        <IconButton onClick={() => setShowMetrics(!showMetrics)} size="small">
                            {showMetrics ? <VisibilityIcon /> : <VisibilityOffIcon />}
                        </IconButton>
                    </Tooltip>
                </Stack>

                {searchTerm && (
                    <Alert severity="info" sx={{ mt: 2 }} icon={<SearchIcon />}>
                        Found components matching "{searchTerm}"
                    </Alert>
                )}
            </Paper>

            {/* Main Content */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 'calc(100vh - 350px)', overflow: 'auto', position: 'relative' }}>
                        <Typography variant="subtitle2" sx={{ mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                            📁 COMPONENT HIERARCHY
                            <Chip label="Live" size="small" color="success" sx={{ ml: 1 }} />
                        </Typography>

                        <List component="nav" disablePadding>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={searchTerm}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    {renderTree(filteredTree)}
                                </motion.div>
                            </AnimatePresence>
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <AnimatePresence mode="wait">
                        {selectedNode ? (
                            <motion.div
                                key={selectedNode.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card sx={{ height: 'calc(100vh - 350px)', overflow: 'auto' }}>
                                    <CardContent>
                                        {/* Component Header */}
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h5" color="primary" fontWeight={700} gutterBottom>
                                                &lt;{selectedNode.name} /&gt;
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Component Details & Performance Metrics
                                            </Typography>
                                        </Box>

                                        {/* Metrics Chips */}
                                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                                            <Chip
                                                icon={<CodeIcon />}
                                                label={`Type: ${selectedNode.type}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                            <Chip
                                                icon={<TimelineIcon />}
                                                label={`Renders: ${selectedNode.renderCount || 0}`}
                                                size="small"
                                                variant="outlined"
                                                color={selectedNode.renderCount && selectedNode.renderCount > 10 ? 'warning' : 'default'}
                                            />
                                            <Chip
                                                icon={<SpeedIcon />}
                                                label={`Last Render: ${selectedNode.lastRenderMs || 0}ms`}
                                                size="small"
                                                variant="outlined"
                                                color={getPerformanceColor(selectedNode.renderTime || 0)}
                                            />
                                            {selectedNode.renderTime && selectedNode.renderTime > 50 && (
                                                <Chip
                                                    icon={<WarningIcon />}
                                                    label="Performance Warning"
                                                    size="small"
                                                    color="error"
                                                />
                                            )}
                                        </Stack>

                                        {/* Performance Indicator */}
                                        {selectedNode.renderTime && selectedNode.renderTime > 30 && (
                                            <Box sx={{ mb: 3 }}>
                                                <Alert severity="warning" icon={<SpeedIcon />}>
                                                    This component has high render time. Consider using React.memo() or useMemo() for optimization.
                                                </Alert>
                                            </Box>
                                        )}

                                        <Divider sx={{ my: 2 }} />

                                        {/* Props Section */}
                                        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                            Props
                                        </Typography>
                                        {Object.keys(selectedNode.props).length > 0 ? (
                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                                <Table size="small">
                                                    <TableBody>
                                                        {Object.entries(selectedNode.props).map(([key, value]) => (
                                                            <TableRow key={key}>
                                                                <TableCell component="th" scope="row" sx={{ fontWeight: 600, border: 'none' }}>
                                                                    {key}
                                                                </TableCell>
                                                                <TableCell sx={{ border: 'none' }}>
                                                                    <Chip
                                                                        label={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ fontFamily: 'monospace' }}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </Paper>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                No props available.
                                            </Typography>
                                        )}

                                        {/* State Section */}
                                        {selectedNode.state && Object.keys(selectedNode.state).length > 0 && (
                                            <>
                                                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
                                                    Local State
                                                </Typography>
                                                <Paper variant="outlined" sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                                                    <Box component="pre" sx={{
                                                        m: 0,
                                                        fontSize: '0.75rem',
                                                        overflow: 'auto',
                                                        fontFamily: 'monospace',
                                                        color: theme.palette.info.main,
                                                    }}>
                                                        {JSON.stringify(selectedNode.state, null, 2)}
                                                    </Box>
                                                </Paper>
                                            </>
                                        )}

                                        {/* Dependencies */}
                                        {selectedNode.dependencies && selectedNode.dependencies.length > 0 && (
                                            <>
                                                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
                                                    Dependencies
                                                </Typography>
                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                    {selectedNode.dependencies.map((dep, idx) => (
                                                        <Chip key={idx} label={dep} size="small" variant="outlined" />
                                                    ))}
                                                </Stack>
                                            </>
                                        )}

                                        {/* Optimization Tips */}
                                        {selectedNode.renderCount && selectedNode.renderCount > 5 && (
                                            <Alert severity="info" sx={{ mt: 3 }} icon={<SpeedIcon />}>
                                                <Typography variant="body2">
                                                    <strong>Optimization Tip:</strong> This component has re-rendered {selectedNode.renderCount} times.
                                                    Consider wrapping with React.memo() to prevent unnecessary re-renders.
                                                </Typography>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ height: '100%' }}
                            >
                                <Paper sx={{ height: 'calc(100vh - 350px)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                                    <Box textAlign="center">
                                        <AccountTreeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            No Component Selected
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Select a component from the tree to view its details, props, and performance metrics.
                                        </Typography>
                                    </Box>
                                </Paper>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ComponentTreeExplorer2;