const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: 4000,
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'sticker', 'gif'],
      default: 'text'
    },
    media: {
      url: String,
      filename: String,
      size: Number,
      mimeType: String,
      width: Number,
      height: Number,
      duration: Number, // for audio/video
      thumbnail: String
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    contact: {
      name: String,
      phone: String,
      email: String
    },
    sticker: {
      set: String,
      emoji: String
    }
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  forwardedFrom: {
    originalMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    originalSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    originalChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: {
    type: Date,
    default: null
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Auto-delete settings
  expiresAt: {
    type: Date,
    default: null
  },
  // Message status
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  }
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'content.type': 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId });
    this.status = 'read';
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
};

// Method to edit message
messageSchema.methods.editContent = function(newContent) {
  // Save to edit history
  this.editHistory.push({
    content: this.content.text,
    editedAt: new Date()
  });
  
  // Update content
  this.content.text = newContent;
  this.isEdited = true;
};

// Method to soft delete message
messageSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
};

// Method to pin message
messageSchema.methods.pin = function(userId) {
  this.isPinned = true;
  this.pinnedAt = new Date();
  this.pinnedBy = userId;
};

// Method to unpin message
messageSchema.methods.unpin = function() {
  this.isPinned = false;
  this.pinnedAt = null;
  this.pinnedBy = null;
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

// Method to get reaction count by emoji
messageSchema.methods.getReactionCount = function(emoji) {
  return this.reactions.filter(r => r.emoji === emoji).length;
};

// Static method to get unread count for user in chat
messageSchema.statics.getUnreadCount = function(chatId, userId) {
  return this.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    'readBy.user': { $ne: userId },
    isDeleted: false
  });
};

module.exports = mongoose.model('Message', messageSchema);