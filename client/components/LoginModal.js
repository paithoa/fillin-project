import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const LoginModal = ({ visible, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useContext(AuthContext);

  // Reset inputs when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Small delay to ensure modal is fully rendered before focusing
      setTimeout(() => {
        // State will be reset when modal is shown
        setEmail('');
        setPassword('');
        setIsLoading(false);
        setErrorMessage('');
      }, 300);
    }
  }, [visible]);

  const handleLogin = async () => {
    // Clear any previous error messages
    setErrorMessage('');
    
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        setEmail('');
        setPassword('');
        // Show success message
        Alert.alert(
          'Login Successful', 
          'You have been logged in successfully!',
          [{ text: 'OK', onPress: onLoginSuccess }]
        );
      } else {
        // Set error message based on the response
        setErrorMessage(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      // Handle unexpected errors
      setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    onClose();
    // We use a timeout to ensure the modal is closed before navigation
    setTimeout(() => {
      onClose('register');
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* This outer Pressable only dismisses keyboard when clicking the backdrop */}
      <Pressable 
        style={styles.centeredView}
        onPress={Keyboard.dismiss}
      >
        {/* This prevents the touch event from bubbling up when clicking the modal content */}
        <Pressable 
          style={styles.modalOuterContainer} 
          onPress={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={10}
          >
            <View style={styles.modalView}>
              <View style={styles.header}>
                <Text style={styles.title}>Login</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.subtitle}>
                Login to create posts and interact with other users
              </Text>
              
              {/* Error message display */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[
                    styles.input, 
                    errorMessage && !email.trim() ? styles.inputError : null
                  ]}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  clearButtonMode="while-editing"
                  autoFocus={true}
                  testID="emailInput"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={[
                    styles.input,
                    errorMessage && !password.trim() ? styles.inputError : null
                  ]}
                  placeholder="Enter your password"
                  secureTextEntry
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  clearButtonMode="while-editing"
                  testID="passwordInput"
                />
              </View>
              
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.registerLink}
                onPress={navigateToRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerText}>
                  Don't have an account? Register here
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  modalOuterContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '90%',
    maxWidth: 400,
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF8F8',
  },
  loginButton: {
    backgroundColor: '#0066CC',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  registerText: {
    color: '#0066CC',
    fontSize: 14,
  },
});

export default LoginModal; 