import React from 'react';
import { useAppSelector, useAppDispatch } from '@app/store';
import { hideToast, selectToast } from '@features/ui/uiSlice';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, message, type } = useAppSelector(selectToast);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    // Prevents the toast from closing if the user clicks outside accidentally
    if (reason === 'clickaway') return;
    dispatch(hideToast());
  };

  // Maps your Redux slice types to standard Lucide icons
  const iconMap = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        top:'auto',
        // marginTop:{xs:'70px', sm:'110px', md:'110px'},
        marginTop:'110px',
      }}
    >
      <Alert
        elevation={6}
        variant="filled"
        severity={type}
        icon={iconMap[type]}
        onClose={handleClose}
        slotProps={{
          action: {
            // Overrides default close button style to keep layout clean
            sx: { padding: 0, alignItems: 'center' }
          }
        }}
        slots={{
          closeIcon: () => (
            <IconButton size="small" color="inherit" aria-label="close">
              <X size={16} />
            </IconButton>
          )
        }}
        sx={{ 
          width: '100%', 
          maxWidth: '400px',
          fontWeight: 500,
          borderRadius: '8px'
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
