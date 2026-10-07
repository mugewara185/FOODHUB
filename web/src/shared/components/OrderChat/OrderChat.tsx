import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, TextField, IconButton, Stack, Avatar } from '@mui/material';
import { Send, Person, Storefront, LocalShipping } from '@mui/icons-material';
import { socketService } from '../../../services/socket';
import type { OrderChatMessage } from '../../../core/types/socket.events';

interface OrderChatProps {
  orderId: string;
  currentUserRole: 'user' | 'owner' | 'partner' | 'admin';
  currentUserId: string;
  currentUserName: string;
}

const OrderChat: React.FC<OrderChatProps> = ({ orderId, currentUserRole, currentUserId, currentUserName }) => {
  const [messages, setMessages] = useState<OrderChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We assume the parent component has already called socketService.subscribeToOrder(orderId) 
    // or joinOrderRoom. But just to be safe:
    socketService.joinOrderRoom(orderId);

    const handleNewMessage = (msg: OrderChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socketService.onOrderChatMessage(handleNewMessage);

    return () => {
      socketService.offOrderChatMessage(handleNewMessage);
    };
  }, [orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const payload: OrderChatMessage = {
      orderId,
      senderId: currentUserId,
      senderRole: currentUserRole,
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
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Live chat with your {currentUserRole === 'user' ? 'restaurant and driver' : currentUserRole === 'owner' ? 'customer and driver' : 'customer and restaurant'}</Typography>
      </Box>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'grey.50' }}>
        {messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ my: 'auto' }}>
            No messages yet. Say hello!
          </Typography>
        ) : (
          messages.map((msg, i) => {
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
