import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Divider,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Search,
  Send,
  AttachFile,
  EmojiEmotions,
  Call,
  VideoCall,
  MoreVert,
  Online,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
  isOnline: boolean;
  type: 'direct' | 'group' | 'channel';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
  isOwn: boolean;
}

const Messages: React.FC = () => {
  const { chatId } = useParams();
  const [selectedChat, setSelectedChat] = useState<string | null>(chatId || null);
  const [messageText, setMessageText] = useState('');
  const [searchText, setSearchText] = useState('');

  // Mock data
  const chats: Chat[] = [
    {
      id: '1',
      name: 'Олексій Петренко',
      lastMessage: 'Привіт! Як справи?',
      timestamp: '14:30',
      unreadCount: 2,
      isOnline: true,
      type: 'direct'
    },
    {
      id: '2',
      name: 'Команда проекту',
      lastMessage: 'Зустріч о 16:00',
      timestamp: '13:45',
      unreadCount: 0,
      isOnline: false,
      type: 'group'
    },
    {
      id: '3',
      name: 'Марія Коваленко',
      lastMessage: 'Дякую за допомогу!',
      timestamp: 'Вчора',
      unreadCount: 1,
      isOnline: false,
      type: 'direct'
    },
    {
      id: '4',
      name: 'Новини IT',
      lastMessage: 'Нова версія React вийшла',
      timestamp: 'Вчора',
      unreadCount: 0,
      isOnline: false,
      type: 'channel'
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      senderId: '2',
      senderName: 'Олексій Петренко',
      content: 'Привіт! Як справи?',
      timestamp: '14:25',
      type: 'text',
      isOwn: false
    },
    {
      id: '2',
      senderId: '1',
      senderName: 'Ви',
      content: 'Привіт! Все добре, дякую. А у тебе як?',
      timestamp: '14:26',
      type: 'text',
      isOwn: true
    },
    {
      id: '3',
      senderId: '2',
      senderName: 'Олексій Петренко',
      content: 'Теж непогано. Працюю над новим проектом.',
      timestamp: '14:27',
      type: 'text',
      isOwn: false
    },
    {
      id: '4',
      senderId: '1',
      senderName: 'Ви',
      content: 'Звучить цікаво! Розкажеш більше?',
      timestamp: '14:30',
      type: 'text',
      isOwn: true
    },
  ];

  const currentChat = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Тут буде логіка відправки повідомлення
      console.log('Sending message:', messageText);
      setMessageText('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'group':
        return '👥';
      case 'channel':
        return '📢';
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Chat List */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper 
            elevation={0} 
            sx={{ 
              height: '100%', 
              borderRadius: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Search Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Повідомлення
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Пошук чатів..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  },
                }}
              />
            </Box>

            {/* Chat List */}
            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
              {chats.map((chat) => (
                <ListItem
                  key={chat.id}
                  button
                  selected={selectedChat === chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        chat.isOnline ? (
                          <Online sx={{ color: 'success.main', fontSize: 16 }} />
                        ) : null
                      }
                    >
                      <Avatar>
                        {getTypeIcon(chat.type) || chat.name[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>
                          {chat.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {chat.timestamp}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          noWrap 
                          sx={{ flex: 1, mr: 1 }}
                        >
                          {chat.lastMessage}
                        </Typography>
                        {chat.unreadCount > 0 && (
                          <Chip
                            label={chat.unreadCount}
                            size="small"
                            color="primary"
                            sx={{ minWidth: 24, height: 20, fontSize: '0.75rem' }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8} lg={9}>
          {selectedChat ? (
            <Paper 
              elevation={0} 
              sx={{ 
                height: '100%', 
                borderRadius: 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Chat Header */}
              <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar>
                    {getTypeIcon(currentChat?.type || '') || currentChat?.name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {currentChat?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {currentChat?.isOnline ? 'в мережі' : 'був(-ла) недавно'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton color="primary">
                    <Call />
                  </IconButton>
                  <IconButton color="primary">
                    <VideoCall />
                  </IconButton>
                  <IconButton>
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>

              {/* Messages Area */}
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: 2,
                backgroundColor: 'grey.50'
              }}>
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        maxWidth: '70%',
                        borderRadius: 2,
                        backgroundColor: message.isOwn ? 'primary.main' : 'white',
                        color: message.isOwn ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 0.5,
                          opacity: 0.7,
                          textAlign: 'right'
                        }}
                      >
                        {message.timestamp}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              {/* Message Input */}
              <Box sx={{ 
                p: 2, 
                borderTop: '1px solid', 
                borderColor: 'divider',
                backgroundColor: 'white'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                  <IconButton color="primary">
                    <AttachFile />
                  </IconButton>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Напишіть повідомлення..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      },
                    }}
                  />
                  <IconButton color="primary">
                    <EmojiEmotions />
                  </IconButton>
                  <IconButton 
                    color="primary" 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '&:disabled': {
                        backgroundColor: 'grey.300',
                      },
                    }}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ) : (
            <Box 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: 'grey.50'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Оберіть чат для початку спілкування
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Messages;