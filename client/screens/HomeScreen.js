import React, { useState, useEffect, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PostCard from '../components/PostCard';
import PostDetailModal from '../components/PostDetailModal';
import { fetchPosts } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import AddPostScreen from './AddPostScreen';

// Placeholder posts data when API is unavailable
const PLACEHOLDER_POSTS = [
  {
    _id: 'placeholder1',
    title: 'Looking for Soccer Players',
    description: 'We need 3 more players for our recreational soccer team. Games are on Saturday mornings at Central Park. All skill levels welcome!',
    playersNeeded: 3,
    lookingToJoin: false,
    location: 'Central Park, Field 3',
    grade: 'Recreational',
    createdAt: new Date().toISOString(), // Today
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2487&q=80',
    user: {
      _id: 'user1',
      name: 'John Smith',
      email: 'john@example.com',
      profileImage: null
    }
  },
  {
    _id: 'placeholder2',
    title: 'Basketball Team Looking for Players',
    description: 'Our basketball team is recruiting for the upcoming season. Looking for guards and centers. Intermediate to advanced skill level.',
    playersNeeded: 4,
    lookingToJoin: false,
    location: 'Downtown Sports Center',
    grade: 'Intermediate',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    image: 'https://images.unsplash.com/photo-1546519638-68e109acd27d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2090&q=80',
    user: {
      _id: 'user2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      profileImage: null
    }
  },
  {
    _id: 'placeholder3',
    title: 'Experienced Volleyball Player Looking to Join a Team',
    description: 'I\'ve been playing volleyball for 5 years and recently moved to the area. Looking to join a competitive team that practices weekly.',
    lookingToJoin: true,
    location: 'Anywhere within 30 miles of downtown',
    grade: 'Advanced',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2007&q=80',
    user: {
      _id: 'user3',
      name: 'Mike Williams',
      email: 'mike@example.com',
      profileImage: null
    }
  },
  {
    _id: 'placeholder4',
    title: 'Tennis Partner Wanted',
    description: 'Looking for a tennis partner for weekly practice sessions. I\'m at an intermediate level and available on weekday evenings.',
    lookingToJoin: true,
    location: 'Westside Tennis Club',
    grade: 'Intermediate',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    image: 'https://images.unsplash.com/photo-1545809074-59472b3f5ecc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80',
    user: {
      _id: 'user4',
      name: 'Emily Chen',
      email: 'emily@example.com',
      profileImage: null
    }
  }
].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [usePlaceholders, setUsePlaceholders] = useState(false);
  const { userInfo, requireLogin, canAccessPremiumFeatures, getUserSubscriptionStatus } = useContext(AuthContext);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleAddPostPress}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={30} color="#0066CC" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, userInfo]);

  const handleAddPostPress = () => {
    // We want to allow guests to view the add post modal, but they'll be prompted
    // to login within the modal if they try to submit
    setShowAddPostModal(true);
  };

  const closeAddPostModal = (newPostCreated = false) => {
    setShowAddPostModal(false);
    
    // Only refresh posts if a new post was actually created
    if (newPostCreated) {
      // Add a small delay to allow the server to process the post
      setTimeout(() => {
        loadPosts();
      }, 500);
    }
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();
      if (data && data.length > 0) {
        // Sort posts by date - newest first
        const sortedPosts = [...data].sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setPosts(sortedPosts);
        setUsePlaceholders(false);
      } else {
        // If no posts returned, use placeholders (already sorted)
        setPosts(PLACEHOLDER_POSTS);
        setUsePlaceholders(true);
      }
    } catch (error) {
      // If error loading posts, use placeholders
      setPosts(PLACEHOLDER_POSTS);
      setUsePlaceholders(true);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
  };

  const handlePostDeleted = (postId) => {
    if (postId === 'upgrade') {
      // Handle upgrade flow
      navigation.navigate('Profile', { showUpgradeModal: true });
      return;
    }
    
    // Remove deleted post from list
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
    
    // Close modal after deletion
    setModalVisible(false);
    setSelectedPost(null);
  };

  const handleMessage = (data) => {
    if (data === 'upgrade') {
      // If the user needs to upgrade, close modal and navigate to profile
      setModalVisible(false);
      navigation.navigate('Profile', { showUpgradeModal: true });
      return;
    }
    
    // Check if user can access premium features
    const accessStatus = canAccessPremiumFeatures();
    if (!accessStatus.access) {
      // Check if user is logged in first
      if (!userInfo) {
        if (requireLogin(navigation)) {
          // If they log in successfully, they'll be redirected back
          // and we can show the trial/premium options
          setModalVisible(false);
        }
        return;
      }
      
      // Navigate to ChatList with parameter to show premium prompt
      navigation.navigate('ChatList', { showPremiumPrompt: true });
      setModalVisible(false);
      return;
    }
    
    // User has premium or trial access, navigate to chat with the post author
    navigation.navigate('Chat', {
      recipient: {
        _id: selectedPost.user._id,
        name: selectedPost.user.name,
        avatar: selectedPost.user.profileImage
      },
      post: {
        _id: selectedPost._id,
        title: selectedPost.title,
        description: selectedPost.description
      }
    });
    setModalVisible(false);
  };

  // Function to toggle between real and placeholder data
  const togglePlaceholders = () => {
    if (usePlaceholders) {
      loadPosts(); // Try to load real data
    } else {
      setPosts(PLACEHOLDER_POSTS);
      setUsePlaceholders(true);
    }
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <>
          {usePlaceholders && (
            <TouchableOpacity 
              style={styles.placeholderBanner}
              onPress={togglePlaceholders}
            >
              <Text style={styles.placeholderText}>
                Using placeholder posts. Tap to refresh.
              </Text>
            </TouchableOpacity>
          )}
          
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <PostCard post={item} onPress={() => handlePostPress(item)} />
            )}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
                <Text style={styles.emptyText}>No posts found</Text>
                <Text style={styles.emptySubText}>
                  Pull down to refresh or add your own post
                </Text>
                <TouchableOpacity 
                  style={styles.placeholderButton}
                  onPress={togglePlaceholders}
                >
                  <Text style={styles.placeholderButtonText}>
                    {usePlaceholders ? "Try loading real posts" : "Show placeholder posts"}
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />

          {selectedPost && (
            <PostDetailModal
              visible={modalVisible}
              post={selectedPost}
              onClose={handleCloseModal}
              onMessage={handleMessage}
              onPostDeleted={handlePostDeleted}
              navigation={navigation}
            />
          )}

          {/* Add Post Modal */}
          <Modal
            visible={showAddPostModal}
            animationType="slide"
            transparent={false}
            onRequestClose={() => setShowAddPostModal(false)}
          >
            <SafeAreaView style={styles.modalContainer}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalContent}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create Post</Text>
                  <TouchableOpacity onPress={closeAddPostModal}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <AddPostScreen
                  navigation={navigation}
                  isModal={true}
                  onPostCreated={closeAddPostModal}
                />
              </KeyboardAvoidingView>
            </SafeAreaView>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerButton: {
    marginRight: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 20,
  },
  placeholderBanner: {
    backgroundColor: '#FFD700',
    padding: 10,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#333',
    fontWeight: '600',
  },
  placeholderButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  placeholderButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 