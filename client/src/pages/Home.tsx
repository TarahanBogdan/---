import React from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
} from '@mui/material';
import { TrendingUp, People, Photo } from '@mui/icons-material';

const Home: React.FC = () => {
  // Mock data - в реальному застосунку це буде з API
  const stories = [
    { id: 1, username: 'user1', avatar: '', hasNew: true },
    { id: 2, username: 'user2', avatar: '', hasNew: false },
    { id: 3, username: 'user3', avatar: '', hasNew: true },
    { id: 4, username: 'user4', avatar: '', hasNew: false },
  ];

  const suggestedUsers = [
    { id: 1, username: 'suggested1', displayName: 'Suggested User 1', mutualFriends: 5 },
    { id: 2, username: 'suggested2', displayName: 'Suggested User 2', mutualFriends: 3 },
    { id: 3, username: 'suggested3', displayName: 'Suggested User 3', mutualFriends: 8 },
  ];

  return (
    <Container maxWidth="lg">
      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Stories Section */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Історії
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
              {stories.map((story) => (
                <Box key={story.id} sx={{ textAlign: 'center', minWidth: 70 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      border: story.hasNew ? '3px solid #ff4081' : '3px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {story.username[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    {story.username}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Posts Feed */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
              Стрічка новин
            </Typography>
            
            {/* Mock posts - буде замінено реальними постами */}
            {[1, 2, 3].map((postId) => (
              <Paper 
                key={postId}
                elevation={0}
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden'
                }}
              >
                {/* Post Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>U</Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      user{postId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      2 години тому
                    </Typography>
                  </Box>
                </Box>

                {/* Post Image Placeholder */}
                <Box
                  sx={{
                    height: 300,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Photo sx={{ fontSize: 60, color: 'grey.400' }} />
                </Box>

                {/* Post Content */}
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Це приклад поста #{postId}. Тут буде текст поста від користувача.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="#фото" size="small" />
                    <Chip label="#соціальна_мережа" size="small" />
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Stats */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Статистика
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Активність сьогодні
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    +24%
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Нові підписники
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    +12
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Suggested Users */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Рекомендації
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {suggestedUsers.map((user) => (
                <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 40, height: 40 }}>
                    {user.displayName[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {user.displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{user.username} • {user.mutualFriends} спільних друзів
                    </Typography>
                  </Box>
                  <Chip 
                    label="Підписатися" 
                    size="small" 
                    clickable 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;