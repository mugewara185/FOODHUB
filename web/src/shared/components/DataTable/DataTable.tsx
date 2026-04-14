// import React, { useState, useMemo } from 'react';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   TablePagination,
//   TableSortLabel,
//   Paper,
//   LinearProgress,
//   Box,
//   Typography,
//   Chip,
//   IconButton,
//   Tooltip,
//   Checkbox,
// } from '@mui/material';
// import {
//   ChevronLeft,
//   ChevronRight,
//   FilterList,
//   Download,
//   Refresh,
// } from '@mui/icons-material';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useVirtualizer } from '@tanstack/react-virtual';

// export interface Column<T = any> {
//   id: keyof T | string;
//   label: string;
//   align?: 'left' | 'right' | 'center';
//   sortable?: boolean;
//   filterable?: boolean;
//   width?: number | string;
//   render?: (value: any, row: T) => React.ReactNode;
// }

// interface DataTableProps<T> {
//   columns: Column<T>[];
//   data: T[];
//   loading?: boolean;
//   totalCount?: number;
//   page?: number;
//   pageSize?: number;
//   onPageChange?: (page: number) => void;
//   onPageSizeChange?: (pageSize: number) => void;
//   onSort?: (column: string, direction: 'asc' | 'desc') => void;
//   onSelectionChange?: (selectedRows: T[]) => void;
//   selectable?: boolean;
//   virtualize?: boolean;
//   rowHeight?: number;
//   emptyMessage?: string;
//   actions?: (row: T) => React.ReactNode;
//   onRefresh?: () => void;
//   onExport?: () => void;
// }

// export function DataTable<T extends Record<string, any>>({
//   columns,
//   data,
//   loading = false,
//   totalCount = 0,
//   page = 0,
//   pageSize = 10,
//   onPageChange,
//   onPageSizeChange,
//   onSort,
//   onSelectionChange,
//   selectable = false,
//   virtualize = false,
//   rowHeight = 52,
//   emptyMessage = 'No data available',
//   actions,
//   onRefresh,
//   onExport,
// }: DataTableProps<T>) {
//   const [orderBy, setOrderBy] = useState<string>('');
//   const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('asc');
//   const [selected, setSelected] = useState<Set<string>>(new Set());

//   // Virtual scrolling for large datasets
//   const parentRef = React.useRef<HTMLDivElement>(null);
//   const virtualizer = useVirtualizer({
//     count: data.length,
//     getScrollElement: () => parentRef.current,
//     estimateSize: () => rowHeight,
//     overscan: 5,
//   });

//   const handleSort = (columnId: string) => {
//     const isAsc = orderBy === columnId && orderDirection === 'asc';
//     const direction = isAsc ? 'desc' : 'asc';
//     setOrderBy(columnId);
//     setOrderDirection(direction);
//     onSort?.(columnId, direction);
//   };

//   const handleSelectAll = () => {
//     if (selected.size === data.length) {
//       setSelected(new Set());
//       onSelectionChange?.([]);
//     } else {
//       const newSelected = new Set(data.map((row) => row.id));
//       setSelected(newSelected);
//       onSelectionChange?.(data);
//     }
//   };

//   const handleSelectRow = (row: T) => {
//     const newSelected = new Set(selected);
//     if (newSelected.has(row.id)) {
//       newSelected.delete(row.id);
//     } else {
//       newSelected.add(row.id);
//     }
//     setSelected(newSelected);
//     onSelectionChange?.(data.filter((r) => newSelected.has(r.id)));
//   };

//   const renderTableBody = () => {
//     if (loading) {
//       return (
//         <TableRow>
//           <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
//             <Box sx={{ p: 4, textAlign: 'center' }}>
//               <LinearProgress />
//               <Typography sx={{ mt: 2 }}>Loading...</Typography>
//             </Box>
//           </TableCell>
//         </TableRow>
//       );
//     }

//     if (data.length === 0) {
//       return (
//         <TableRow>
//           <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
//             <Box sx={{ p: 4, textAlign: 'center' }}>
//               <Typography color="text.secondary">{emptyMessage}</Typography>
//             </Box>
//           </TableCell>
//         </TableRow>
//       );
//     }

