const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// @route   GET /api/chats
// @desc    Get user's chats
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      'participants.user': req.user._id
    })
    .populate('participants.user', 'username displayName avatar isOnline lastSeen')
    .populate('lastMessage', 'content createdAt sender')
    .populate('lastMessage.sender', 'username displayName avatar')
    .sort({ lastActivity: -1 });

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.getUnreadCount(chat._id, req.user._id);
        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats/direct
// @desc    Create or get direct chat
// @access  Private
router.post('/direct', auth, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create chat with yourself' });
    }

    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if direct chat already exists
    let chat = await Chat.findDirectChat(req.user._id, userId);

    if (!chat) {
      // Create new direct chat
      chat = new Chat({
        type: 'direct',
        participants: [
          { user: req.user._id, role: 'member' },
          { user: userId, role: 'member' }
        ],
        creator: req.user._id
      });
      await chat.save();
    }

    // Populate for response
    await chat.populate('participants.user', 'username displayName avatar isOnline lastSeen');

    res.json(chat);
  } catch (error) {
    console.error('Create direct chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats/group
// @desc    Create group chat
// @access  Private
router.post('/group', auth, async (req, res) => {
  try {
    const { name, description, participantIds = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    if (participantIds.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // Verify all participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({ message: 'Some participants not found' });
    }

    // Create participant list with creator as admin
    const participantList = [
      { user: req.user._id, role: 'admin' }
    ];

    participantIds.forEach(id => {
      if (id !== req.user._id.toString()) {
        participantList.push({ user: id, role: 'member' });
      }
    });

    const chat = new Chat({
      type: 'group',
      name: name.trim(),
      description: description?.trim() || '',
      participants: participantList,
      creator: req.user._id
    });

    chat.generateInviteLink();
    await chat.save();

    // Populate for response
    await chat.populate('participants.user', 'username displayName avatar');

    // Emit real-time notification to added participants
    const { io } = require('../index');
    participantIds.forEach(id => {
      if (id !== req.user._id.toString()) {
        io.to(`user_${id}`).emit('added_to_group', {
          chat: chat,
          addedBy: req.user.displayName
        });
      }
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats/channel
// @desc    Create channel
// @access  Private
router.post('/channel', auth, async (req, res) => {
  try {
    const { name, description, isPrivate = false } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Channel name is required' });
    }

    const chat = new Chat({
      type: 'channel',
      name: name.trim(),
      description: description?.trim() || '',
      participants: [
        { user: req.user._id, role: 'admin' }
      ],
      creator: req.user._id,
      settings: {
        isPrivate: isPrivate
      }
    });

    if (!isPrivate) {
      chat.generateInviteLink();
    }

    await chat.save();

    // Populate for response
    await chat.populate('participants.user', 'username displayName avatar');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chats/:id
// @desc    Get chat details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants.user', 'username displayName avatar isOnline lastSeen')
      .populate('creator', 'username displayName avatar')
      .populate('pinnedMessages', 'content sender createdAt')
      .populate('pinnedMessages.sender', 'username displayName avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant (for private chats/groups)
    if ((chat.type !== 'channel' || chat.settings.isPrivate) && 
        !chat.isParticipant(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats/:id/join
// @desc    Join a chat/channel
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if already a participant
    if (chat.isParticipant(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this chat' });
    }

    // Check if chat allows joining
    if (chat.type === 'direct') {
      return res.status(400).json({ message: 'Cannot join direct chats' });
    }

    if (chat.settings.isPrivate && !chat.settings.allowInvites) {
      return res.status(403).json({ message: 'This chat is private' });
    }

    // Add user to participants
    if (chat.type === 'channel') {
      chat.subscribers.push(req.user._id);
    } else {
      chat.addParticipant(req.user._id, 'member');
    }

    await chat.save();

    // Emit real-time notification
    const { io } = require('../index');
    io.to(`chat_${chat._id}`).emit('user_joined', {
      user: {
        _id: req.user._id,
        username: req.user.username,
        displayName: req.user.displayName,
        avatar: req.user.avatar
      },
      chatId: chat._id
    });

    res.json({ message: 'Successfully joined the chat' });
  } catch (error) {
    console.error('Join chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chats/:id/leave
// @desc    Leave a chat
// @access  Private
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isParticipant(req.user._id)) {
      return res.status(400).json({ message: 'Not a member of this chat' });
    }

    // Remove user from participants/subscribers
    if (chat.type === 'channel') {
      chat.subscribers = chat.subscribers.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      chat.removeParticipant(req.user._id);
    }

    await chat.save();

    // Emit real-time notification
    const { io } = require('../index');
    io.to(`chat_${chat._id}`).emit('user_left', {
      userId: req.user._id,
      username: req.user.username,
      chatId: chat._id
    });

    res.json({ message: 'Successfully left the chat' });
  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chats/:id
// @desc    Update chat settings
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, avatar } = req.body;

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user has permission to update
    const userRole = chat.getParticipantRole(req.user._id);
    if (userRole !== 'admin' && userRole !== 'moderator') {
      return res.status(403).json({ message: 'Not authorized to update this chat' });
    }

    // Update fields
    if (name && name.trim().length > 0) {
      chat.name = name.trim();
    }
    if (description !== undefined) {
      chat.description = description.trim();
    }
    if (avatar !== undefined) {
      chat.avatar = avatar;
    }

    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chats/:id
// @desc    Delete chat
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is admin or creator
    const userRole = chat.getParticipantRole(req.user._id);
    if (userRole !== 'admin' && chat.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chat._id });

    // Delete the chat
    await Chat.findByIdAndDelete(req.params.id);

    // Emit real-time notification
    const { io } = require('../index');
    io.to(`chat_${chat._id}`).emit('chat_deleted', {
      chatId: chat._id
    });

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;