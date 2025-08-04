import React from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Card,
  CardMedia,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search, TrendingUp, Photo } from '@mui/icons-material';

const Explore: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Mock trending tags
  const trendingTags = [
    { tag: 'фотографія', count: 1234 },
    { tag: 'природа', count: 856 },
    { tag: 'подорожі', count: 742 },
    { tag: 'мистецтво', count: 623 },
    { tag: 'їжа', count: 591 },
    { tag: 'спорт', count: 445 },
    { tag: 'технології', count: 387 },
    { tag: 'музика', count: 234 },
  ];

  // Mock posts with different sizes for masonry layout
  const explorePosts = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    image: `https://picsum.photos/400/${300 + (i % 3) * 100}?random=${i}`,
    likesCount: Math.floor(Math.random() * 1000),
    commentsCount: Math.floor(Math.random() * 100),
    author: {
      username: `user${i + 1}`,
      avatar: '',
    },
    tags: trendingTags.slice(0, Math.floor(Math.random() * 4) + 1),
  }));

  return (
    <Container maxWidth="lg">
      {/* Search Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
          Дослідження
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', opacity: 0.9 }}>
          Відкривайте нових людей та цікавий контент
        </Typography>
        <TextField
          fullWidth
          placeholder="Пошук постів, людей, тегів..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{
            maxWidth: 600,
            mx: 'auto',
            display: 'block',
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 3,
            },
          }}
        />
      </Paper>

      <Grid container spacing={3}>
        {/* Trending Section */}
        <Grid item xs={12} md={4}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Популярні теги
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {trendingTags.map((item, index) => (
                <Box key={item.tag} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      minWidth: 24,
                      textAlign: 'center'
                    }}
                  >
                    {index + 1}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      #{item.tag}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.count.toLocaleString()} постів
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Quick Stats */}
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
              Статистика платформи
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  1.2M+
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Активних користувачів
                </Typography>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  5.7M+
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Опублікованих постів
                </Typography>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  23M+
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Взаємодій щодня
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Posts Grid */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Популярні пости
          </Typography>
          
          <Grid container spacing={2}>
            {explorePosts.map((post) => (
              <Grid item xs={6} sm={4} key={post.id}>
                <Card 
                  sx={{ 
                    borderRadius: 3,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      image={post.image}
                      alt={`Post ${post.id}`}
                      sx={{ 
                        aspectRatio: '1',
                        objectFit: 'cover',
                      }}
                    />
                    
                    {/* Overlay with stats */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        alignItems: 'flex-end',
                        p: 2,
                        '&:hover': {
                          opacity: 1,
                        },
                      }}
                    >
                      <Box sx={{ color: 'white', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            {post.author.username[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            @{post.author.username}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                          <Typography variant="caption">
                            ❤️ {post.likesCount}
                          </Typography>
                          <Typography variant="caption">
                            💬 {post.commentsCount}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {post.tags.slice(0, 2).map((tag, index) => (
                            <Chip
                              key={index}
                              label={`#${tag.tag}`}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                fontSize: '0.6rem',
                                height: 20,
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Load More */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Прокрутіть вниз, щоб побачити більше контенту
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Explore;