import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Validate input
      if (!email || !password) {
        return { success: false, message: 'Please enter both email and password.' };
      }
      
      try {
        // Make a real API call to the backend for authentication
        const response = await axios.post(`${API_URL}/api/users/login`, {
          email,
          password
        });
        
        // If API call fails, it will throw an error and go to catch block
        const userData = response.data;
        
        console.log('Login API response successful:', userData);
        
        // Save the user data and token
        setUserInfo(userData);
        setUserToken(userData.token);
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
        await AsyncStorage.setItem('userToken', userData.token);
        
        return { success: true, data: userData };
      } catch (apiError) {
        console.log('API login error, falling back to demo mode:', apiError);
        
        // DEMO MODE: For testing purposes only
        // In a production app, you would remove this fallback
        const isValidCredentials = 
          (email === 'user@example.com' && password === 'password') || 
          (email === 'test123@example.com' && password === 'password') ||
          (email === 'test@gmail.com' && password === 'password');
        
        if (!isValidCredentials) {
          return { success: false, message: 'Invalid email or password.' };
        }
        
        // Create demo user based on email
        let demoUser = {
          _id: 'user_123',
          name: 'Regular User',
          email: email,
          token: 'demo_token_' + Date.now(), // Simple token for demo
          profileImage: null,
          isPremium: true, // Set everyone to premium for now to enable chat
        };
        
        // Special case for test123 user
        if (email === 'test123@example.com') {
          demoUser = {
            ...demoUser,
            _id: 'user_test123',
            name: 'Test 123',
            email: 'test123@example.com',
          };
        }
        
        // Special case for test@gmail.com
        if (email === 'test@gmail.com') {
          demoUser = {
            ...demoUser,
            _id: 'user_gmail',
            name: 'Test Gmail',
            email: 'test@gmail.com',
          };
        }
        
        // Store user info and token
        setUserInfo(demoUser);
        setUserToken(demoUser.token);
        
        await AsyncStorage.setItem('userInfo', JSON.stringify(demoUser));
        await AsyncStorage.setItem('userToken', demoUser.token);
        
        console.log('Login successful (demo mode):', demoUser.name);
        return { success: true, data: demoUser };
      }
    } catch (error) {
      console.log('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const { name, email, password, phone } = userData;
      
      // Clear state
      setUserInfo(null);
      setUserToken(null);
      setIsLoading(true);
      
      // Demo: Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, you would make an API call like:
      // const response = await axios.post(`${API_URL}/api/users/register`, {
      //   name, email, password, phone
      // });
      
      // Demo: Check if the email is already in use
      if (email === 'test@example.com') {
        return {
          success: false,
          message: 'This email is already registered. Please use a different email or login.'
        };
      }
      
      // Demo: Create a fake user with the provided data
      const newUser = {
        _id: `user_${Date.now()}`,
        name,
        email,
        phone: phone || null, // Store phone if provided
        createdAt: new Date().toISOString(),
        isPremium: false
      };
      
      // In a production app, the backend would handle storing the user and sending a verification email
      
      return {
        success: true,
        data: newUser
      };
    } catch (error) {
      console.log('Registration Error: ', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext: Starting logout process');
      setIsLoading(true);
      
      // First clear the context state (do this first for better user experience)
      console.log('AuthContext: Clearing context state...');
      setUserToken(null);
      setUserInfo(null);
      
      console.log('AuthContext: Clearing AsyncStorage...');
      // Clear local storage - use a more direct approach that won't fail silently
      try {
        await AsyncStorage.removeItem('userInfo');
        console.log('AuthContext: Removed userInfo from AsyncStorage');
      } catch (storageError) {
        console.error('AuthContext: Failed to remove userInfo from AsyncStorage:', storageError);
      }
      
      try {
        await AsyncStorage.removeItem('userToken');
        console.log('AuthContext: Removed userToken from AsyncStorage');
      } catch (storageError) {
        console.error('AuthContext: Failed to remove userToken from AsyncStorage:', storageError);
      }
      
      // Verify the items were removed
      const checkUserInfo = await AsyncStorage.getItem('userInfo');
      const checkUserToken = await AsyncStorage.getItem('userToken');
      
      if (checkUserInfo || checkUserToken) {
        console.warn('AuthContext: Some items may not have been fully removed from AsyncStorage');
      } else {
        console.log('AuthContext: Successfully verified AsyncStorage items were removed');
      }
      
      console.log('AuthContext: Logout successful - all user data cleared');
      return true;
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // For UX, still clear the state even if there was an error with storage
      setUserToken(null);
      setUserInfo(null);
      
      Alert.alert('Logout Error', 'There was a problem logging out. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPremium = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll just update the local state
      // In a real app, this would:
      // 1. Make an API call to process payment
      // 2. If user was on trial, convert their account instead of charging them again
      // 3. Set up recurring billing
      
      const wasOnTrial = userInfo?.trialActive;
      
      // Update the user info
      const updatedUserInfo = {
        ...userInfo,
        isPremium: true,
        premiumSince: new Date().toISOString(),
        // If user was on trial, we want to clear the trial flags
        trialActive: false,
        trialStartDate: null,
        trialEndDate: null
      };
      
      setUserInfo(updatedUserInfo);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      return {
        success: true,
        message: wasOnTrial 
          ? 'Your trial has been converted to a premium subscription.' 
          : 'Your account has been upgraded to premium!'
      };
    } catch (error) {
      console.log('Upgrade error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred during upgrade'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPremium = async () => {
    setIsLoading(true);
    try {
      // For demo purposes, we'll just update the local state
      // In a real app, this would:
      // 1. Make an API call to cancel subscription
      // 2. Properly handle cancelling trial vs actual subscription
      
      const wasOnTrial = userInfo?.trialActive;
      
      // Update the user info
      const updatedUserInfo = {
        ...userInfo,
        isPremium: false,
        premiumSince: null,
        trialActive: false,
        trialStartDate: null,
        trialEndDate: null
      };
      
      setUserInfo(updatedUserInfo);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      return {
        success: true,
        message: wasOnTrial 
          ? 'Your free trial has been cancelled. No charges will be made.' 
          : 'Your premium subscription has been cancelled.'
      };
    } catch (error) {
      console.log('Cancellation error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'An error occurred while canceling'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let userInfo = await AsyncStorage.getItem('userInfo');
      let userToken = await AsyncStorage.getItem('userToken');

      if (userInfo) {
        userInfo = JSON.parse(userInfo);
        setUserInfo(userInfo);
        setUserToken(userToken);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if user is logged in and redirect to login if not
  const requireLogin = (navigation) => {
    if (!userToken) {
      Alert.alert(
        'Login Required',
        'You need to log in to access this feature',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return false;
    }
    return true;
  };

  // Function to check if a phone number exists in the trial database
  // In a real app, this would make an API call to check if the phone has been used for a trial
  const checkPhoneEligibleForTrial = async (phone) => {
    if (!phone || phone.trim() === '') {
      return { 
        eligible: false, 
        message: 'Phone number is required for free trial'
      };
    }
    
    // For demo purposes, we'll always return true
    // In production, you would check against a database
    return { 
      eligible: true, 
      message: 'Phone number is eligible for free trial'
    };
  };

  // Start a free trial for the current user
  const startFreeTrial = async (phone) => {
    try {
      setIsLoading(true);
      
      // Verify phone number first
      const phoneCheck = await checkPhoneEligibleForTrial(phone);
      if (!phoneCheck.eligible) {
        return {
          success: false,
          message: phoneCheck.message
        };
      }
      
      // In a real app, you would:
      // 1. Make an API call to register the trial
      // 2. Store payment method details for later billing
      // 3. Set up a scheduled task to bill after trial period
      
      // Calculate trial end date (3 days from now)
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 3);
      
      // Update user info with trial information
      const updatedUserInfo = {
        ...userInfo,
        trialActive: true,
        trialStartDate: trialStartDate.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        phone: phone || userInfo?.phone, // Save phone if provided
      };
      
      setUserInfo(updatedUserInfo);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      return { 
        success: true, 
        message: 'Your 3-day free trial has started! You will be billed $10 after the trial period unless you cancel.',
        trialEndDate: trialEndDate.toISOString()
      };
    } catch (error) {
      console.log('Error starting trial:', error);
      return {
        success: false,
        message: 'Failed to start free trial. Please try again later.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user's trial is still active
  const checkTrialStatus = () => {
    if (!userInfo?.trialActive) {
      return { active: false };
    }
    
    const now = new Date();
    const trialEnd = new Date(userInfo.trialEndDate);
    
    if (now > trialEnd) {
      return { 
        active: false,
        expired: true,
        message: 'Your free trial has expired. Please upgrade to continue accessing premium features.' 
      };
    }
    
    // Calculate days remaining
    const diffTime = Math.abs(trialEnd - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return { 
      active: true,
      daysRemaining: diffDays,
      trialEndDate: userInfo.trialEndDate,
      message: `Your free trial is active. ${diffDays} days remaining.`
    };
  };

  // Helper function to check if user can access premium features
  const canAccessPremiumFeatures = () => {
    if (userInfo?.isPremium) return { access: true, reason: 'premium' };
    
    const trialStatus = checkTrialStatus();
    if (trialStatus.active) return { access: true, reason: 'trial' };
    
    return { 
      access: false, 
      reason: trialStatus.expired ? 'trial_expired' : 'not_premium' 
    };
  };

  // Get premium or trial status for UI display
  const getUserSubscriptionStatus = () => {
    if (!userInfo) return { status: 'guest' };
    
    if (userInfo.isPremium) {
      return { 
        status: 'premium',
        since: userInfo.premiumSince,
        displayText: 'Premium Member'
      };
    }
    
    const trialStatus = checkTrialStatus();
    if (trialStatus.active) {
      return {
        status: 'trial',
        daysRemaining: trialStatus.daysRemaining,
        endDate: trialStatus.trialEndDate,
        displayText: `Trial (${trialStatus.daysRemaining} days left)`
      };
    }
    
    if (trialStatus.expired) {
      return {
        status: 'expired',
        displayText: 'Trial Expired'
      };
    }
    
    return {
      status: 'regular',
      displayText: 'Regular Account'
    };
  };

  const updateUserProfile = async (profileData) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      setIsLoading(true);
      
      // Prepare form data for profile image upload
      const formData = new FormData();
      
      // Add other profile fields
      formData.append('name', profileData.name || '');
      formData.append('bio', profileData.bio || '');
      
      // Add interests as a JSON string
      if (profileData.interests && profileData.interests.length > 0) {
        formData.append('interests', JSON.stringify(profileData.interests));
      }
      
      // Add profile image if it exists and is a new one (starts with file://)
      if (profileData.profileImage && profileData.profileImage.startsWith('file://')) {
        const uriParts = profileData.profileImage.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('profileImage', {
          uri: profileData.profileImage,
          name: `profile-${userInfo._id}.${fileType}`,
          type: `image/${fileType}`
        });
      }
      
      // For demo purposes, just update the local user info
      // In production, you would send formData to your API
      const updatedUserInfo = {
        ...userInfo,
        name: profileData.name || userInfo.name,
        bio: profileData.bio || userInfo.bio,
        interests: profileData.interests || userInfo.interests,
        profileImage: profileData.profileImage || userInfo.profileImage
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      // Update state
      setUserInfo(updatedUserInfo);
      
      return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
      console.log('Error updating profile:', error);
      return { success: false, message: error.message || 'Failed to update profile' };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userInfo,
        login,
        register,
        logout,
        upgradeToPremium,
        cancelPremium,
        requireLogin,
        setUserToken,
        setUserInfo,
        startFreeTrial,
        checkTrialStatus,
        canAccessPremiumFeatures,
        updateUserProfile,
        getUserSubscriptionStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 