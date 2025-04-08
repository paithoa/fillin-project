import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth Services
export const register = async (userData) => {
  try {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const login = async (userData) => {
  try {
    const response = await api.post('/api/auth/login', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/users/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const updateUserProfile = async (userData) => {
  try {
    const response = await api.put('/api/users/me', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const upgradeToPremium = async () => {
  try {
    const response = await api.put('/api/users/premium');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

// Post Services
export const getPosts = async () => {
  try {
    const response = await api.get('/api/posts');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const getPostById = async (id) => {
  try {
    const response = await api.get(`/api/posts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const createPost = async (postData) => {
  try {
    const response = await api.post('/api/posts', postData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const updatePost = async (id, postData) => {
  try {
    const response = await api.put(`/api/posts/${id}`, postData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const deletePost = async (id) => {
  try {
    const response = await api.delete(`/api/posts/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

// Message Services
export const getMessages = async (userId) => {
  try {
    if (!userId) {
      console.error('getMessages called with invalid userId:', userId);
      return { success: false, error: { message: 'Invalid user ID' } };
    }
    
    const response = await api.get(`/api/messages/${userId}`);
    return { success: true, data: response.data || [] };
  } catch (error) {
    console.error('Error in getMessages:', error);
    return { success: false, error: error.response?.data || { message: 'Server error' } };
  }
};

export const sendDirectMessage = async (messageData) => {
  try {
    // Validate messageData
    if (!messageData || !messageData.recipient || !messageData.content || !messageData.post) {
      console.error('Invalid message data:', messageData);
      throw { message: 'Missing required message data' };
    }
    
    const response = await api.post('/api/messages', messageData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const response = await api.put(`/api/messages/${messageId}/read`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export const getConversationsList = async () => {
  try {
    const response = await api.get('/api/messages/conversations/list');
    // Ensure we always return an array, even if the API returns null or undefined
    if (!response.data) {
      console.warn('API returned empty response for conversations list');
      return [];
    }
    
    // Additional validation to ensure proper structure
    if (!Array.isArray(response.data)) {
      console.warn('API returned non-array for conversations list:', response.data);
      return [];
    }
    
    console.log('API conversations response:', 
      response.data.length, 
      'conversations with', 
      response.data.reduce((count, conv) => count + (conv.messages?.length || 0), 0), 
      'total messages');
    
    return response.data;
  } catch (error) {
    console.error('Error in getConversationsList:', error);
    throw error.response?.data || { message: 'Server error' };
  }
};

export const deleteConversation = async (userId) => {
  try {
    const response = await api.delete(`/api/messages/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Server error' };
  }
};

export default api; 