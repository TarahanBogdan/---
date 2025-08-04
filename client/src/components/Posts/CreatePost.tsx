import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Grid,
  Chip,
  Avatar,
  Card,
  CardMedia,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  PhotoCamera,
  Videocam,
  Close,
  LocationOn,
  Public,
  People,
  Lock,
  Add,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  preview: string;
}

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          const id = Math.random().toString(36).substr(2, 9);
          const preview = URL.createObjectURL(file);
          setMediaFiles(prev => [...prev, { id, file, type: 'image', preview }]);
        }
      });
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('video/')) {
          const id = Math.random().toString(36).substr(2, 9);
          const preview = URL.createObjectURL(file);
          setMediaFiles(prev => [...prev, { id, file, type: 'video', preview }]);
        }
      });
    }
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async () => {
    if (!text.trim() && mediaFiles.length === 0) {
      setError('Додайте текст або медіафайли до поста');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('visibility', visibility);
      formData.append('tags', tags.join(','));
      
      if (location) {
        formData.append('location', JSON.stringify({ name: location }));
      }

      // Add media files
      mediaFiles.forEach((media, index) => {
        if (media.type === 'image') {
          formData.append('images', media.file);
        } else {
          formData.append('videos', media.file);
        }
      });

      // Here you would make API call to create post
      console.log('Creating post with data:', {
        text,
        visibility,
        tags,
        location,
        mediaCount: mediaFiles.length
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reset form
      setText('');
      setMediaFiles([]);
      setTags([]);
      setLocation('');
      setVisibility('public');
      
      // Show success message or redirect
      alert('Пост успішно створено!');
      
    } catch (err: any) {
      setError(err.message || 'Помилка при створенні поста');
    } finally {
      setIsLoading(false);
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public':
        return <Public />;
      case 'followers':
        return <People />;
      default:
        return <Lock />;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Створити новий пост
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* User Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar src={user?.avatar} sx={{ width: 48, height: 48 }}>
            {user?.displayName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {user?.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              @{user?.username}
            </Typography>
          </Box>
        </Box>

        {/* Text Input */}
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Що у вас нового?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          variant="outlined"
          sx={{ mb: 3 }}
        />

        {/* Media Upload Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleVideoUpload}
          />
          
          <Button
            variant="outlined"
            startIcon={<PhotoCamera />}
            onClick={() => imageInputRef.current?.click()}
            disabled={isLoading}
          >
            Фото
          </Button>
          <Button
            variant="outlined"
            startIcon={<Videocam />}
            onClick={() => videoInputRef.current?.click()}
            disabled={isLoading}
          >
            Відео
          </Button>
        </Box>

        {/* Media Preview */}
        {mediaFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Медіафайли ({mediaFiles.length})
            </Typography>
            <Grid container spacing={2}>
              {mediaFiles.map((media) => (
                <Grid item xs={6} sm={4} md={3} key={media.id}>
                  <Card sx={{ position: 'relative' }}>
                    {media.type === 'image' ? (
                      <CardMedia
                        component="img"
                        height="150"
                        image={media.preview}
                        alt="Preview"
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <CardMedia
                        component="video"
                        height="150"
                        src={media.preview}
                        controls
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.9)',
                        },
                      }}
                      onClick={() => removeMedia(media.id)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Tags */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Теги
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                onDelete={() => removeTag(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Додати тег"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              sx={{ flexGrow: 1 }}
            />
            <IconButton color="primary" onClick={addTag} disabled={!newTag.trim()}>
              <Add />
            </IconButton>
          </Box>
        </Box>

        {/* Location */}
        <TextField
          fullWidth
          size="small"
          placeholder="Додати локацію"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          InputProps={{
            startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />,
          }}
          sx={{ mb: 3 }}
        />

        {/* Visibility and Submit */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Видимість</InputLabel>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              startAdornment={getVisibilityIcon()}
              sx={{ pl: 1 }}
            >
              <MenuItem value="public">
                <Public sx={{ mr: 1 }} /> Публічний
              </MenuItem>
              <MenuItem value="followers">
                <People sx={{ mr: 1 }} /> Підписники
              </MenuItem>
              <MenuItem value="private">
                <Lock sx={{ mr: 1 }} /> Приватний
              </MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={isLoading || (!text.trim() && mediaFiles.length === 0)}
            sx={{
              px: 4,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
              },
            }}
          >
            {isLoading ? 'Публікація...' : 'Опублікувати'}
          </Button>
        </Box>

        {isLoading && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>
    </Box>
  );
};

export default CreatePost;