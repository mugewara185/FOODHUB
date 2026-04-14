import React from 'react';
import {
  Paper,
  InputBase,
  IconButton,
  type SxProps,
  type Theme,
} from '@mui/material';
import { Search } from '@mui/icons-material';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  maxWidth?: number | string;
  sx?: SxProps<Theme>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  maxWidth = 600,
  sx,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: '4px',
        display: 'flex',
        alignItems: 'center',
        borderRadius: 5,
        bgcolor: 'white',
        maxWidth,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        ...sx,
      }}
    >
      <InputBase
        sx={{ ml: 2, flex: 1, fontSize: '1.1rem' }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <IconButton
        type="submit"
        sx={{
          p: '12px',
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: 4,
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        <Search />
      </IconButton>
    </Paper>
  );
};

export default SearchBar;
