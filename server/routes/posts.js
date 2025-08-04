const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadPostMedia, handleMulterError } = require('../middleware/upload');
const { uploadImage, uploadVideo } = require('../utils/cloudinary');

// @route   GET /api/posts
// @desc    Get posts feed
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'post' } = req.query;
    const skip = (page - 1) * limit;

    // Get posts from user's following list and own posts
    const user = await User.findById(req.user._id).populate('following');
    const followingIds = user.following.map(f => f._id);
    followingIds.push(req.user._id);

    const posts = await Post.find({
      author: { $in: followingIds },
      type: type,
      isArchived: false
    })
    .populate('author', 'username displayName avatar isVerified')
    .populate('likes.user', 'username displayName avatar')
    .populate('comments.user', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({
      posts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(posts.length / limit),
      hasMore: posts.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/explore
// @desc    Get explore posts
// @access  Private
router.get('/explore', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      type: 'post',
      isArchived: false,
      visibility: 'public'
    })
    .populate('author', 'username displayName avatar isVerified')
    .sort({ likesCount: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    console.error('Get explore posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, uploadPostMedia, handleMulterError, async (req, res) => {
  try {
    const { text, type = 'post', location, tags, visibility = 'public' } = req.body;
    
    if (!text && !req.files?.images && !req.files?.videos) {
      return res.status(400).json({ message: 'Post must have text, images, or videos' });
    }

    const postData = {
      author: req.user._id,
      content: { text },
      type,
      visibility,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };

    // Add location if provided
    if (location) {
      try {
        const locationData = JSON.parse(location);
        postData.location = locationData;
      } catch (e) {
        // Ignore invalid location data
      }
    }

    // Handle image uploads
    if (req.files?.images) {
      const imagePromises = req.files.images.map(async (file) => {
        const result = await uploadImage(file.buffer, 'socialgram/posts');
        return {
          url: result.url,
          width: result.width,
          height: result.height,
          alt: text || 'Post image'
        };
      });
      
      postData.content.images = await Promise.all(imagePromises);
    }

    // Handle video uploads
    if (req.files?.videos) {
      const videoPromises = req.files.videos.map(async (file) => {
        const result = await uploadVideo(file.buffer, 'socialgram/posts');
        return {
          url: result.url,
          thumbnail: result.thumbnail,
          duration: result.duration
        };
      });
      
      postData.content.videos = await Promise.all(videoPromises);
    }

    const post = new Post(postData);
    await post.save();

    // Update user's posts count
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

    // Populate the post for response
    await post.populate('author', 'username displayName avatar isVerified');

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar isVerified')
      .populate('likes.user', 'username displayName avatar')
      .populate('comments.user', 'username displayName avatar')
      .populate('comments.replies.user', 'username displayName avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.toggleLike(req.user._id);
    await post.save();

    // Emit real-time notification if liked
    if (isLiked && post.author.toString() !== req.user._id.toString()) {
      const { io } = require('../index');
      io.emit('like_post', {
        userId: post.author,
        likerName: req.user.displayName,
        postId: post._id
      });
    }

    res.json({ 
      liked: isLiked, 
      likesCount: post.likesCount 
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.addComment(req.user._id, text.trim());
    await post.save();

    // Populate the new comment
    await post.populate('comments.user', 'username displayName avatar');
    const newComment = post.comments[post.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/user/:username
// @desc    Get user's posts
// @access  Private
router.get('/user/:username', auth, async (req, res) => {
  try {
    const { page = 1, limit = 12, type = 'post' } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({
      author: user._id,
      type: type,
      isArchived: false
    })
    .populate('author', 'username displayName avatar isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user owns the post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    // Update user's posts count
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;