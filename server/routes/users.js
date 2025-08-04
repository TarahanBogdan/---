const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadSingle, handleMulterError } = require('../middleware/upload');
const { uploadImage } = require('../utils/cloudinary');

// @route   GET /api/users/search
// @desc    Search users
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const skip = (page - 1) * limit;

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { displayName: searchRegex }
      ]
    })
    .select('username displayName avatar isVerified followersCount')
    .skip(skip)
    .limit(parseInt(limit));

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:username
// @desc    Get user profile
// @access  Private
router.get('/:username', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user follows this user
    const isFollowing = user.followers.some(
      follower => follower._id.toString() === req.user._id.toString()
    );

    // Check if this user follows current user
    const isFollower = user.following.some(
      following => following._id.toString() === req.user._id.toString()
    );

    // Hide private information if not following and account is private
    const response = {
      ...user.toObject(),
      isFollowing,
      isFollower,
      isOwnProfile: user._id.toString() === req.user._id.toString()
    };

    if (user.isPrivate && !isFollowing && !response.isOwnProfile) {
      response.followers = [];
      response.following = [];
      response.bio = '';
    }

    res.json(response);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, uploadSingle, handleMulterError, async (req, res) => {
  try {
    const { displayName, bio, isPrivate } = req.body;
    const updateData = {};

    if (displayName) updateData.displayName = displayName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate === 'true';

    // Handle avatar upload
    if (req.file) {
      try {
        const result = await uploadImage(req.file.buffer, 'socialgram/avatars');
        updateData.avatar = result.url;
      } catch (uploadError) {
        console.error('Avatar upload error:', uploadError);
        return res.status(500).json({ message: 'Avatar upload failed' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Follow/unfollow user
// @access  Private
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(req.params.id);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(req.params.id);
      targetUser.followers.pull(req.user._id);
    } else {
      // Follow
      currentUser.following.push(req.params.id);
      targetUser.followers.push(req.user._id);

      // Emit real-time notification
      const { io } = require('../index');
      io.emit('new_follower', {
        userId: req.params.id,
        followerName: currentUser.displayName,
        followerId: req.user._id
      });
    }

    // Update counts
    await currentUser.updateFollowCounts();
    await targetUser.updateFollowCounts();

    res.json({
      isFollowing: !isFollowing,
      followersCount: targetUser.followersCount,
      followingCount: currentUser.followingCount
    });
  } catch (error) {
    console.error('Follow/unfollow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/followers
// @desc    Get user followers
// @access  Private
router.get('/:id/followers', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check privacy settings
    if (user.isPrivate && req.params.id !== req.user._id.toString()) {
      const isFollowing = user.followers.includes(req.user._id);
      if (!isFollowing) {
        return res.status(403).json({ message: 'This account is private' });
      }
    }

    const followers = await User.find({
      _id: { $in: user.followers }
    })
    .select('username displayName avatar isVerified followersCount')
    .skip(skip)
    .limit(parseInt(limit));

    res.json(followers);
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/following
// @desc    Get user following
// @access  Private
router.get('/:id/following', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check privacy settings
    if (user.isPrivate && req.params.id !== req.user._id.toString()) {
      const isFollowing = user.followers.includes(req.user._id);
      if (!isFollowing) {
        return res.status(403).json({ message: 'This account is private' });
      }
    }

    const following = await User.find({
      _id: { $in: user.following }
    })
    .select('username displayName avatar isVerified followersCount')
    .skip(skip)
    .limit(parseInt(limit));

    res.json(following);
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const { theme, language, notifications, privacy } = req.body;
    const updateData = {};

    if (theme) updateData['settings.theme'] = theme;
    if (language) updateData['settings.language'] = language;
    if (notifications) {
      Object.keys(notifications).forEach(key => {
        updateData[`settings.notifications.${key}`] = notifications[key];
      });
    }
    if (privacy) {
      Object.keys(privacy).forEach(key => {
        updateData[`settings.privacy.${key}`] = privacy[key];
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select('-password');

    res.json(user.settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/suggestions
// @desc    Get user suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get users that current user is not following
    const currentUser = await User.findById(req.user._id);
    const excludeIds = [...currentUser.following, req.user._id];

    const suggestions = await User.find({
      _id: { $nin: excludeIds },
      isPrivate: false
    })
    .select('username displayName avatar isVerified followersCount')
    .sort({ followersCount: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;