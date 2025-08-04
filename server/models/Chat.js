const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['direct', 'group', 'channel'],
    required: true
  },
  name: {
    type: String,
    required: function() {
      return this.type !== 'direct';
    },
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    permissions: {
      canSendMessages: { type: Boolean, default: true },
      canSendMedia: { type: Boolean, default: true },
      canAddMembers: { type: Boolean, default: false },
      canDeleteMessages: { type: Boolean, default: false },
      canPinMessages: { type: Boolean, default: false }
    }
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    isPrivate: { type: Boolean, default: false },
    inviteLink: { type: String, default: '' },
    allowInvites: { type: Boolean, default: true },
    muteNotifications: { type: Boolean, default: false },
    autoDeleteMessages: {
      enabled: { type: Boolean, default: false },
      duration: { type: Number, default: 0 } // in seconds
    }
  },
  // Channel specific fields
  subscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscribersCount: {
    type: Number,
    default: 0
  },
  // Group specific fields
  membersCount: {
    type: Number,
    default: 0
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  // Chat statistics
  stats: {
    totalMessages: { type: Number, default: 0 },
    totalMedia: { type: Number, default: 0 },
    totalFiles: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ type: 1, lastActivity: -1 });
chatSchema.index({ creator: 1 });
chatSchema.index({ 'settings.inviteLink': 1 });

// Update counts before saving
chatSchema.pre('save', function(next) {
  if (this.type === 'channel') {
    this.subscribersCount = this.subscribers.length;
  } else {
    this.membersCount = this.participants.length;
  }
  next();
});

// Method to add participant
chatSchema.methods.addParticipant = function(userId, role = 'member') {
  const exists = this.participants.some(p => p.user.toString() === userId.toString());
  if (!exists) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
};

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Method to get participant role
chatSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  return participant ? participant.role : null;
};

// Method to update last activity
chatSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
};

// Method to generate invite link
chatSchema.methods.generateInviteLink = function() {
  if (this.type !== 'direct') {
    this.settings.inviteLink = `https://socialgram.com/invite/${this._id}`;
  }
};

// Static method to find direct chat between two users
chatSchema.statics.findDirectChat = function(user1Id, user2Id) {
  return this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] }
  });
};

module.exports = mongoose.model('Chat', chatSchema);