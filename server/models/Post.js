const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  sportType: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  playersNeeded: {
    type: Number,
    default: 0
  },
  lookingToJoin: {
    type: Boolean,
    default: false
  },
  grade: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema); 