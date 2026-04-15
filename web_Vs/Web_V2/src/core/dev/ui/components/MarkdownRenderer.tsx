import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Typography,
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <Box sx={{
      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 2 },
      '& code': { bgcolor: 'action.hover', px: 0.5, py: 0.25, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85em' },
      '& pre': { bgcolor: '#1e1e1e', color: '#d4d4d4', p: 2, borderRadius: 2, overflow: 'auto', my: 2, '& code': { bgcolor: 'transparent', p: 0, color: 'inherit' } },
      '& blockquote': { borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, my: 2, color: 'text.secondary', fontStyle: 'italic' },
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <Typography variant="h3" fontWeight={700} gutterBottom sx={{ mt: 4, mb: 2 }} {...props} />,
          h2: ({ node, ...props }) => (
             <>
               <Typography variant="h4" fontWeight={600} gutterBottom sx={{ mt: 4, mb: 2 }} {...props} />
               <Divider sx={{ mb: 2 }} />
             </>
          ),
          h3: ({ node, ...props }) => <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3, mb: 1 }} {...props} />,
          h4: ({ node, ...props }) => <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, mb: 1 }} {...props} />,
          p: ({ node, ...props }) => <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }} {...props} />,
          a: ({ node, ...props }) => <Link color="primary" {...props} />,
          li: ({ node, ...props }) => (
            <Box component="li" sx={{ mb: 0.5 }}>
              <Typography variant="body1" component="span" {...props} />
            </Box>
          ),
          table: ({ node, ...props }) => (
            <TableContainer component={Paper} variant="outlined" sx={{ my: 3 }}>
              <Table size="small" {...props} />
            </TableContainer>
          ),
          thead: ({ node, ...props }) => <TableHead sx={{ bgcolor: 'action.hover' }} {...props} />,
          tbody: ({ node, ...props }) => <TableBody {...props} />,
          tr: ({ node, ...props }) => <TableRow {...props} />,
          th: ({ node, ...props }) => <TableCell sx={{ fontWeight: 600 }} {...props} />,
          td: ({ node, ...props }) => <TableCell {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
