import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Divider,
    Collapse,
    IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { reduxStateSnapshot } from '../mockData';

// Recursive interactive JSON tree viewer
const JsonTreeViewer = ({ data, searchKeyword }: { data: any, searchKeyword: string }) => {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (path: string) => {
        setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const renderNode = (key: string, value: any, path: string, isLast: boolean, depth: number = 0) => {
        const isObject = value !== null && typeof value === 'object';
        const isArray = Array.isArray(value);
        const isOpen = expanded[path] !== false; // Default open

        // Simple filter matching
        const matchesSearch = searchKeyword && (
            key.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            (!isObject && String(value).toLowerCase().includes(searchKeyword.toLowerCase()))
        );

        const matchHighlight = matchesSearch ? { backgroundColor: 'rgba(255, 255, 0, 0.3)' } : {};

        if (!isObject) {
            let valueColor = '#ce9178'; // string color
            if (typeof value === 'number') valueColor = '#b5cea8';
            if (typeof value === 'boolean') valueColor = '#569cd6';
            if (value === null) valueColor = '#569cd6';

            return (
                <Box key={path} sx={{ pl: depth * 2, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5, ...matchHighlight }}>
                    <span style={{ color: '#9cdcfe' }}>"{key}"</span>: <span style={{ color: valueColor }}>
                        {typeof value === 'string' ? `"${value}"` : String(value)}
                    </span>{isLast ? '' : ','}
                </Box>
            );
        }

        const childKeys = Object.keys(value);
        const isEmpty = childKeys.length === 0;

        return (
            <Box key={path} sx={{ pl: depth > 0 ? 2 : 0, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.5 }}>
                <Box
                    sx={{ display: 'flex', alignItems: 'center', cursor: !isEmpty ? 'pointer' : 'default', ...matchHighlight }}
                    onClick={() => !isEmpty && toggleExpand(path)}
                >
                    {!isEmpty ? (
                        isOpen ?
                            <KeyboardArrowDownIcon sx={{ fontSize: '1rem', color: '#858585', mr: 0.5, ml: depth === 0 ? 0 : -2.5 }} /> :
                            <KeyboardArrowRightIcon sx={{ fontSize: '1rem', color: '#858585', mr: 0.5, ml: depth === 0 ? 0 : -2.5 }} />
                    ) : (
                        <Box sx={{ width: '1rem', mr: 0.5, ml: depth === 0 ? 0 : -2.5 }} />
                    )}
                    <span style={{ color: '#9cdcfe' }}>"{key}"</span>: {isArray ? '[' : '{'}
                    {isEmpty && (isArray ? ']' : '}')}
                    {isEmpty && !isLast && ','}
                </Box>

                {!isEmpty && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        {childKeys.map((childKey, index) =>
                            renderNode(childKey, value[childKey as keyof typeof value], `${path}.${childKey}`, index === childKeys.length - 1, depth + 1)
                        )}
                        <Box sx={{ pl: depth * 2 }}>
                            {isArray ? ']' : '}'}{isLast ? '' : ','}
                        </Box>
                    </Collapse>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ color: '#d4d4d4' }}>
            {typeof data === 'object' && data !== null ? (
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {Array.isArray(data) ? '[' : '{'}
                    {Object.keys(data).map((key, index) =>
                        renderNode(key, data[key as keyof typeof data], key, index === Object.keys(data).length - 1, 1)
                    )}
                    {Array.isArray(data) ? ']' : '}'}
                </Box>
            ) : (
                <Box sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#ce9178' }}>
                    {String(data)}
                </Box>
            )}
        </Box>
    );
};

const StateInspector: React.FC = () => {
    const [activeTab, setActiveTab] = useState('auth');
    const [search, setSearch] = useState('');

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
                State Inspector
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Live interactive view of the global Redux state tree and persisted slices.
            </Typography>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        variant="scrollable"
                        scrollButtons="auto"
                    >
                        <Tab label="Auth" value="auth" />
                        <Tab label="Cart" value="cart" />
                        <Tab label="Restaurants" value="restaurants" />
                        <Tab label="UI" value="ui" />
                        <Tab label="Full Tree" value="full" />
                    </Tabs>
                </Box>

                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'background.paper' }}>
                    <TextField
                        size="small"
                        placeholder="Filter state keys..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 300 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        Read-only representation of current application state.
                    </Typography>
                </Box>

                <Divider />

                <Box sx={{
                    bgcolor: '#1e1e1e',
                    p: 3,
                    height: 'calc(100vh - 280px)',
                    overflow: 'auto',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8
                }}>
                    <JsonTreeViewer
                        data={activeTab === 'full' ? reduxStateSnapshot : reduxStateSnapshot[activeTab as keyof typeof reduxStateSnapshot]}
                        searchKeyword={search}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default StateInspector;
