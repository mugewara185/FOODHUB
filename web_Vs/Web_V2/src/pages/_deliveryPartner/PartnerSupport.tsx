import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Help,
  Phone,
  Email,
  Chat,
  Article,
  Warning,
  Payment,
  LocalShipping,
  Assignment,
} from '@mui/icons-material';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Deliveries',
    question: 'How do I mark an order as delivered?',
    answer: 'When you reach the customer location, tap "Mark as Delivered" and enter the OTP provided by the customer to complete the delivery.',
  },
  {
    category: 'Payments',
    question: 'When do I get paid?',
    answer: 'Earnings are settled every Monday for the previous week. You can withdraw your earnings anytime from the Earnings page.',
  },
  {
    category: 'Issues',
    question: 'What if the restaurant is closed?',
    answer: 'If the restaurant is closed, please mark the order as "Restaurant Closed" in the app. You will not be penalized for this.',
  },
  // Add more FAQs...
];

const Support: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [message, setMessage] = useState('');

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Help & Support
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Get help with your deliveries and account
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Contact Options */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Contact Support
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Our team is available 24/7 to assist you
            </Typography>

            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Phone color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Call Support"
                  secondary="1800-123-4567"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Email color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Email"
                  secondary="partner@foodhub.com"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <Chat color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Live Chat"
                  secondary="Average response: 2 minutes"
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>

            <Grid container spacing={2}>
              {[
                { icon: <Warning />, label: 'Report Issue', color: 'error' },
                { icon: <Payment />, label: 'Payment Query', color: 'warning' },
                { icon: <LocalShipping />, label: 'Delivery Problem', color: 'info' },
                { icon: <Assignment />, label: 'Account Issue', color: 'primary' },
              ].map((action, index) => (
                <Grid item xs={6} key={index}>
                  <Card variant="outlined" sx={{ textAlign: 'center', p: 2, cursor: 'pointer' }}>
                    <Avatar sx={{ bgcolor: `${action.color}.light`, color: `${action.color}.main`, mx: 'auto', mb: 1 }}>
                      {action.icon}
                    </Avatar>
                    <Typography variant="caption">{action.label}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Right Column - FAQs and Contact Form */}
        <Grid item xs={12} md={8}>
          {/* FAQs */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Frequently Asked Questions
            </Typography>

            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                expanded={expanded === `panel${index}`}
                onChange={handleChange(`panel${index}`)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>

          {/* Contact Form */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Send us a Message
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We'll get back to you within 24 hours
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Name" defaultValue="Rahul Sharma" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Email" defaultValue="rahul@example.com" />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  placeholder="Brief description of your issue"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" size="large">
                  Send Message
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Support;