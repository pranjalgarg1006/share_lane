import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Badge,
  Chip,
  Grid,
  useTheme
} from '@mui/material';
import {
  Chat as ChatIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { chatAPI } from '../../services/api';
import { toast } from 'react-toastify';
import ChatWindow from '../../components/chat/ChatWindow';

const ChatPage = () => {
  const { user } = useAuth();
  const { onNewMessage } = useSocket();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchConversations();
    
    // Listen for new messages
    if (onNewMessage) {
      const handleNewMessage = (data) => {
        // Refresh conversations when a new message is received
        fetchConversations();
      };
      onNewMessage(handleNewMessage);
      
      return () => {
        // Cleanup handled by SocketContext
      };
    }
  }, [onNewMessage]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await chatAPI.getConversations();
      setConversations(response.data.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (conversation) => {
    if (!conversation.canChat && !conversation.lastMessage) {
      toast.error('Chat is only available for 24 hours after ride completion');
      return;
    }
    setSelectedConversation(conversation);
    setChatOpen(true);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
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
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Chat Conversations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Chat with students about their bookings
          </Typography>
        </Box>

        {/* Conversations List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : conversations.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              When students send you messages, they will appear here
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2}>
                <List>
                  {conversations.map((conversation, index) => (
                    <React.Fragment key={conversation.bookingId}>
                      <ListItem
                        button
                        onClick={() => handleOpenChat(conversation)}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          bgcolor: selectedConversation?.bookingId === conversation.bookingId ? 'action.selected' : 'transparent'
                        }}
                      >
                        <ListItemAvatar>
                          <Badge
                            badgeContent={conversation.unreadCount}
                            color="error"
                            invisible={conversation.unreadCount === 0}
                          >
                            <Avatar
                              src={conversation.student?.profileImage}
                              sx={{ bgcolor: 'primary.main' }}
                            >
                              {conversation.student?.name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {conversation.student?.name}
                              </Typography>
                              {!conversation.canChat && (
                                <Chip
                                  label="Expired"
                                  size="small"
                                  color="warning"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              {conversation.lastMessage ? (
                                <>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {conversation.lastMessage.senderName}: {conversation.lastMessage.message}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatTime(conversation.lastMessage.createdAt)}
                                  </Typography>
                                </>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No messages yet
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < conversations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={8}>
              {chatOpen && selectedConversation ? (
                <ChatWindow
                  bookingId={selectedConversation.bookingId}
                  receiverId={selectedConversation.student?._id}
                  receiverName={selectedConversation.student?.name}
                  receiverImage={selectedConversation.student?.profileImage}
                  onClose={() => {
                    setChatOpen(false);
                    setSelectedConversation(null);
                    fetchConversations(); // Refresh to update unread counts
                  }}
                  userRole="staff"
                  canChat={selectedConversation.canChat}
                />
              ) : (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box>
                    <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      Select a conversation to start chatting
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Grid>
          </Grid>
        )}

        {/* Chat Window (for mobile/fixed position) */}
        {chatOpen && selectedConversation && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1300,
              display: { xs: 'block', md: 'none' }
            }}
          >
            <ChatWindow
              bookingId={selectedConversation.bookingId}
              receiverId={selectedConversation.student?._id}
              receiverName={selectedConversation.student?.name}
              receiverImage={selectedConversation.student?.profileImage}
              onClose={() => {
                setChatOpen(false);
                setSelectedConversation(null);
                fetchConversations();
              }}
              userRole="staff"
              canChat={selectedConversation.canChat}
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ChatPage;

