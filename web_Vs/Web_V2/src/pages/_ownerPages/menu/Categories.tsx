import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DragHandle,
  Category,
  Restaurant,
  TrendingUp,
} from '@mui/icons-material';

interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  isActive: boolean;
  displayOrder: number;
}

const mockCategories: Category[] = [
  { id: '1', name: 'Starters', description: 'Appetizers and starters', itemCount: 12, isActive: true, displayOrder: 1 },
  { id: '2', name: 'Main Course', description: 'Main dishes and curries', itemCount: 18, isActive: true, displayOrder: 2 },
  { id: '3', name: 'Breads', description: 'Indian breads', itemCount: 8, isActive: true, displayOrder: 3 },
  { id: '4', name: 'Rice & Biryani', description: 'Rice dishes', itemCount: 6, isActive: true, displayOrder: 4 },
  { id: '5', name: 'Desserts', description: 'Sweet treats', itemCount: 5, isActive: true, displayOrder: 5 },
];

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleAdd = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const handleSave = () => {
    // Save logic
    setDialogOpen(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Menu Categories
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize your menu items into categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Category
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <Category />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Categories
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {categories.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <Restaurant />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Items
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {categories.reduce((sum, c) => sum + c.itemCount, 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg per Category
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {Math.round(categories.reduce((sum, c) => sum + c.itemCount, 0) / categories.length)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Categories Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell width={50}>Order</TableCell>
                <TableCell>Category Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Items</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell>
                    <IconButton size="small">
                      <DragHandle />
                    </IconButton>
                    {category.displayOrder}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell align="center">
                    <Chip label={category.itemCount} size="small" color="primary" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={category.isActive ? 'Active' : 'Inactive'}
                      color={category.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(category)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(category.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name"
                defaultValue={editingCategory?.name}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                defaultValue={editingCategory?.description}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                defaultValue={editingCategory?.displayOrder || categories.length + 1}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;