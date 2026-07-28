import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  useTheme
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ChatWindow = ({ bookingId, receiverId, receiverName, receiverImage, onClose, userRole, canChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const { socket, onNewMessage } = useSocket();
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    if (!bookingId) {
      console.error('ChatWindow: bookingId is required but was not provided');
      setError('Invalid booking ID');
      setLoading(false);
      return;
    }
    
    fetchMessages();

    // Join chat room
    if (socket) {
      socket.emit('join_chat', bookingId);
    }

    // Listen for new messages
    const handleNewMessage = (data) => {
      if (data.bookingId === bookingId && data.message) {
        // Check if message already exists to prevent duplicates
        setMessages(prev => {
          const messageId = data.message._id?.toString();
          const messageExists = prev.some(msg => {
            const existingId = msg._id?.toString();
            // Check by ID first (most reliable)
            if (messageId && existingId && messageId === existingId) {
              return true;
            }
            // Fallback: check by content, sender, and timestamp (for same second messages)
            if (msg.senderId?._id?.toString() === data.message.senderId?._id?.toString() &&
                msg.message === data.message.message) {
              const timeDiff = Math.abs(new Date(msg.createdAt) - new Date(data.message.createdAt));
              if (timeDiff < 2000) { // Within 2 seconds
                return true;
              }
            }
            return false;
          });
          
          if (messageExists) {
            return prev; // Don't add duplicate
          }
          
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    };

    if (socket && onNewMessage) {
      onNewMessage(handleNewMessage);
    }

    return () => {
      if (socket) {
        socket.emit('leave_chat', bookingId);
        socket.off('new_message', handleNewMessage);
      }
    };
  }, [bookingId, socket, onNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }
      
      // Debug logging
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const fullUrl = `${apiBaseUrl}/chat/booking/${bookingId}`;
      console.log('Fetching messages from:', fullUrl);
      console.log('Booking ID:', bookingId);
      
      const response = await chatAPI.getMessages(bookingId);
      if (response.data && response.data.data && response.data.data.messages) {
        setMessages(response.data.data.messages);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          `Failed to load messages (${error.response?.status || 'Unknown error'})`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !canChat) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setSending(true);
      const response = await chatAPI.sendMessage({
        bookingId,
        receiverId,
        message: messageText
      });

      // Add message optimistically for immediate feedback
      // Socket handler will check for duplicates before adding
      const sentMessage = response.data.data.message;
      setMessages(prev => {
        // Check if already exists (shouldn't, but safety check)
        const exists = prev.some(msg => msg._id === sentMessage._id);
        return exists ? prev : [...prev, sentMessage];
      });
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      const message = error.response?.data?.message || 'Failed to send message';
      toast.error(message);
      // Restore message text if sending failed
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        maxHeight: '80vh',
        width: '100%',
        maxWidth: '500px',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'primary.main',
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={receiverImage}
            sx={{ width: 32, height: 32, bgcolor: 'white', color: 'primary.main' }}
          >
            {receiverName?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {receiverName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: isDark ? theme.palette.background.default : theme.palette.grey[50],
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontSize: '0.875rem',
                fontWeight: 400
              }}
            >
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              // Check if this is the current user's message
              const currentUserId = user?._id;
              const isMyMessage = message.senderId._id === currentUserId || 
                                  message.senderId._id?.toString() === currentUserId?.toString();

              return (
                <Box
                  key={message._id}
                  sx={{
                    display: 'flex',
                    justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMyMessage ? 'flex-end' : 'flex-start'
                    }}
                  >
                    {!isMyMessage && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mb: 0.5, 
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          textTransform: 'capitalize'
                        }}
                      >
                        {message.senderId.name}
                      </Typography>
                    )}
                    <Box
                      sx={{
                        p: 1.5,
                        px: 2,
                        borderRadius: 2,
                        bgcolor: isMyMessage 
                          ? theme.palette.primary.main 
                          : theme.palette.background.paper,
                        color: isMyMessage 
                          ? '#ffffff' 
                          : theme.palette.text.primary,
                        boxShadow: isMyMessage 
                          ? (isDark ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.2)')
                          : (isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.15)'),
                        border: isMyMessage 
                          ? 'none' 
                          : `1px solid ${theme.palette.divider}`,
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                        minWidth: '60px'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: isMyMessage 
                            ? '#ffffff' 
                            : theme.palette.text.primary,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.9rem',
                          lineHeight: 1.6,
                          fontWeight: 400,
                          letterSpacing: '0.01em'
                        }}
                      >
                        {message.message}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        mt: 0.5, 
                        color: isMyMessage 
                          ? 'rgba(255,255,255,0.9)' 
                          : theme.palette.text.secondary,
                        fontSize: '0.7rem',
                        px: 0.5,
                        fontWeight: 400
                      }}
                    >
                      {formatTime(message.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input Area */}
      {!canChat && (
        <Box 
          sx={{ 
            p: 2, 
            bgcolor: isDark ? theme.palette.warning.dark : theme.palette.warning.light, 
            borderTop: `1px solid ${theme.palette.warning.main}` 
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: isDark ? theme.palette.warning.light : theme.palette.warning.dark, 
              fontSize: '0.75rem' 
            }}
          >
            Chat is only available for 24 hours after ride completion.
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          bgcolor: theme.palette.background.paper
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={canChat ? "Type a message..." : "Chat unavailable"}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!canChat || sending}
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!canChat || !newMessage.trim() || sending}
        >
          {sending ? <CircularProgress size={20} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatWindow;

