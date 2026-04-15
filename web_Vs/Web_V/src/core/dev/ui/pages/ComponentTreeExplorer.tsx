import React, { useState } from 'react';
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CodeIcon from '@mui/icons-material/Code';
import { componentTree, type ComponentNode } from '../mockData';

const ComponentTreeExplorer: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ComponentNode | null>(null);

  const handleSelect = (event: React.SyntheticEvent | unknown, nodeId: string | any) => {
    // Basic recursive search to find the node
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
  };

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'root': true,
    'auth-provider': true,
    'main-layout': true,
    'home-page': true,
  });

  const handleToggleExpand = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const renderTree = (nodes: ComponentNode, depth: number = 0) => {
    const hasChildren = Array.isArray(nodes.children) && nodes.children.length > 0;
    const isExpanded = !!expandedNodes[nodes.id];
    const isSelected = selectedNode?.id === nodes.id;

    return (
      <Box key={nodes.id}>
        <ListItemButton
          selected={isSelected}
          onClick={(e) => {
            handleSelect(e, nodes.id);
            if (hasChildren) {
              handleToggleExpand(nodes.id, e);
            }
          }}
          sx={{ pl: depth * 2, py: 0.5 }}
        >
          <Box sx={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasChildren && (
              isExpanded
                ? <ExpandMoreIcon fontSize="small" color="action" />
                : <ChevronRightIcon fontSize="small" color="action" />
            )}
          </Box>
          <CodeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            {nodes.name}
          </Typography>
          <Chip
            label={nodes.type}
            size="small"
            sx={{ ml: 1, height: 20, fontSize: '0.65rem' }}
            color={
              nodes.type === 'provider' ? 'secondary' :
                nodes.type === 'feature' ? 'primary' :
                  nodes.type === 'ui' ? 'success' : 'default'
            }
          />
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
    <Box sx={{ height: '100%' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Component Tree Explorer
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Inspect the static React component hierarchy, view props, and monitor render cycles.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            {/* Note: TreeView is available in lab or modern MUI via @mui/lab or @mui/x-tree-view. Assuming basic lab/material structure for now, or building a mock tree if unsupported.
                Using simple mock structure for UI representation here. */}
            <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
              APPLICATION TREE
            </Typography>
            <List component="nav" sx={{ flexGrow: 1, overflowY: 'auto' }} disablePadding>
              {renderTree(componentTree)}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          {selectedNode ? (
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  &lt;{selectedNode.name} /&gt;
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  <Chip label={`Type: ${selectedNode.type}`} size="small" variant="outlined" />
                  <Chip label={`Renders: ${selectedNode.renderCount}`} size="small" variant="outlined" />
                  <Chip label={`Last Render: ${selectedNode.lastRenderMs}ms`} size="small" variant="outlined" />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Props
                </Typography>
                {Object.keys(selectedNode.props).length > 0 ? (
                  <Box component="pre" sx={{ p: 2, bgcolor: 'grey.900', color: 'success.main', borderRadius: 1, overflow: 'auto', fontSize: '0.875rem' }}>
                    {JSON.stringify(selectedNode.props, null, 2)}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No props available.
                  </Typography>
                )}

                {selectedNode.state && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                      Local State Snapshot
                    </Typography>
                    <Box component="pre" sx={{ p: 2, bgcolor: 'grey.900', color: 'info.main', borderRadius: 1, overflow: 'auto', fontSize: '0.875rem' }}>
                      {JSON.stringify(selectedNode.state, null, 2)}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: 'background.default' }}>
              <Typography variant="body1" color="text.secondary">
                Select a component from the tree to view its details.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ComponentTreeExplorer;
