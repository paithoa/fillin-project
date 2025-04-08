const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
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

// @route   GET api/messages/:userId
// @desc    Get messages between current user and specified user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name email profileImage')
    .populate('receiver', 'name email profileImage')
    .populate('post', 'title description');
    
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { recipient, content, post } = req.body;
    
    // Create new message
    const newMessage = new Message({
      sender: req.user.id,
      receiver: recipient,
      content,
      post,
      isRead: false
    });
    
    const message = await newMessage.save();
    
    // Populate fields before returning
    await message.populate('sender', 'name email profileImage');
    await message.populate('receiver', 'name email profileImage');
    await message.populate('post', 'title description');
    
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/messages/:id/read
// @desc    Mark a message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    let message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the receiver
    if (message.receiver.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    // Mark as read
    message.isRead = true;
    await message.save();
    
    res.json(message);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(500).send('Server error');
  }
});

// @route   GET api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations/list', auth, async (req, res) => {
  try {
    // Find all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name email profileImage')
    .populate('receiver', 'name email profileImage')
    .populate('post', 'title description');
    
    // Create a map of conversations by other user ID
    const conversationsMap = {};
    
    messages.forEach(message => {
      const otherUser = message.sender._id.toString() === req.user.id 
        ? message.receiver 
        : message.sender;
      
      const otherUserId = otherUser._id.toString();
      
      if (!conversationsMap[otherUserId]) {
        conversationsMap[otherUserId] = {
          user: otherUser,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          post: message.post
        };
      }
      
      // Add message to conversation
      conversationsMap[otherUserId].messages.push(message);
      
      // Update last message
      if (!conversationsMap[otherUserId].lastMessage 
          || new Date(message.createdAt) > new Date(conversationsMap[otherUserId].lastMessage.createdAt)) {
        conversationsMap[otherUserId].lastMessage = message;
      }
      
      // Count unread messages
      if (message.receiver._id.toString() === req.user.id && !message.isRead) {
        conversationsMap[otherUserId].unreadCount++;
      }
    });
    
    // Convert map to array
    const conversations = Object.values(conversationsMap);
    
    // Sort by most recent message
    conversations.sort((a, b) => 
      new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)
    );
    
    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/messages/:userId
// @desc    Delete all messages between current user and specified user
// @access  Private
router.delete('/:userId', auth, async (req, res) => {
  try {
    // Delete all messages between the two users
    await Message.deleteMany({
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    });
    
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/messages/single/:id
// @desc    Delete a single message
// @access  Private
router.delete('/single/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await message.deleteOne();
    
    res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.status(500).send('Server error');
  }
});

module.exports = router; 