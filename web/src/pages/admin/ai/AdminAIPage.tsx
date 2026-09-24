import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, IconButton, Paper, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { Send, SmartToy, Add } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { AIInsightCard } from './components/AIInsightCard';
import { ToolExecutionPanel } from './components/ToolExecutionPanel';
import { useDispatch, useSelector } from 'react-redux';
import { startConversation, addUserMessage, addAssistantMessage, setLoading, setError, clearConversation } from '../../../features/admin/ai/adminAiSlice';
import { sendAIMessage } from '../../../features/admin/ai/adminAiApi';
import { type RootState } from '../../../app/store/V/Store_V';
import { logger } from '../../../core/dev/logger';

const AdminAIPage: React.FC = () => {
  const dispatch = useDispatch();
  const [input, setInput] = useState('');
  const { currentConversation, isLoading, error } = useSelector((state: RootState) => state.adminAi);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    dispatch(addUserMessage(userText));
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      logger.info('AI', 'User asked question', { event: 'ai:request:start', data: { question: userText } });
      const currentMessages = currentConversation ? currentConversation.messages : [];
      const messagesToSend = [...currentMessages, { role: 'user', content: userText, timestamp: new Date().toISOString() }];

      const response = await sendAIMessage(messagesToSend as any, currentConversation?.id);

      dispatch(addAssistantMessage(response));
      logger.info('AI', 'AI responded', { event: 'ai:response:complete', data: { toolCount: response.toolCalls?.length } });
    } catch (err) {
      dispatch(setError((err as Error).message));
      logger.error('AI', 'AI request failed', { event: 'ai:request:error', error: err });
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleNewConversation = () => {
    dispatch(startConversation());
  };

  const hasMessages = currentConversation && currentConversation.messages.length > 0;

  // Get tool calls from the latest assistant message, or empty if user message or loading
  const lastMessage = currentConversation?.messages[currentConversation.messages.length - 1];
  const toolCalls = (lastMessage?.role === 'assistant' ? lastMessage.toolCalls : []) || [];

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy color="primary" /> AI Insights Assistant
        </Typography>
        <Button startIcon={<Add />} variant="outlined" onClick={handleNewConversation}>
          New Conversation
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(setError(null))}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Left Panel: Chat */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Paper sx={{ flexGrow: 1, p: 2, overflow: 'auto', display: 'flex', flexDirection: 'column', borderRadius: 2, mb: 2 }}>
            {!hasMessages ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                <SmartToy sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>Ask me about your platform data</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 2 }}>
                  {["Why is Restaurant X underperforming?", "What is the cancellation rate this quarter?", "Compare November vs October performance"].map((q, i) => (
                    <Button key={i} variant="outlined" size="small" onClick={() => setInput(q)} sx={{ textTransform: 'none', borderRadius: 4 }}>
                      "{q}"
                    </Button>
                  ))}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {currentConversation.messages.map((msg, idx) => (
                  <Box key={idx} sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                        color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        borderRadius: 2,
                        border: msg.role === 'assistant' ? 1 : 0,
                        borderColor: 'divider'
                      }}
                    >
                      {msg.role === 'assistant' ? (
                        <Box sx={{ '& p': { m: 0, mb: 1 }, '& p:last-child': { mb: 0 } }}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </Box>
                      ) : (
                        <Typography variant="body1">{msg.content}</Typography>
                      )}
                    </Paper>
                    {msg.insight && <AIInsightCard insight={msg.insight} />}
                  </Box>
                ))}
                {isLoading && (
                  <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">Analyzing... (calling MCP tools)</Typography>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Paper>

          {/* Input Area */}
          <Paper sx={{ p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') handleSend(); }}
              disabled={isLoading}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
            />
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || isLoading}>
              <Send />
            </IconButton>
          </Paper>
        </Grid>

        {/* Right Panel: Tool Execution */}
        <Grid item xs={12} md={4} sx={{ height: '100%' }}>
          <ToolExecutionPanel toolCalls={toolCalls} isLoading={isLoading} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminAIPage;
