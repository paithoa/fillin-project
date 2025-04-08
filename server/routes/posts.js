const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');

// Middleware to authenticate token
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized' });
  }
};

// @route   GET api/posts
// @desc    Get all posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ date: -1 })
      .populate('user', 'name email profileImage');
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'name email profileImage');
      
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, sportType, location, date, playersNeeded, grade, lookingToJoin } = req.body;
    
    // Create new post
    const newPost = new Post({
      title,
      description, 
      sportType,
      location,
      date: date || Date.now(),
      playersNeeded: parseInt(playersNeeded) || 0,
      grade,
      lookingToJoin: lookingToJoin || false,
      user: req.user.id
    });
    
    const post = await newPost.save();
    
    // Populate user data before returning
    await post.populate('user', 'name email profileImage');
    
    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await post.deleteOne();
    
    res.json({ message: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   PUT api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Update fields
    const { title, description, sportType, location, date, playersNeeded, grade, lookingToJoin } = req.body;
    
    if (title) post.title = title;
    if (description) post.description = description;
    if (sportType) post.sportType = sportType;
    if (location) post.location = location;
    if (date) post.date = date;
    if (playersNeeded !== undefined) post.playersNeeded = parseInt(playersNeeded) || 0;
    if (grade) post.grade = grade;
    if (lookingToJoin !== undefined) post.lookingToJoin = lookingToJoin;
    
    await post.save();
    
    // Populate user data before returning
    await post.populate('user', 'name email profileImage');
    
    res.json(post);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.status(500).send('Server error');
  }
});

module.exports = router; 