import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../context/AuthContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const RegisterSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  phone: Yup.string().optional(),
});

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading, userToken, login } = useContext(AuthContext);
  const [registerError, setRegisterError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);

  // Navigate to main screen when registration is successful and auto-login completes
  useEffect(() => {
    if (userToken) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
      
      // Show a welcome message after a short delay
      setTimeout(() => {
        Alert.alert(
          "Welcome to SportsConnect!",
          "Your account has been created successfully.",
          [{ text: "OK" }],
          { cancelable: true }
        );
      }, 300);
    }
  }, [userToken, navigation]);

  // Update the navigation options to include a back button
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0066CC" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const validateEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone) => {
    // Optional field - can be empty
    if (!phone) return true;
    
    // Simple validation for non-empty phone - at least 10 digits
    const re = /^\+?[0-9]{10,15}$/;
    return re.test(String(phone).replace(/\s+/g, ''));
  };

  const handleSubmit = async () => {
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validate form
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      setShowModal(true);
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Please enter your email');
      setShowModal(true);
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email');
      setShowModal(true);
      return;
    }

    if (!password) {
      setErrorMessage('Please enter a password');
      setShowModal(true);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      setShowModal(true);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setShowModal(true);
      return;
    }
    
    if (phone && !validatePhone(phone)) {
      setErrorMessage('Please enter a valid phone number');
      setShowModal(true);
      return;
    }

    try {
      // Don't need to set isLoading here, the register function handles that
      
      // Add phone to registration data if provided
      const userData = { name, email, password };
      if (phone) {
        userData.phone = phone.replace(/\s+/g, ''); // Strip spaces
      }
      
      const result = await register(userData);
      
      if (result.success) {
        // Registration successful - now auto login
        setSuccessMessage('Registration successful! Logging you in...');
        setShowModal(true);
        
        // Auto-login the user
        setIsAutoLoggingIn(true);
        try {
          await login(email, password);
          // The login success will trigger the useEffect to navigate
        } catch (loginError) {
          console.log('Auto-login failed:', loginError);
          // If auto-login fails, still navigate to login with the email pre-filled
          setShowModal(false);
          navigation.navigate('Login', { email });
        } finally {
          setIsAutoLoggingIn(false);
        }
      } else {
        // Registration failed
        setErrorMessage(result.message || 'Registration failed. Please try again.');
        setShowModal(true);
      }
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      setShowModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our sports community</Text>
        </View>

        <View style={styles.formContainer}>
          <InputField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            icon="person-outline"
          />

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            icon="mail-outline"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <InputField
            label="Phone Number (Optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            icon="call-outline"
            keyboardType="phone-pad"
            helperText="Required for free trial access"
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            icon="lock-closed-outline"
            secureTextEntry
          />

          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            icon="lock-closed-outline"
            secureTextEntry
          />

          <CustomButton
            title="Create Account"
            onPress={handleSubmit}
            isLoading={isLoading || isAutoLoggingIn}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkTextBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Response Modal */}
      <ResponseModal
        visible={showModal}
        onClose={() => !isAutoLoggingIn && setShowModal(false)}
        message={errorMessage || successMessage}
        isSuccess={!errorMessage && successMessage}
      />
    </SafeAreaView>
  );
};

// Helper component for consistent input fields
const InputField = ({ label, value, onChangeText, placeholder, icon, secureTextEntry, keyboardType, autoCapitalize, helperText }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={22} color="#555" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'words'}
      />
    </View>
    {helperText && <Text style={styles.helperText}>{helperText}</Text>}
  </View>
);

// Custom Button component for form submission
const CustomButton = ({ title, onPress, isLoading }) => (
  <TouchableOpacity 
    style={styles.button} 
    onPress={onPress}
    disabled={isLoading}
  >
    {isLoading ? (
      <ActivityIndicator size="small" color="white" />
    ) : (
      <Text style={styles.buttonText}>{title}</Text>
    )}
  </TouchableOpacity>
);

// Response Modal component for showing success or error messages
const ResponseModal = ({ visible, onClose, message, isSuccess }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
  >
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback>
          <View style={[
            styles.modalContainer, 
            isSuccess ? styles.successModal : styles.errorModal
          ]}>
            <Ionicons 
              name={isSuccess ? "checkmark-circle" : "alert-circle"} 
              size={40} 
              color={isSuccess ? "#4CAF50" : "#FF3B30"} 
              style={styles.modalIcon}
            />
            <Text style={styles.modalMessage}>{message}</Text>
            {!isSuccess && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    color: '#666',
  },
  loginLinkTextBold: {
    fontWeight: 'bold',
  },
  backButton: {
    marginLeft: 15,
    padding: 5,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    maxWidth: '80%',
    minWidth: 280,
  },
  successModal: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  errorModal: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF3B30',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default RegisterScreen; 