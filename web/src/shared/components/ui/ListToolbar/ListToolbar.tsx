import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Badge,
  type SxProps,
  type Theme,
  type SelectChangeEvent,
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';

export interface SortOption {
  value: string;
  label: string;
}

export interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SortOption[];
  activeFilterCount?: number;
  onFilterOpen?: () => void;
  showMobileFilter?: boolean;
  searchPlaceholder?: string;
  sx?: SxProps<Theme>;
}

const ListToolbar: React.FC<ListToolbarProps> = ({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  sortOptions,
  activeFilterCount = 0,
  onFilterOpen,
  showMobileFilter = false,
  searchPlaceholder = 'Search...',
  sx,
}) => {
  const handleSortChange = (e: SelectChangeEvent) => {
    onSortChange?.(e.target.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mt: 2,
        ...sx,
      }}
    >
      <TextField
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ flex: { xs: 1, md: 0.5, lg: 0.4 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {showMobileFilter && onFilterOpen && (
          <Badge badgeContent={activeFilterCount} color="primary">
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={onFilterOpen}
            >
              Filters
            </Button>
          </Badge>
        )}

        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortValue ?? ''}
              label="Sort by"
              onChange={handleSortChange}
            >
              {sortOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    </Box>
  );
};

export default ListToolbar;
