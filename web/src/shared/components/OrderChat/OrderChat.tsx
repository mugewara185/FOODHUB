import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Avatar } from '@mui/material';
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
  
  const dispatch = useAppDispatch();
  const liveTracking = useAppSelector(selectLiveTracking);
  
  const isCustomerReduxActive = currentUserRole === 'user' && liveTracking?.orderId === orderId;

  useEffect(() => {
    // Fetch chat history on mount
    api.get<any>(`/orders/${orderId}/chat`)
      .then(res => {
        const history = res.data || [];
        if (isCustomerReduxActive) {
          dispatch(setLiveTrackingChatHistory({ orderId, messages: history }));
        } else {
          setLocalMessages(history);
        }
      })
      .catch(err => console.error('Failed to fetch chat history', err));
  }, [orderId, isCustomerReduxActive, dispatch]);

  // Use Redux messages if available, otherwise fallback to local state (for partner/owner in this sprint)
  const messages = isCustomerReduxActive && liveTracking ? liveTracking.chatMessages : localMessages;

  const resolvedTargetRole = targetRole || (currentUserRole === 'user' ? 'owner' : 'user');

  const filteredMessages = messages.filter(msg => 
    (msg.senderRole === currentUserRole && msg.targetRole === resolvedTargetRole) || 
    (msg.senderRole === resolvedTargetRole && msg.targetRole === currentUserRole)
  );

  useEffect(() => {
    if (isCustomerReduxActive) {
      dispatch(clearLiveTrackingUnreadCount());
    }
  }, [isCustomerReduxActive, dispatch, messages.length]);

  useEffect(() => {
    socketService.joinOrderRoom(orderId);

    const handleNewMessage = (msg: OrderChatMessage) => {
      if (!isCustomerReduxActive) {
        setLocalMessages((prev) => [...prev, msg]);
      }
    };

    socketService.onOrderChatMessage(handleNewMessage);

    return () => {
      socketService.offOrderChatMessage(handleNewMessage);
    };
  }, [orderId, isCustomerReduxActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const payload: OrderChatMessage = {
      orderId,
      senderId: currentUserId,
      senderRole: currentUserRole,
      targetRole: targetRole || (currentUserRole === 'user' ? 'owner' : 'user'),
      senderName: currentUserName,
      message: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    socketService.sendOrderChatMessage(payload);
    setInputText('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Storefront fontSize="small" />;
      case 'partner': return <LocalShipping fontSize="small" />;
      default: return <Person fontSize="small" />;
    }
  };

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: 400, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="subtitle1" fontWeight={700}>Order Support Chat</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Live chat with {resolvedTargetRole === 'owner' ? 'restaurant' : resolvedTargetRole === 'partner' ? 'driver' : 'customer'}</Typography>
      </Box>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'grey.50' }}>
        {filteredMessages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 'auto' }}>
            No messages yet. Say hello!
          </Typography>
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
