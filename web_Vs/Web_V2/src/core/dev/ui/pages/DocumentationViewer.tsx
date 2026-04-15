import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  ListSubheader,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { getCategorizedDocs, type DocItem } from '../../utils/docsRegistry';
import MarkdownRenderer from '../components/MarkdownRenderer';

const DocumentationViewer: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  // Memoize the grouped docs so we don't recalculate unless needed
  const groupedDocs = useMemo(() => getCategorizedDocs(), []);

  // Filter docs logic
  const filteredDocs = useMemo(() => {
    if (!search.trim()) return groupedDocs;

    const query = search.toLowerCase();
    const result: Record<string, Record<string, DocItem[]>> = {};

    Object.entries(groupedDocs).forEach(([domain, categories]) => {
      const filteredCategories: Record<string, DocItem[]> = {};

      Object.entries(categories).forEach(([category, docs]) => {
        const matchingDocs = docs.filter(
          doc => doc.title.toLowerCase().includes(query) || doc.path.toLowerCase().includes(query)
        );
        if (matchingDocs.length > 0) {
          filteredCategories[category] = matchingDocs;
        }
      });

      if (Object.keys(filteredCategories).length > 0) {
        result[domain] = filteredCategories;
      }
    });

    return result;
  }, [search, groupedDocs]);

  // Load content when a doc is selected
  useEffect(() => {
    let isMounted = true;

    if (selectedDoc) {
      setIsLoading(true);
      setDocContent('');

      selectedDoc.loadContent().then((content: any) => {
        if (isMounted) {
          setDocContent(content);
          setIsLoading(false);
        }
      }).catch(err => {
        if (isMounted) {
          setDocContent(`# Error loading documentation\\n\\n\\\`\\\`\\\`\\n\${err.message}\n`);
          setIsLoading(false);
        }
      });
    }

    return () => { isMounted = false; };
  }, [selectedDoc]);

  // Initialize all domains as expanded by default
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    Object.keys(groupedDocs).forEach(d => { initialExpandedState[d] = true; });
    setExpandedDomains(initialExpandedState);
  }, [groupedDocs]);

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Developer Documentation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Live, automatically-discovered documentation across the entire project repository.
      </Typography>

      <Paper sx={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 180px)', overflow: 'hidden', borderRadius: 2 }}>
        {/* Left Sidebar */}
        <Box sx={{ width: '30%', minWidth: 280, borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search docs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
            {Object.entries(filteredDocs).map(([domain, categories]) => (
              <Box key={domain}>
                <ListSubheader
                  sx={{
                    bgcolor: 'grey.100',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    py: 1
                  }}
                  onClick={() => toggleDomain(domain)}
                >
                  {expandedDomains[domain] ? <ExpandMoreIcon fontSize="small" sx={{ mr: 1 }} /> : <ChevronRightIcon fontSize="small" sx={{ mr: 1 }} />}
                  {domain}
                </ListSubheader>

                <Collapse in={expandedDomains[domain]} timeout="auto" unmountOnExit>
                  {Object.entries(categories).map(([category, docs]) => (
                    <Box key={category} sx={{ mb: 1 }}>
                      <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ pl: 5, py: 1, display: 'block', textTransform: 'uppercase' }}>
                        {category}
                      </Typography>
                      {docs.map(doc => (
                        <ListItemButton
                          key={doc.id}
                          selected={selectedDoc?.id === doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          sx={{ pl: 6, py: 0.5 }}
                        >
                          <DescriptionIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                          <ListItemText
                            primary={doc.title}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: selectedDoc?.id === doc.id ? 600 : 400 }}
                          />
                        </ListItemButton>
                      ))}
                    </Box>
                  ))}
                </Collapse>
                <Divider />
              </Box>
            ))}

            {Object.keys(filteredDocs).length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No documentation found.</Typography>
              </Box>
            )}
          </List>
        </Box>

        {/* Right Content Area */}
        <Box sx={{ width: '70%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
          {selectedDoc ? (
            <>
              <Box sx={{ px: 4, py: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    {selectedDoc.domain} / {selectedDoc.category} /
                  </Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontFamily: 'monospace' }}>
                    {selectedDoc.path}
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight={700}>
                  {selectedDoc.title}
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 4 }}>
                {isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <MarkdownRenderer content={docContent} />
                )}
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
              <DescriptionIcon sx={{ fontSize: 60, opacity: 0.2, mb: 2 }} />
              <Typography variant="h6">Select a document to read</Typography>
              <Typography variant="body2">Browse the directory tree on the left to explore project documentation.</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DocumentationViewer;
