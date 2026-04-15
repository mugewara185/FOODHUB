import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Stack,
  Button,
  Alert,
  type SxProps,
  type Theme,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';

export interface SummaryRow {
  label: string;
  value: string | number;
  color?: string;
  bold?: boolean;
}

export interface OrderSummaryPanelProps {
  cartItemsLength: number;
  title?: string;
  subtitle?: string;
  rows: SummaryRow[];
  total: string | number;
  /** Warning shown below rows, e.g. minimum order notice */
  warning?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /** Content rendered below the action buttons */
  footer?: React.ReactNode;
  sticky?: boolean;
  sx?: SxProps<Theme>;
}

const OrderSummaryPanel: React.FC<OrderSummaryPanelProps> = ({
  cartItemsLength,
  title = 'Order Summary',
  subtitle,
  rows,
  total,
  warning,
  actionLabel = 'Proceed to Checkout',
  onAction,
  actionDisabled = false,
  secondaryActionLabel,
  onSecondaryAction,
  footer,
  sticky = true,
  sx,
}) => {
  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        ...(sticky && { position: 'sticky', top: 20 }),
        ...sx,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: !cartItemsLength ? 'background.default' : 'primary.main',
          color: 'white',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Rows */}
      <Box sx={{ p: 3 }}>
        {!cartItemsLength ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <ShoppingCart sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            {/* <Typography color="text.secondary">Your cart is empty</Typography> */}
                          </Box>
                        ) : (
        <Stack spacing={2}>
          {rows.map((row, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                variant={row.bold ? 'h6' : 'body2'}
                fontWeight={row.bold ? 700 : undefined}
                color={row.color || (row.bold ? undefined : 'text.secondary')}
              >
                {row.label}
              </Typography>
              <Typography
                variant={row.bold ? 'h6' : 'body2'}
                fontWeight={row.bold ? 700 : undefined}
                color={row.color || (row.bold ? 'primary.main' : undefined)}
              >
                {row.value}
              </Typography>
            </Box>
          ))}

          <Divider />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight={700}>
              Total Amount
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight={700}>
              {total}
            </Typography>
          </Box>
        </Stack>)
        }

        {warning && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {warning}
          </Alert>
        )}

        {onAction && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, borderRadius: 2 }}
            onClick={onAction}
            disabled={actionDisabled}
          >
            {actionLabel}
          </Button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2, borderRadius: 2 }}
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </Button>
        )}

        {footer && <Box sx={{ mt: 3 }}>{footer}</Box>}
      </Box>
    </Paper>
  );
};

export default OrderSummaryPanel;
