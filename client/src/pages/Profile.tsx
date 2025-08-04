import React from 'react';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  Grid,
  Chip,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Settings,
  PhotoCamera,
  GridOn,
  BookmarkBorder,
  PersonAdd,
  Message,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [tabValue, setTabValue] = React.useState(0);

  // Mock user data - в реальному застосунку це буде з API
  const profileUser = {
    id: '1',
    username: username || 'testuser',
    displayName: 'Тестовий Користувач',
    bio: 'Фотограф та мандрівник 📸 Люблю природу та гарні кадри 🌿',
    avatar: '',
    coverPhoto: '',
    postsCount: 127,
    followersCount: 1240,
    followingCount: 456,
    isVerified: true,
    isPrivate: false,
    isFollowing: false,
    isOwnProfile: username === currentUser?.username,
  };

  const mockPosts = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    image: `https://picsum.photos/400/400?random=${i}`,
    likesCount: Math.floor(Math.random() * 100),
    commentsCount: Math.floor(Math.random() * 20),
  }));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      {/* Profile Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 3, 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Grid container spacing={4} alignItems="center">
          {/* Avatar */}
          <Grid item xs={12} sm={4} md={3}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={profileUser.avatar} 
                  sx={{ 
                    width: { xs: 120, md: 150 }, 
                    height: { xs: 120, md: 150 },
                    border: '4px solid',
                    borderColor: 'primary.main',
                  }}
                >
                  {profileUser.displayName[0]}
                </Avatar>
                {profileUser.isOwnProfile && (
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    }}
                  >
                    <PhotoCamera />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Profile Info */}
          <Grid item xs={12} sm={8} md={9}>
            <Box>
              {/* Username and Actions */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 2,
                flexWrap: 'wrap'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {profileUser.username}
                  {profileUser.isVerified && (
                    <Chip 
                      label="✓" 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1, fontSize: '0.7rem' }} 
                    />
                  )}
                </Typography>
                
                {profileUser.isOwnProfile ? (
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    size="small"
                  >
                    Редагувати профіль
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={profileUser.isFollowing ? "outlined" : "contained"}
                      startIcon={<PersonAdd />}
                      size="small"
                    >
                      {profileUser.isFollowing ? 'Відписатися' : 'Підписатися'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Message />}
                      size="small"
                    >
                      Написати
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Stats */}
              <Box sx={{ display: 'flex', gap: 4, mb: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {profileUser.postsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    постів
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {profileUser.followersCount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    підписників
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {profileUser.followingCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    підписок
                  </Typography>
                </Box>
              </Box>

              {/* Display Name and Bio */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {profileUser.displayName}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {profileUser.bio}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Content Tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden'
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          centered
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Tab 
            icon={<GridOn />} 
            label="ПОСТИ" 
            iconPosition="start"
          />
          <Tab 
            icon={<BookmarkBorder />} 
            label="ЗБЕРЕЖЕНІ" 
            iconPosition="start"
            disabled={!profileUser.isOwnProfile}
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Grid container spacing={2}>
              {mockPosts.map((post) => (
                <Grid item xs={4} key={post.id}>
                  <Box
                    sx={{
                      aspectRatio: '1',
                      backgroundImage: `url(${post.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: 2,
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        '&::after': {
                          opacity: 1,
                        },
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        display: 'flex',
                        gap: 2,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        zIndex: 1,
                        '&:hover': {
                          opacity: 1,
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ❤️ {post.likesCount}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        💬 {post.commentsCount}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          {tabValue === 1 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <BookmarkBorder sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Збережених постів немає
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ваші збережені пости будуть відображатися тут
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;