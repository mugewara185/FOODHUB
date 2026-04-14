import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Help as HelpIcon,
  ContactSupport,
  LocalShipping,
  Payment,
  Restaurant,
  AccountCircle,
  RateReview,
  Security,
  Phone,
  Email,
  Chat,
  Article,
  LiveHelp,
} from '@mui/icons-material';

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  questions: {
    q: string;
    a: string;
  }[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'orders',
    title: 'Orders & Delivery',
    icon: <LocalShipping />,
    questions: [
      {
        q: 'How can I track my order?',
        a: 'You can track your order in real-time from the Orders page. Click on "Track Order" to see live updates on your delivery status.',
      },
      {
        q: 'What is the estimated delivery time?',
        a: 'Delivery time varies by restaurant and location. Usually it takes 25-40 minutes. You can see the exact ETA before placing your order.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Orders can be cancelled within 2 minutes of placing them. Go to your Orders page and click "Cancel" if available.',
      },
    ],
  },
  {
    id: 'payment',
    title: 'Payments',
    icon: <Payment />,
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), net banking, and FoodHub Wallet.',
      },
      {
        q: 'How do I apply a coupon?',
        a: 'You can apply coupons during checkout. Enter the coupon code in the "Apply Coupon" section and click Apply.',
      },
      {
        q: 'Is it safe to save my card details?',
        a: 'Yes, we use 256-bit encryption to protect your payment information. We are PCI DSS compliant and never store complete card details.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: <AccountCircle />,
    questions: [
      {
        q: 'How do I reset my password?',
        a: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.',
      },
      {
        q: 'How can I update my phone number?',
        a: 'Go to Profile > Personal Information and click Edit. You can update your phone number there.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes, go to Profile > Settings > Danger Zone to request account deletion. This action is irreversible.',
      },
    ],
  },
  {
    id: 'restaurants',
    title: 'Restaurants',
    icon: <Restaurant />,
    questions: [
      {
        q: 'How do I rate a restaurant?',
        a: 'After your order is delivered, you can rate and review the restaurant from the Orders page or directly on the restaurant page.',
      },
      {
        q: 'What if I receive wrong or missing items?',
        a: 'Please contact our support team immediately with your order details. We will help you get a refund or replacement.',
      },
    ],
  },
];

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<string | false>('panel0');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.questions.length > 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          How can we help you?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search for answers or browse our help topics
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2,
          mb: 6,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Search sx={{ color: 'text.secondary' }} />
        <TextField
          fullWidth
          placeholder="Search for help topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
        />
        <Button variant="contained" sx={{ borderRadius: 2 }}>
          Search
        </Button>
      </Paper>

      {/* Quick Help Categories */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { icon: <LocalShipping />, title: 'Track Order', color: 'primary' },
          { icon: <Payment />, title: 'Payments', color: 'success' },
          { icon: <RateReview />, title: 'Reviews', color: 'warning' },
          { icon: <Security />, title: 'Account Security', color: 'info' },
          { icon: <Article />, title: 'Terms of Service', color: 'secondary' },
          { icon: <LiveHelp />, title: 'Live Chat', color: 'error' },
        ].map((item, index) => (
          <Grid item xs={6} sm={4} md={2} key={index}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${item.color}.light`,
                  color: `${item.color}.main`,
                  width: 48,
                  height: 48,
                  mx: 'auto',
                  mb: 1,
                }}
              >
                {item.icon}
              </Avatar>
              <Typography variant="body2" fontWeight={600}>
                {item.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Left Column - FAQs */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Frequently Asked Questions
          </Typography>

          {filteredFAQs.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <HelpIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No results found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try searching with different keywords
              </Typography>
            </Paper>
          ) : (
            filteredFAQs.map((category, categoryIndex) => (
              <Box key={category.id} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                    {category.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    {category.title}
                  </Typography>
                </Box>

                {category.questions.map((faq, questionIndex) => {
                  const panelId = `panel${categoryIndex}-${questionIndex}`;
                  return (
                    <Accordion
                      key={questionIndex}
                      expanded={expanded === panelId}
                      onChange={handleChange(panelId)}
                      sx={{
                        mb: 1,
                        borderRadius: '8px !important',
                        '&:before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                          '& .MuiAccordionSummary-content': {
                            alignItems: 'center',
                            gap: 1,
                          },
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight={600}>
                          {faq.q}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" color="text.secondary">
                          {faq.a}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            ))
          )}
        </Grid>

        {/* Right Column - Contact Support */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Still need help?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Our support team is available 24/7 to assist you
            </Typography>

            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<Chat />}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Start Live Chat
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Phone />}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Call Support
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Email />}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Email Us
              </Button>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Contact Information
            </Typography>
            
            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Phone fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Toll Free" 
                  secondary="1800-123-4567" 
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Email fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email" 
                  secondary="support@foodhub.com" 
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Chat fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Live Chat" 
                  secondary="24/7 availability" 
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Response Time:</strong>
                <br />
                Typically within 5 minutes
              </Typography>
            </Alert>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                📍 Corporate Office
              </Typography>
              <Typography variant="body2" color="text.secondary">
                FoodHub Technologies Pvt. Ltd.
                <br />
                123 Tech Park, Andheri East
                <br />
                Mumbai, Maharashtra 400093
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Help;