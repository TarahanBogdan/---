const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadSingle, handleMulterError } = require('../middleware/upload');
const { uploadImage, uploadVideo, uploadFile } = require('../utils/cloudinary');

// @route   GET /api/messages/:chatId
// @desc    Get messages for a chat
// @access  Private
router.get('/:chatId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is participant in chat
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({
      chat: req.params.chatId,
      isDeleted: false
    })
    .populate('sender', 'username displayName avatar isOnline lastSeen')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id } },
        $set: { status: 'read' }
      }
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, uploadSingle, handleMulterError, async (req, res) => {
  try {
    const { chatId, text, type = 'text', replyTo } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    if (!text && !req.file) {
      return res.status(400).json({ message: 'Message must have text or media' });
    }

    // Check if user is participant in chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messageData = {
      chat: chatId,
      sender: req.user._id,
      content: {
        text: text || '',
        type: type
      }
    };

    // Add reply reference
    if (replyTo) {
      messageData.replyTo = replyTo;
    }

    // Handle file upload
    if (req.file) {
      const fileType = req.file.mimetype.split('/')[0];
      
      try {
        let uploadResult;
        
        if (fileType === 'image') {
          uploadResult = await uploadImage(req.file.buffer, 'socialgram/messages');
          messageData.content.type = 'image';
        } else if (fileType === 'video') {
          uploadResult = await uploadVideo(req.file.buffer, 'socialgram/messages');
          messageData.content.type = 'video';
        } else {
          uploadResult = await uploadFile(req.file.buffer, req.file.originalname, 'socialgram/messages');
          messageData.content.type = 'file';
        }

        messageData.content.media = {
          url: uploadResult.url,
          filename: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          width: uploadResult.width,
          height: uploadResult.height,
          duration: uploadResult.duration,
          thumbnail: uploadResult.thumbnail
        };
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({ message: 'File upload failed' });
      }
    }

    const message = new Message(messageData);
    await message.save();

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.updateLastActivity();
    chat.stats.totalMessages += 1;
    
    if (req.file) {
      if (messageData.content.type === 'image' || messageData.content.type === 'video') {
        chat.stats.totalMedia += 1;
      } else {
        chat.stats.totalFiles += 1;
      }
    }
    
    await chat.save();

    // Populate message for response
    await message.populate('sender', 'username displayName avatar isOnline lastSeen');
    
    if (message.replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Emit real-time message to chat participants
    const { io } = require('../index');
    io.to(`chat_${chatId}`).emit('new_message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/messages/:id
// @desc    Edit a message
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Check if message is older than 48 hours
    const hoursSinceCreated = (Date.now() - message.createdAt) / (1000 * 60 * 60);
    if (hoursSinceCreated > 48) {
      return res.status(400).json({ message: 'Cannot edit messages older than 48 hours' });
    }

    message.editContent(text.trim());
    await message.save();

    // Emit real-time update
    const { io } = require('../index');
    io.to(`chat_${message.chat}`).emit('message_edited', {
      messageId: message._id,
      newText: text.trim(),
      isEdited: true
    });

    res.json(message);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/messages/:id
// @desc    Delete a message
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user owns the message or is admin of the chat
    const chat = await Chat.findById(message.chat);
    const userRole = chat.getParticipantRole(req.user._id);
    
    if (message.sender.toString() !== req.user._id.toString() && 
        userRole !== 'admin' && userRole !== 'moderator') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    message.softDelete();
    await message.save();

    // Emit real-time update
    const { io } = require('../index');
    io.to(`chat_${message.chat}`).emit('message_deleted', {
      messageId: message._id
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/messages/:id/reaction
// @desc    Add/remove reaction to message
// @access  Private
router.post('/:id/reaction', auth, async (req, res) => {
  try {
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is participant in the chat
    const chat = await Chat.findById(message.chat);
    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction && existingReaction.emoji === emoji) {
      // Remove reaction
      message.removeReaction(req.user._id);
    } else {
      // Add/update reaction
      message.addReaction(req.user._id, emoji);
    }

    await message.save();

    // Emit real-time update
    const { io } = require('../index');
    io.to(`chat_${message.chat}`).emit('message_reaction', {
      messageId: message._id,
      reactions: message.reactions
    });

    res.json({ reactions: message.reactions });
  } catch (error) {
    console.error('Message reaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/messages/unread/count
// @desc    Get unread messages count for all chats
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    // Get all chats user is participant in
    const chats = await Chat.find({
      'participants.user': req.user._id
    });

    const unreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const count = await Message.getUnreadCount(chat._id, req.user._id);
        return {
          chatId: chat._id,
          chatName: chat.name || 'Direct Message',
          unreadCount: count
        };
      })
    );

    const totalUnread = unreadCounts.reduce((sum, chat) => sum + chat.unreadCount, 0);

    res.json({
      totalUnread,
      chats: unreadCounts.filter(chat => chat.unreadCount > 0)
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;