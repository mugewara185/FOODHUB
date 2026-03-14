import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
} from '@mui/material';
import {
  CreditCard,
  AccountBalanceWallet,
  Payment,
  Add,
  Delete,
  CheckCircle,
  Security,
  Apple,
  Google,
} from '@mui/icons-material';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet';
  name: string;
  isDefault: boolean;
  details: {
    last4?: string;
    expiry?: string;
    cardType?: string;
    upiId?: string;
    walletName?: string;
    balance?: number;
  };
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    name: 'HDFC Bank Credit Card',
    isDefault: true,
    details: {
      last4: '4242',
      expiry: '12/25',
      cardType: 'Visa',
    },
  },
  {
    id: '2',
    type: 'upi',
    name: 'Google Pay',
    isDefault: false,
    details: {
      upiId: 'john@oksbi',
    },
  },
  {
    id: '3',
    type: 'wallet',
    name: 'FoodHub Wallet',
    isDefault: false,
    details: {
      walletName: 'FoodHub',
      balance: 500,
    },
  },
];

const PaymentMethods: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [addCardDialog, setAddCardDialog] = useState(false);
  const [addUPIDialog, setAddUPIDialog] = useState(false);
  const [addWalletDialog, setAddWalletDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
    isDefault: false,
  });
  const [newUPI, setNewUPI] = useState({
    upiId: '',
    isDefault: false,
  });

  const handleSetDefault = (id: string) => {
    setPaymentMethods(prev =>
      prev.map(pm => ({
        ...pm,
        isDefault: pm.id === id,
      }))
    );
  };

  const handleAddCard = () => {
    const last4 = newCard.cardNumber.slice(-4);
    const newPayment: PaymentMethod = {
      id: Date.now().toString(),
      type: 'card',
      name: `${newCard.name || 'Card'} •••• ${last4}`,
      isDefault: newCard.isDefault,
      details: {
        last4,
        expiry: newCard.expiry,
        cardType: getCardType(newCard.cardNumber),
      },
    };

    setPaymentMethods(prev => {
      let updated = [...prev, newPayment];
      if (newPayment.isDefault) {
        updated = updated.map(pm => ({
          ...pm,
          isDefault: pm.id === newPayment.id,
        }));
      }
      return updated;
    });

    setAddCardDialog(false);
    setNewCard({ cardNumber: '', expiry: '', cvv: '', name: '', isDefault: false });
  };

  const handleAddUPI = () => {
    const newPayment: PaymentMethod = {
      id: Date.now().toString(),
      type: 'upi',
      name: 'UPI',
      isDefault: newUPI.isDefault,
      details: {
        upiId: newUPI.upiId,
      },
    };

    setPaymentMethods(prev => {
      let updated = [...prev, newPayment];
      if (newPayment.isDefault) {
        updated = updated.map(pm => ({
          ...pm,
          isDefault: pm.id === newPayment.id,
        }));
      }
      return updated;
    });

    setAddUPIDialog(false);
    setNewUPI({ upiId: '', isDefault: false });
  };

  const handleAddWallet = () => {
    const newPayment: PaymentMethod = {
      id: Date.now().toString(),
      type: 'wallet',
      name: 'FoodHub Wallet',
      isDefault: false,
      details: {
        walletName: 'FoodHub',
        balance: 0,
      },
    };

    setPaymentMethods(prev => [...prev, newPayment]);
    setAddWalletDialog(false);
  };

  const handleDeletePayment = () => {
    if (paymentToDelete) {
      const paymentToDeleteObj = paymentMethods.find(p => p.id === paymentToDelete);
      setPaymentMethods(prev => prev.filter(p => p.id !== paymentToDelete));
      
      // If we deleted the default payment, make another one default
      if (paymentToDeleteObj?.isDefault && paymentMethods.length > 1) {
        const newDefault = paymentMethods.find(p => p.id !== paymentToDelete);
        if (newDefault) {
          handleSetDefault(newDefault.id);
        }
      }
      
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const getCardType = (number: string): string => {
    // Simple card type detection
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    if (number.startsWith('3')) return 'Amex';
    return 'Card';
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard />;
      case 'upi':
        return <Payment />;
      case 'wallet':
        return <AccountBalanceWallet />;
      default:
        return <Payment />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Payment Methods
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Securely manage your payment options
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Payment Methods List */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Saved Payment Methods
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setAddCardDialog(true)}
                >
                  Add Card
                </Button>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setAddUPIDialog(true)}
                >
                  Add UPI
                </Button>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={() => setAddWalletDialog(true)}
                >
                  Add Wallet
                </Button>
              </Box>
            </Box>

            <Stack spacing={2}>
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    border: method.isDefault ? 2 : 1,
                    borderColor: method.isDefault ? 'primary.main' : 'divider',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {getPaymentIcon(method.type)}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {method.name}
                            </Typography>
                            {method.isDefault && (
                              <Chip
                                label="Default"
                                size="small"
                                color="primary"
                                sx={{ height: 20 }}
                              />
                            )}
                          </Box>
                          
                          {method.type === 'card' && (
                            <Typography variant="body2" color="text.secondary">
                              •••• {method.details.last4} | Expires {method.details.expiry}
                            </Typography>
                          )}
                          
                          {method.type === 'upi' && (
                            <Typography variant="body2" color="text.secondary">
                              UPI ID: {method.details.upiId}
                            </Typography>
                          )}
                          
                          {method.type === 'wallet' && (
                            <Typography variant="body2" color="text.secondary">
                              Balance: ₹{method.details.balance}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box>
                        {!method.isDefault && (
                          <Button
                            size="small"
                            onClick={() => handleSetDefault(method.id)}
                            sx={{ mr: 1 }}
                          >
                            Set Default
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setPaymentToDelete(method.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Paper>

          {/* Secure Payment Banner */}
          <Alert
            severity="info"
            icon={<Security />}
            sx={{ mt: 3, borderRadius: 2 }}
          >
            <Typography variant="body2">
              <strong>🔒 Secure Payments</strong> - Your payment information is encrypted and secure. We never store your complete card details.
            </Typography>
          </Alert>
        </Grid>

        {/* Right Column - Quick Add & Info */}
        <Grid item xs={12} md={4}>
          {/* Quick Add */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Quick Add
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Apple />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Add Apple Pay
              </Button>
              <Button
                variant="outlined"
                startIcon={<Google />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Add Google Pay
              </Button>
              <Button
                variant="outlined"
                startIcon={<Payment />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Add PhonePe
              </Button>
              <Button
                variant="outlined"
                startIcon={<Payment />}
                fullWidth
                sx={{ justifyContent: 'flex-start' }}
              >
                Add Paytm
              </Button>
            </Stack>
          </Paper>

          {/* Wallet Balance */}
          {paymentMethods.find(m => m.type === 'wallet') && (
            <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                FoodHub Wallet
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                Available Balance
              </Typography>
              <Typography variant="h3" fontWeight={800}>
                ₹{paymentMethods.find(m => m.type === 'wallet')?.details.balance}
              </Typography>
              <Button
                variant="contained"
                color="inherit"
                sx={{ mt: 3, color: 'primary.main' }}
                fullWidth
              >
                Add Money
              </Button>
            </Paper>
          )}

          {/* Payment Info */}
          <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: 'grey.50' }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>💳 Accepted Cards:</strong>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {['Visa', 'Mastercard', 'RuPay', 'Amex'].map((card) => (
                <Chip key={card} label={card} size="small" variant="outlined" />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary">
              <strong>📱 UPI Apps:</strong> Google Pay, PhonePe, Paytm, BHIM
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Card Dialog */}
      <Dialog
        open={addCardDialog}
        onClose={() => setAddCardDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Add New Card
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Card Number"
              fullWidth
              value={newCard.cardNumber}
              onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
              placeholder="1234 5678 9012 3456"
              InputProps={{
                startAdornment: <CreditCard sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Expiry Date"
                  fullWidth
                  value={newCard.expiry}
                  onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                  placeholder="MM/YY"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="CVV"
                  fullWidth
                  type="password"
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                  placeholder="123"
                />
              </Grid>
            </Grid>
            <TextField
              label="Cardholder Name"
              fullWidth
              value={newCard.name}
              onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
              placeholder="John Doe"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newCard.isDefault}
                  onChange={(e) => setNewCard({ ...newCard, isDefault: e.target.checked })}
                />
              }
              label="Set as default payment method"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCardDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddCard}
            disabled={!newCard.cardNumber || !newCard.expiry || !newCard.cvv}
          >
            Add Card
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add UPI Dialog */}
      <Dialog
        open={addUPIDialog}
        onClose={() => setAddUPIDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Add UPI ID
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="UPI ID"
              fullWidth
              value={newUPI.upiId}
              onChange={(e) => setNewUPI({ ...newUPI, upiId: e.target.value })}
              placeholder="yourname@oksbi"
              helperText="Example: name@okhdfc, name@okicici, name@ybl"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={newUPI.isDefault}
                  onChange={(e) => setNewUPI({ ...newUPI, isDefault: e.target.checked })}
                />
              }
              label="Set as default payment method"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddUPIDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddUPI}
            disabled={!newUPI.upiId}
          >
            Add UPI ID
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Wallet Dialog */}
      <Dialog
        open={addWalletDialog}
        onClose={() => setAddWalletDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Activate FoodHub Wallet
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <AccountBalanceWallet sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" paragraph>
              Get your FoodHub Wallet today and enjoy:
            </Typography>
            <Stack spacing={1} alignItems="center">
              <Typography variant="body2">• Instant cashback</Typography>
              <Typography variant="body2">• Exclusive wallet offers</Typography>
              <Typography variant="body2">• Easy refunds</Typography>
              <Typography variant="body2">• One-click payments</Typography>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWalletDialog(false)}>Maybe Later</Button>
          <Button
            variant="contained"
            onClick={handleAddWallet}
          >
            Activate Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={700} color="error">
            Remove Payment Method
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to remove this payment method?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeletePayment}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentMethods;