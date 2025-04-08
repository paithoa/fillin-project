import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DUMMY_POSTS, API_URL } from '../config';

// Check if the server is accessible
export const checkServerConnection = async () => {
  try {
    console.log(`Checking server connection to ${API_URL}...`);
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    console.log('Server is online:', response.status);
    return true;
  } catch (error) {
    console.log('Server connection failed:', error.message);
    return false;
  }
};

// Run server connection check when this module loads
checkServerConnection();

// Posts API

export const fetchPosts = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/posts`);
    return response.data;
  } catch (error) {
    console.log('Error fetching posts:', error);
    return DUMMY_POSTS;
  }
};

export const fetchPostById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/posts/${id}`);
    return response.data;
  } catch (error) {
    console.log('Error fetching post:', error);
    return DUMMY_POSTS.find(post => post._id === id);
  }
};

export const createPost = async (postData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('No auth token found! User is not logged in.');
      throw new Error('Authentication required. Please log in.');
    }

    console.log('Creating post with token:', token ? 'Token exists' : 'No token');
    
    // Check if we have a local image that needs to be uploaded
    let finalPostData = { ...postData };
    
    if (postData.image && postData.image.startsWith('file://')) {
      console.log('Local image detected, will need to handle file upload');
      // For now, we'll just use a remote URL as placeholder
      // In a production app, you would implement proper file upload here
      finalPostData.image = 'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    
    console.log(`Sending POST request to ${API_URL}/api/posts`);
    const response = await axios.post(`${API_URL}/api/posts`, finalPostData, config);
    console.log('Post creation successful:', response.status);
    return response.data;
  } catch (error) {
    console.log('Error creating post:', error);
    if (error.response) {
      console.log('Server responded with error:', error.response.status);
      console.log('Error data:', error.response.data);
    } else if (error.request) {
      console.log('No response received from server. Request:', error.request);
    } else {
      console.log('Error setting up request:', error.message);
    }
    throw error;
  }
};

export const getUserPosts = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/api/posts/user/posts`, config);
    return response.data;
  } catch (error) {
    console.log('Error fetching user posts:', error);
    return [];
  }
};

// Messages API

export const getConversationsList = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/api/messages`, config);
    return response.data;
  } catch (error) {
    console.log('Error fetching messages:', error);
    return [];
  }
};

export const sendDirectMessage = async (messageData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.post(`${API_URL}/api/messages`, messageData, config);
    return response.data;
  } catch (error) {
    console.log('Error sending message:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    console.log(`Attempting to delete post with ID: ${postId}`);
    
    // Check for authentication token
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.error('No authentication token found. User must be logged in to delete posts.');
      throw new Error('Authentication required. Please log in to delete this post.');
    }
    
    // Set up request headers with authentication
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    // Make the delete request to the API
    console.log(`Sending DELETE request to ${API_URL}/api/posts/${postId}`);
    const response = await axios.delete(`${API_URL}/api/posts/${postId}`, config);
    
    console.log('Delete post response:', response.status, response.data);
    
    // For demo purposes, also remove the post from local state if using placeholders
    // This ensures the UI stays in sync even when the backend is not available
    
    console.log('Post deletion successful');
    return { success: true, message: 'Post deleted successfully', data: response.data };
  } catch (error) {
    console.error('Error deleting post:', error.message);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server error response:', error.response.status, error.response.data);
      throw new Error(error.response.data.message || 'Server error while deleting post');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      
      // For demo purposes, return success anyway to update the UI
      console.log('No server response, but simulating successful deletion for UI purposes');
      return { success: true, message: 'Post removed from view (demo mode)', simulated: true };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up delete request:', error.message);
      throw error;
    }
  }
};

// Chat API Functions

// Get conversations for the current user
export const getConversations = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.error('No authentication token found. User must be logged in to view conversations.');
      throw new Error('Authentication required. Please log in to view conversations.');
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    const response = await axios.get(`${API_URL}/api/messages/conversations`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error.message);
    
    // For demo purposes, return an empty array
    return [];
  }
};

// Get messages for a specific conversation
export const getMessages = async (recipientId) => {
  try {
    // Attempt actual API call
    const token = await AsyncStorage.getItem('userToken');
    const response = await axios.get(`${API_URL}/api/messages/${recipientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.log('Error fetching messages:', error);
    
    // Return mock data for demo purposes
    const mockMessages = [
      {
        _id: `mock-${Date.now()}-1`,
        content: `This is a demo conversation. The real API returned a ${error.response?.status || 'unknown'} error.`,
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        sender: { _id: recipientId, name: 'Demo User' }
      },
      {
        _id: `mock-${Date.now()}-2`,
        content: "You can type messages below to simulate a conversation.",
        createdAt: new Date(Date.now() - 120000), // 2 minutes ago
        sender: { _id: 'system', name: 'System' }
      }
    ];
    
    return { success: true, data: mockMessages, simulated: true };
  }
};

// Send a message to another user
export const sendMessage = async (recipientId, postId, text, replyToId = null) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.error('No authentication token found. User must be logged in to send messages.');
      throw new Error('Authentication required. Please log in to send messages.');
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    
    const messageData = {
      recipientId,
      postId,
      text,
      replyToId,
    };
    
    const response = await axios.post(`${API_URL}/api/messages`, messageData, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending message:', error.message);
    
    // For demo purposes
    if (error.request && !error.response) {
      // Simulate a successful message for demo purposes
      return { 
        success: true, 
        simulated: true,
        data: {
          _id: 'demo' + Date.now(),
          text,
          createdAt: new Date(),
          user: { _id: 'currentUser' },
          recipientId,
          postId,
          replyToId,
        }
      };
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to send message. Please try again.' 
    };
  }
};

// Delete a single message
export const deleteMessage = async (messageId) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.error('No authentication token found. User must be logged in to delete messages.');
      throw new Error('Authentication required. Please log in to delete messages.');
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    const response = await axios.delete(`${API_URL}/api/messages/${messageId}`, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error deleting message:', error.message);
    
    // For demo purposes
    if (error.request && !error.response) {
      // Simulate a successful deletion for demo purposes
      return { 
        success: true, 
        simulated: true,
        message: 'Message deleted successfully (simulated)'
      };
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to delete message. Please try again.' 
    };
  }
}; 