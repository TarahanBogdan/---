import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Types
interface Message {
  _id: string;
  chat: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  content: {
    text: string;
    type: string;
    media?: {
      url: string;
      filename?: string;
      thumbnail?: string;
    };
  };
  createdAt: string;
  isEdited: boolean;
  reactions: Array<{
    user: string;
    emoji: string;
  }>;
}

interface Notification {
  type: string;
  message: string;
  userId?: string;
  postId?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, message: any) => void;
  sendTyping: (chatId: string, isTyping: boolean) => void;
  onNewMessage: (callback: (message: Message) => void) => void;
  onUserTyping: (callback: (data: { userId: string; isTyping: boolean }) => void) => void;
  onNotification: (callback: (notification: Notification) => void) => void;
}

// Create context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Socket Provider Component
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Create socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        // Join user's personal room for notifications
        newSocket.emit('join_user', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Online users updates
      newSocket.on('online_users', (users: string[]) => {
        setOnlineUsers(users);
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect if not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  // Join chat room
  const joinChat = (chatId: string) => {
    if (socket) {
      socket.emit('join_chat', chatId);
    }
  };

  // Leave chat room
  const leaveChat = (chatId: string) => {
    if (socket) {
      socket.emit('leave_chat', chatId);
    }
  };

  // Send message
  const sendMessage = (chatId: string, message: any) => {
    if (socket) {
      socket.emit('send_message', { chatId, ...message });
    }
  };

  // Send typing indicator
  const sendTyping = (chatId: string, isTyping: boolean) => {
    if (socket) {
      if (isTyping) {
        socket.emit('typing', { chatId, userId: user?.id });
      } else {
        socket.emit('stop_typing', { chatId, userId: user?.id });
      }
    }
  };

  // Listen for new messages
  const onNewMessage = (callback: (message: Message) => void) => {
    if (socket) {
      socket.on('new_message', callback);
      return () => socket.off('new_message', callback);
    }
  };

  // Listen for typing indicators
  const onUserTyping = (callback: (data: { userId: string; isTyping: boolean }) => void) => {
    if (socket) {
      socket.on('user_typing', (data) => callback({ ...data, isTyping: true }));
      socket.on('user_stop_typing', (data) => callback({ ...data, isTyping: false }));
      
      return () => {
        socket.off('user_typing');
        socket.off('user_stop_typing');
      };
    }
  };

  // Listen for notifications
  const onNotification = (callback: (notification: Notification) => void) => {
    if (socket) {
      socket.on('notification', callback);
      return () => socket.off('notification', callback);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    onNewMessage,
    onUserTyping,
    onNotification,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket context
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;