import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  Typography,
} from '@mui/material';
import {
  Home,
  Explore,
  Message,
  Add,
  Person,
  Group,
  Notifications,
  BookmarkBorder,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

interface SidebarItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mainItems: SidebarItem[] = [
    { text: 'Головна', icon: <Home />, path: '/' },
    { text: 'Дослідження', icon: <Explore />, path: '/explore' },
    { text: 'Повідомлення', icon: <Message />, path: '/messages', badge: 3 },
    { text: 'Створити пост', icon: <Add />, path: '/create' },
    { text: 'Мій профіль', icon: <Person />, path: `/profile/${user?.username || ''}` },
  ];

  const secondaryItems: SidebarItem[] = [
    { text: 'Сповіщення', icon: <Notifications />, path: '/notifications' },
    { text: 'Збережені', icon: <BookmarkBorder />, path: '/saved' },
    { text: 'Групи', icon: <Group />, path: '/groups' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      {/* Spacer for AppBar */}
      <Box sx={{ height: 64 }} />
      
      <Box sx={{ overflow: 'auto', p: 2 }}>
        {/* User Info */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.7)' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Привіт, {user?.displayName}!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            @{user?.username}
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              <strong>{user?.postsCount || 0}</strong> постів
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>{user?.followersCount || 0}</strong> підписників
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>{user?.followingCount || 0}</strong> підписок
            </Typography>
          </Box>
        </Box>

        {/* Main Navigation */}
        <List sx={{ py: 0 }}>
          {mainItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  backgroundColor: isActiveRoute(item.path) 
                    ? 'rgba(103, 126, 234, 0.1)' 
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isActiveRoute(item.path)
                      ? 'rgba(103, 126, 234, 0.15)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActiveRoute(item.path) ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    color: isActiveRoute(item.path) ? 'primary.main' : 'text.primary',
                    '& .MuiListItemText-primary': {
                      fontWeight: isActiveRoute(item.path) ? 600 : 400,
                    },
                  }}
                />
                {item.badge && (
                  <Box
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.badge}
                  </Box>
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Secondary Navigation */}
        <Typography variant="overline" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
          Інше
        </Typography>
        <List sx={{ py: 1 }}>
          {secondaryItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  backgroundColor: isActiveRoute(item.path) 
                    ? 'rgba(103, 126, 234, 0.1)' 
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: isActiveRoute(item.path)
                      ? 'rgba(103, 126, 234, 0.15)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActiveRoute(item.path) ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    color: isActiveRoute(item.path) ? 'primary.main' : 'text.primary',
                    '& .MuiListItemText-primary': {
                      fontWeight: isActiveRoute(item.path) ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;