import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { createPost } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';

const PostSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string().required('Description is required'),
  location: Yup.string(),
  playersNeeded: Yup.string().when('lookingToJoin', {
    is: false,
    then: (schema) => schema.required('Number of players needed is required')
  }),
});

// Sports-related Unsplash images for auto-suggestions
const UNSPLASH_IMAGES = {
  soccer: [
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ],
  basketball: [
    'https://images.unsplash.com/photo-1546519638-68e109acd27d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1505666287802-931dc83a0fe4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ],
  volleyball: [
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1553005746-5be01c0ad00e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1562552052-dd799ebfe096?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ],
  tennis: [
    'https://images.unsplash.com/photo-1545809074-59472b3f5ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1622279457486-28f94b4a3443?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1533560904424-b1953e613764?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ],
  baseball: [
    'https://images.unsplash.com/photo-1508344308633-7392519c1923?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1516731415730-0c607149933a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ],
  football: [
    'https://images.unsplash.com/photo-1566577739211-36b0d9046f69?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1612210443463-6fbb9d67ff61?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1584952811565-c4c446383fe9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ],
  swimming: [
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1565108024867-90441334f0d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ]
};

const AddPostScreen = ({ navigation, isModal = false, onPostCreated }) => {
  const { userInfo, userToken, requireLogin } = useContext(AuthContext);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState([]);
  const [suggestingImages, setSuggestingImages] = useState(false);
  const [currentTitle, setCurrentTitle] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const isAuthenticated = !!userToken;

  useEffect(() => {
    // Check if user is logged in, if not, show login prompt
    // Skip this check if component is rendered as a modal (modal already has auth check)
    if (!isModal) {
      const checkAuth = () => {
        if (!isAuthenticated) {
          // Do not immediately show login - we'll only show it when they try to take an action
          console.log('User not authenticated in AddPostScreen');
        }
      };
      
      checkAuth();
    }
  }, [userInfo, navigation, isModal, isAuthenticated]);

  const handleAuthenticationNeeded = () => {
    if (!isAuthenticated) {
      console.log('Authentication needed - showing login modal');
      // Ensure modal is shown with slight delay to prevent UI issues
      setShowLoginModal(false); // First set to false to reset any previous state
      setTimeout(() => {
        setShowLoginModal(true);
      }, 100);
      return false;
    }
    return true;
  };

  const handleLoginSuccess = () => {
    // Close the modal after a short delay to avoid UI issues
    setTimeout(() => {
      setShowLoginModal(false);
      Alert.alert(
        'Logged In Successfully',
        'You can now create posts and interact with other users!'
      );
    }, 300);
  };

  const handleLoginModalClose = (action) => {
    // Close the modal after a short delay to avoid UI issues
    setTimeout(() => {
      setShowLoginModal(false);
      if (action === 'register') {
        navigation.navigate('Register');
      }
    }, 300);
  };

  const pickImage = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      console.log('User not authenticated, showing login modal');
      setShowLoginModal(true);
      return;
    }
    
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const suggestImages = (title) => {
    // Allow suggesting images without authentication
    setSuggestingImages(true);
    
    setCurrentTitle(title);
    
    // Convert title to lowercase and analyze for sports keywords
    const lowerTitle = title.toLowerCase();
    let sportImages = UNSPLASH_IMAGES.default;
    
    if (lowerTitle.includes('soccer') || lowerTitle.includes('football')) {
      sportImages = UNSPLASH_IMAGES.soccer;
    } else if (lowerTitle.includes('basketball') || lowerTitle.includes('hoops')) {
      sportImages = UNSPLASH_IMAGES.basketball;
    } else if (lowerTitle.includes('volleyball') || lowerTitle.includes('volley')) {
      sportImages = UNSPLASH_IMAGES.volleyball;
    } else if (lowerTitle.includes('tennis') || lowerTitle.includes('racket')) {
      sportImages = UNSPLASH_IMAGES.tennis;
    } else if (lowerTitle.includes('baseball') || lowerTitle.includes('softball')) {
      sportImages = UNSPLASH_IMAGES.baseball;
    } else if (lowerTitle.includes('football') || lowerTitle.includes('nfl')) {
      sportImages = UNSPLASH_IMAGES.football;
    } else if (lowerTitle.includes('swim') || lowerTitle.includes('pool')) {
      sportImages = UNSPLASH_IMAGES.swimming;
    }
    
    // Add a random selection from default sports images
    const allSuggestions = [...sportImages];
    const randomDefault = UNSPLASH_IMAGES.default[Math.floor(Math.random() * UNSPLASH_IMAGES.default.length)];
    
    if (!allSuggestions.includes(randomDefault)) {
      allSuggestions.push(randomDefault);
    }
    
    setSuggestedImages(allSuggestions);
    setSuggestingImages(false);
    setShowImageModal(true);
  };

  const selectSuggestedImage = (imageUri) => {
    setImage(imageUri);
    setShowImageModal(false);
  };

  const handleSubmit = async (values, { resetForm }) => {
    // Check if user is logged in before submitting
    if (!handleAuthenticationNeeded()) {
      return;
    }
    
    setLoading(true);
    try {
      // Convert playersNeeded to a number if it's provided
      const numericPlayersNeeded = values.playersNeeded ? parseInt(values.playersNeeded, 10) : undefined;
      
      // Auto-assign an image from Unsplash if none selected
      let finalImage = image;
      if (!finalImage) {
        // Pick image based on title keywords
        const lowerTitle = values.title.toLowerCase();
        let sportType = 'default';
        
        if (lowerTitle.includes('soccer') || lowerTitle.includes('football')) {
          sportType = 'soccer';
        } else if (lowerTitle.includes('basketball') || lowerTitle.includes('hoops')) {
          sportType = 'basketball';
        } else if (lowerTitle.includes('volleyball') || lowerTitle.includes('volley')) {
          sportType = 'volleyball';
        } else if (lowerTitle.includes('tennis') || lowerTitle.includes('racket')) {
          sportType = 'tennis';
        } else if (lowerTitle.includes('baseball') || lowerTitle.includes('softball')) {
          sportType = 'baseball';
        } else if (lowerTitle.includes('football') || lowerTitle.includes('nfl')) {
          sportType = 'football';
        } else if (lowerTitle.includes('swim') || lowerTitle.includes('pool')) {
          sportType = 'swimming';
        }
        
        // Get a random image from the selected sport category
        const images = UNSPLASH_IMAGES[sportType] || UNSPLASH_IMAGES.default;
        finalImage = images[Math.floor(Math.random() * images.length)];
      }
      
      const postData = {
        ...values,
        playersNeeded: numericPlayersNeeded,
        image: finalImage,
        phone: values.phone || userInfo?.phone,
      };
      
      const result = await createPost(postData);
      
      // Reset form and image
      resetForm();
      setImage(null);
      
      Alert.alert('Success', 'Post created successfully!');
      
      // Handle different post-submit behaviors based on render mode
      if (isModal && onPostCreated) {
        onPostCreated(true); // Pass true to indicate successful post creation
      } else {
        navigation.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      
      // Signal that no post was created
      if (isModal && onPostCreated) {
        onPostCreated(false);
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={isModal ? 40 : 80}
    >
      {/* Always render the LoginModal but control visibility with visible prop */}
      <LoginModal
        visible={showLoginModal}
        onClose={handleLoginModalClose}
        onLoginSuccess={handleLoginSuccess}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Formik
          initialValues={{
            title: '',
            description: '',
            playersNeeded: '',
            lookingToJoin: false,
            location: '',
            grade: '',
            phone: userInfo?.phone || '',
          }}
          validationSchema={PostSchema}
          onSubmit={handleSubmit}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            setFieldValue,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.formContainer}>
              {!isModal && <Text style={styles.formTitle}>Create a New Post</Text>}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter a title for your post"
                  value={values.title}
                  onChangeText={(text) => {
                    handleChange('title')(text);
                    if (text.length > 5) {
                      // Only suggest images when title is meaningful
                      setCurrentTitle(text);
                    }
                  }}
                  onBlur={handleBlur('title')}
                />
                {errors.title && touched.title && (
                  <Text style={styles.error}>{errors.title}</Text>
                )}
                {values.title.length > 5 && (
                  <TouchableOpacity 
                    style={styles.suggestButton}
                    onPress={() => suggestImages(values.title)}
                  >
                    <Text style={styles.suggestButtonText}>Suggest Images Based on Title</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your post in detail"
                  multiline
                  numberOfLines={4}
                  value={values.description}
                  onChangeText={handleChange('description')}
                  onBlur={handleBlur('description')}
                />
                {errors.description && touched.description && (
                  <Text style={styles.error}>{errors.description}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>
                    {values.lookingToJoin
                      ? 'Looking to join a team'
                      : 'Looking for players'}
                  </Text>
                  <Switch
                    value={values.lookingToJoin}
                    onValueChange={(value) => {
                      setFieldValue('lookingToJoin', value);
                      if (value) {
                        setFieldValue('playersNeeded', '');
                      }
                    }}
                    trackColor={{ false: '#767577', true: '#0066CC' }}
                    thumbColor={'#f4f3f4'}
                  />
                </View>
              </View>

              {!values.lookingToJoin && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Number of Players Needed</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="How many players do you need?"
                    keyboardType="numeric"
                    value={values.playersNeeded}
                    onChangeText={handleChange('playersNeeded')}
                    onBlur={handleBlur('playersNeeded')}
                  />
                  {errors.playersNeeded && touched.playersNeeded && (
                    <Text style={styles.error}>{errors.playersNeeded}</Text>
                  )}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Where is the game/practice?"
                  value={values.location}
                  onChangeText={handleChange('location')}
                  onBlur={handleBlur('location')}
                />
                {errors.location && touched.location && (
                  <Text style={styles.error}>{errors.location}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Grade/Skill Level</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                  value={values.grade}
                  onChangeText={handleChange('grade')}
                  onBlur={handleBlur('grade')}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your contact number"
                  keyboardType="phone-pad"
                  value={values.phone}
                  onChangeText={handleChange('phone')}
                  onBlur={handleBlur('phone')}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Image (Optional)</Text>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={pickImage}
                >
                  {image ? (
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="image-outline" size={50} color="#ccc" />
                      <Text style={styles.imagePickerText}>
                        Tap to select an image from your device or use the suggest button
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Create Post</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </ScrollView>

      {/* Image Suggestions Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.imageModalContainer}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>Suggested Images</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {suggestingImages ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>Finding images...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.imageModalSubtitle}>
                  Based on "{currentTitle}"
                </Text>
                <FlatList
                  data={suggestedImages}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.imageSuggestionItem}
                      onPress={() => selectSuggestedImage(item)}
                    >
                      <Image 
                        source={{ uri: item }} 
                        style={styles.suggestedImagePreview} 
                      />
                    </TouchableOpacity>
                  )}
                  numColumns={2}
                  contentContainerStyle={styles.imageGrid}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
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
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imagePicker: {
    marginTop: 5,
    height: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePickerText: {
    marginTop: 10,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#0066CC',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  suggestButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  imageModalContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  imageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageModalSubtitle: {
    fontSize: 14,
    color: '#666',
    padding: 15,
    paddingTop: 0,
    fontStyle: 'italic',
  },
  imageGrid: {
    padding: 5,
  },
  imageSuggestionItem: {
    flex: 1,
    margin: 5,
    height: 150,
    borderRadius: 5,
    overflow: 'hidden',
  },
  suggestedImagePreview: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default AddPostScreen; 