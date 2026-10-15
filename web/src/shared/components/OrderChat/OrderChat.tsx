import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar, Tabs, Tab } from '@mui/material';
import { Send, Person, Storefront, LocalShipping } from '@mui/icons-material';
import { socketService } from '../../../services/socket';
import type { OrderChatMessage } from '../../../core/types/socket.events';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { selectLiveTracking, clearLiveTrackingUnreadCount, addLiveTrackingChatMessage, setLiveTrackingChatHistory } from '../../../features/orders/orderSlice';
import api from '../../../core/utils/api';

interface OrderChatProps {
  orderId: string;
  currentUserRole: 'user' | 'owner' | 'partner' | 'admin';
  currentUserId: string;
  currentUserName: string;
  targetRole?: 'user' | 'owner' | 'partner' | 'admin';
}

const OrderChat: React.FC<OrderChatProps> = ({ orderId, currentUserRole, currentUserId, currentUserName, targetRole }) => {
  const [localMessages, setLocalMessages] = useState<OrderChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const defaultTarget: 'user' | 'owner' | 'partner' = targetRole === 'admin'
    ? 'user'
    : (targetRole || (currentUserRole === 'user' ? 'owner' : 'user'));

  const [selectedTargetRole, setSelectedTargetRole] = useState<'user' | 'owner' | 'partner'>(defaultTarget);

  useEffect(() => {
    if (targetRole && targetRole !== 'admin') {
      setSelectedTargetRole(targetRole);
    }
  }, [targetRole]);

  const dispatch = useAppDispatch();
  const liveTracking = useAppSelector(selectLiveTracking);

  const isCustomerReduxActive = currentUserRole === 'user' && liveTracking?.orderId === orderId;

  useEffect(() => {
    // Fetch chat history on mount
    api.get<any>(`/orders/${orderId}/chat`)
      .then(res => {
        const history = Array.isArray(res) ? res : (res?.data || []);
        setLocalMessages(history);
        if (currentUserRole === 'user') {
          dispatch(setLiveTrackingChatHistory({ orderId, messages: history }));
        }
      })
      .catch(err => console.error('Failed to fetch chat history', err));
  }, [orderId, currentUserRole, dispatch]);

  // Use Redux messages if active and populated, otherwise fallback to local state
  const messages = isCustomerReduxActive && liveTracking && liveTracking.chatMessages.length > 0 
    ? liveTracking.chatMessages 
    : localMessages;

  const filteredMessages = messages.filter(msg => {
    if (msg.targetRole) {
      return (msg.senderRole === currentUserRole && msg.targetRole === selectedTargetRole) || 
             (msg.senderRole === selectedTargetRole && msg.targetRole === currentUserRole);
    }
    return true;
  });

  useEffect(() => {
    if (isCustomerReduxActive) {
      dispatch(clearLiveTrackingUnreadCount());
    }
  }, [isCustomerReduxActive, dispatch, messages.length]);

  useEffect(() => {
    socketService.joinOrderRoom(orderId);

    const handleNewMessage = (msg: OrderChatMessage) => {
      if (msg.orderId !== orderId) return;
      setLocalMessages((prev) => {
        const exists = prev.some(
          m => m.timestamp === msg.timestamp && m.message === msg.message && m.senderId === msg.senderId
        );
        return exists ? prev : [...prev, msg];
      });
      if (isCustomerReduxActive) {
        dispatch(addLiveTrackingChatMessage({ message: msg, isChatOpen: true }));
      }
    };

    socketService.onOrderChatMessage(handleNewMessage);

    return () => {
      socketService.offOrderChatMessage(handleNewMessage);
    };
  }, [orderId, isCustomerReduxActive, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages.length]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const payload: OrderChatMessage = {
      orderId,
      senderId: currentUserId,
      senderRole: currentUserRole,
      targetRole: selectedTargetRole,
      senderName: currentUserName,
      message: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    socketService.sendOrderChatMessage(payload);
    setLocalMessages((prev) => [...prev, payload]);
    if (isCustomerReduxActive) {
      dispatch(addLiveTrackingChatMessage({ message: payload, isChatOpen: true }));
    }
    setInputText('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Storefront fontSize="small" />;
      case 'partner': return <LocalShipping fontSize="small" />;
      default: return <Person fontSize="small" />;
    }
  };

  // Determine available tabs based on current role
  const getTabOptions = () => {
    if (currentUserRole === 'partner') {
      return [
        { role: 'user' as const, label: 'Customer' },
        { role: 'owner' as const, label: 'Restaurant' }
      ];
    }
    if (currentUserRole === 'owner') {
      return [
        { role: 'user' as const, label: 'Customer' },
        { role: 'partner' as const, label: 'Driver' }
      ];
    }
    // For customer or others
    return [
      { role: 'owner' as const, label: 'Restaurant' },
      { role: 'partner' as const, label: 'Driver' }
    ];
  };

  const tabOptions = getTabOptions();

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: 460, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="subtitle1" fontWeight={700}>Order Support Chat</Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Order #{orderId.substring(0, 8)} • Logged in as {currentUserName} ({currentUserRole})
        </Typography>
      </Box>

      {/* Recipient Selection Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Tabs
          value={selectedTargetRole}
          onChange={(_, val) => setSelectedTargetRole(val)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          {tabOptions.map((opt) => (
            <Tab
              key={opt.role}
              value={opt.role}
              label={opt.label}
              icon={getRoleIcon(opt.role)}
              iconPosition="start"
              sx={{ minHeight: 44, py: 1, textTransform: 'none', fontWeight: 600 }}
            />
          ))}
        </Tabs>
      </Box>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'grey.50' }}>
        {filteredMessages.length === 0 ? (
          <Box sx={{ my: 'auto', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No messages with {selectedTargetRole === 'owner' ? 'restaurant' : selectedTargetRole === 'partner' ? 'driver' : 'customer'} yet.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Type below to start the conversation!
            </Typography>
          </Box>
        ) : (
          filteredMessages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId && msg.senderRole === currentUserRole;
            return (
              <Box key={i} sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 1 }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: isMe ? 'primary.main' : 'grey.400' }}>
                  {getRoleIcon(msg.senderRole)}
                </Avatar>
                <Box sx={{ maxWidth: '75%' }}>
                  {!isMe && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>
                      {msg.senderName} ({msg.senderRole})
                    </Typography>
                  )}
                  <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: isMe ? 'primary.light' : 'white', color: isMe ? 'primary.contrastText' : 'text.primary', borderBottomRightRadius: isMe ? 0 : 8, borderBottomLeftRadius: isMe ? 8 : 0 }}>
                    <Typography variant="body2">{msg.message}</Typography>
                  </Paper>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: isMe ? 'right' : 'left' }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </Typography>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          inputProps={{ 'data-testid': 'chat-message-input' }}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5 } }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!inputText.trim()}>
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default OrderChat;