//     if (virtualize) {
//       return (
//         <TableRow>
//           <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
//             <div
//               ref={parentRef}
//               style={{
//                 height: `${Math.min(500, data.length * rowHeight)}px`,
//                 overflow: 'auto',
//               }}
//             >
//               <div
//                 style={{
//                   height: `${virtualizer.getTotalSize()}px`,
//                   width: '100%',
//                   position: 'relative',
//                 }}
//               >
//                 {virtualizer.getVirtualItems().map((virtualRow) => {
//                   const row = data[virtualRow.index];
//                   return (
//                     <motion.div
//                       key={row.id}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       style={{
//                         position: 'absolute',
//                         top: 0,
//                         left: 0,
//                         width: '100%',
//                         height: `${virtualRow.size}px`,
//                         transform: `translateY(${virtualRow.start}px)`,
//                       }}
//                     >
//                       <TableRow hover>
//                         {selectable && (
//                           <TableCell padding="checkbox">
//                             <Checkbox
//                               checked={selected.has(row.id)}
//                               onChange={() => handleSelectRow(row)}
//                             />
//                           </TableCell>
//                         )}
//                         {columns.map((column) => (
//                           <TableCell
//                             key={String(column.id)}
//                             align={column.align || 'left'}
//                             style={{ width: column.width }}
//                           >
//                             {column.render
//                               ? column.render(row[column.id as keyof T], row)
//                               : row[column.id as keyof T]}
//                           </TableCell>
//                         ))}
//                         {actions && (
//                           <TableCell align="right">{actions(row)}</TableCell>
//                         )}
//                       </TableRow>
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             </div>
//           </TableCell>
//         </TableRow>
//       );
//     }

//     return (
//       <AnimatePresence>
//         {data.map((row) => (
//           <motion.tr
//             key={row.id}
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -20 }}
//             transition={{ duration: 0.2 }}
//           >
//             {selectable && (
//               <TableCell padding="checkbox">
//                 <Checkbox
//                   checked={selected.has(row.id)}
//                   onChange={() => handleSelectRow(row)}
//                 />
//               </TableCell>
//             )}
//             {columns.map((column) => (
//               <TableCell
//                 key={String(column.id)}
//                 align={column.align || 'left'}
//                 style={{ width: column.width }}
//               >
//                 {column.render
//                   ? column.render(row[column.id as keyof T], row)
//                   : row[column.id as keyof T]}
//               </TableCell>
//             ))}
//             {actions && <TableCell align="right">{actions(row)}</TableCell>}
//           </motion.tr>
//         ))}
//       </AnimatePresence>
//     );
//   };

//   return (
//     <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
//       {/* Toolbar */}
//       <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           {selectable && selected.size > 0 && (
//             <Typography variant="body2">
//               {selected.size} selected
//             </Typography>
//           )}
//         </Box>
//         <Box sx={{ display: 'flex', gap: 1 }}>
//           {onRefresh && (
//             <Tooltip title="Refresh">
//               <IconButton onClick={onRefresh} size="small">
//                 <Refresh />
//               </IconButton>
//             </Tooltip>
//           )}
//           {onExport && (
//             <Tooltip title="Export">
//               <IconButton onClick={onExport} size="small">
//                 <Download />
//               </IconButton>
//             </Tooltip>
//           )}
//           <Tooltip title="Filter">
//             <IconButton size="small">
//               <FilterList />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       </Box>

//       {/* Table */}
//       <TableContainer>
//         <Table stickyHeader>
//           <TableHead>
//             <TableRow>
//               {selectable && (
//                 <TableCell padding="checkbox">
//                   <Checkbox
//                     indeterminate={selected.size > 0 && selected.size < data.length}
//                     checked={data.length > 0 && selected.size === data.length}
//                     onChange={handleSelectAll}
//                   />
//                 </TableCell>
//               )}
//               {columns.map((column) => (
//                 <TableCell
//                   key={String(column.id)}
//                   align={column.align || 'left'}
//                   sortDirection={orderBy === column.id ? orderDirection : false}
//                   style={{ width: column.width }}
//                 >
//                   {column.sortable ? (
//                     <TableSortLabel
//                       active={orderBy === column.id}
//                       direction={orderBy === column.id ? orderDirection : 'asc'}
//                       onClick={() => handleSort(String(column.id))}
//                     >
//                       {column.label}
//                     </TableSortLabel>
//                   ) : (
//                     column.label
//                   )}
//                 </TableCell>
//               ))}
//               {actions && <TableCell align="right">Actions</TableCell>}
//             </TableRow>
//           </TableHead>
//           <TableBody>{renderTableBody()}</TableBody>
//         </Table>
//       </TableContainer>

//       {/* Pagination */}
//       {onPageChange && (
//         <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
//           <TablePagination
//             component="div"
//             count={totalCount}
//             page={page}
//             onPageChange={(_, newPage) => onPageChange(newPage)}
//             rowsPerPage={pageSize}
//             onRowsPerPageChange={(e) => onPageSizeChange?.(parseInt(e.target.value, 10))}
//             rowsPerPageOptions={[10, 25, 50, 100]}
//           />
//         </Box>
//       )}
//     </Paper>
//   );
// }