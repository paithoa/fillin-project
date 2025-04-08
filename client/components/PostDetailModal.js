import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { deletePost } from '../services/api';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

const PostDetailModal = ({ visible, post, onClose, onPostDeleted, navigation }) => {
  const { userInfo, requireLogin, canAccessPremiumFeatures, getUserSubscriptionStatus } = useContext(AuthContext);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = userInfo && post?.user && userInfo._id === post.user._id;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleCall = () => {
    if (!post.phone) {
      Alert.alert('No Phone Number', 'No phone number available for this post.');
      return;
    }
    Linking.openURL(`tel:${post.phone}`);
  };

  const handleChatPress = () => {
    // Check if user is logged in
    if (!requireLogin(navigation)) {
      return;
    }
    
    // Always navigate to Messages tab, regardless of premium status
    // The ChatListScreen can handle showing appropriate prompts
    navigation.navigate('Main', { 
      screen: 'Messages',
      params: { 
        selectedUser: post.user,
        selectedPost: post,
        showComposeMessage: true 
      } 
    });
    onClose();
  };

  const handleDeletePress = () => {
    // Show the custom delete confirmation dialog
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!post?._id) {
      Alert.alert('Error', 'Post ID is missing. Cannot delete post.');
      return;
    }
    
    try {
      setIsDeleting(true);
      console.log('Starting post deletion process for ID:', post._id);
      
      try {
        // Try the actual API delete
        const result = await deletePost(post._id);
        console.log('Delete post result:', result);
        
        // Show appropriate success message based on whether it was server or client-side deletion
        if (result.simulated) {
          console.log('Simulated deletion (server unreachable)');
          Alert.alert('Post Removed', 'The post has been removed from your view. Note: In demo mode, this post will reappear if you restart the app since the server could not be reached.');
        } else {
          console.log('Server confirmed post deletion');
          Alert.alert('Success', 'Post has been deleted successfully from the database.');
        }
        
        // Close the modal and notify parent component to update the posts list
        setShowDeleteConfirmation(false); // Hide the confirmation dialog
        onClose();
        if (onPostDeleted) {
          console.log('Notifying parent component that post was deleted:', post._id);
          onPostDeleted(post._id);
        }
      } catch (apiError) {
        console.error('API deletePost failed:', apiError.message);
        
        // Show error but still remove from view for better UX in demo mode
        Alert.alert(
          'Error', 
          'There was a problem deleting from the server. The post will be removed from view, but may reappear later.',
          [
            { 
              text: 'OK',
              onPress: () => {
                setShowDeleteConfirmation(false); // Hide the confirmation dialog
                onClose();
                if (onPostDeleted) {
                  onPostDeleted(post._id);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Unexpected error in delete process:', error);
      setIsDeleting(false);
      setShowDeleteConfirmation(false); // Hide the confirmation dialog
      Alert.alert('Error', 'Failed to delete post. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpgradePress = () => {
    setShowUpgradeModal(false);
    // Check if user is logged in first
    if (requireLogin && !userInfo) {
      requireLogin();
      return;
    }
    
    // Navigate to profile screen for upgrade
    onClose();
    // Use timeout to ensure modal is closed before navigation
    setTimeout(() => {
      // Navigate to profile screen where users can upgrade
      if (onPostDeleted) {
        onPostDeleted('upgrade');
      }
    }, 300);
  };

  // Handle sharing the post
  const handleSharePress = () => {
    // In a real app, this would use the Share API
    // For now, we'll just show an alert
    Alert.alert(
      'Share Post',
      'This feature would allow sharing the post in a real app',
      [{ text: 'OK' }]
    );
  };

  // Render chat button only if the post author is not the current user
  const renderChatButton = () => {
    if (userInfo && post.user && post.user._id !== userInfo._id) {
      // NOTE FOR FUTURE: Premium checks could be implemented here
      return (
        <TouchableOpacity style={styles.actionButton} onPress={handleChatPress}>
          <Ionicons name="chatbubble-outline" size={24} color="#0066CC" />
          <Text style={styles.actionText}>Message</Text>
          
          {/* Simple message badge */}
          <View style={styles.messageBadge}>
            <Ionicons name="chatbubble" size={12} color="#0066CC" />
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{post?.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {post?.image ? (
              <Image
                source={{ uri: post.image }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={60} color="#ccc" />
              </View>
            )}

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#555" />
                <Text style={styles.infoText}>Posted by: {post?.user?.name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color="#555" />
                <Text style={styles.infoText}>Location: {post?.location}</Text>
              </View>

              {post?.grade && (
                <View style={styles.infoRow}>
                  <Ionicons name="star-outline" size={18} color="#555" />
                  <Text style={styles.infoText}>Grade: {post.grade}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={18} color="#555" />
                <Text style={styles.infoText}>
                  {post?.lookingToJoin
                    ? 'Looking to join a team'
                    : `Looking for ${post?.playersNeeded} player${
                        post?.playersNeeded !== 1 ? 's' : ''
                      }`}
                </Text>
              </View>

              {post?.phone && (
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={18} color="#555" />
                  <Text style={styles.infoText}>Phone: {post.phone}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color="#555" />
                <Text style={styles.infoText}>Posted: {formatDate(post?.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.description}>{post?.description}</Text>
            </View>
          </ScrollView>

          {/* Action buttons container at the bottom */}
          <View style={styles.actionsContainer}>
            {/* Share button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleSharePress}>
              <Ionicons name="share-outline" size={24} color="#555" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {/* Delete button (only for post author) */}
            {isAuthor && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDeletePress}>
                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                <Text style={[styles.actionText, { color: '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            )}

            {/* Chat button (only if not author) */}
            {!isAuthor && renderChatButton()}
          </View>
        </View>
      </View>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        visible={showDeleteConfirmation}
        title={post?.title || 'this post'}
        onCancel={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.upgradeModalContainer}>
          <View style={styles.upgradeModalContent}>
            <View style={styles.upgradeModalHeader}>
              <Text style={styles.upgradeModalTitle}>Premium Feature</Text>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.upgradeModalBody}>
              <Ionicons name="star" size={60} color="#FFD700" style={styles.upgradeIcon} />
              <Text style={styles.upgradeText}>
                Messaging is a premium feature. Upgrade your account to unlock:
              </Text>
              
              <View style={styles.benefitRow}>
                <Ionicons name="chatbubble" size={20} color="#0066CC" />
                <Text style={styles.benefitText}>Direct messaging with other users</Text>
              </View>
              
              <View style={styles.benefitRow}>
                <Ionicons name="notifications" size={20} color="#0066CC" />
                <Text style={styles.benefitText}>Notifications for new messages</Text>
              </View>
              
              <View style={styles.benefitRow}>
                <Ionicons name="trophy" size={20} color="#0066CC" />
                <Text style={styles.benefitText}>Priority listings for your posts</Text>
              </View>
              
              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>Premium Membership</Text>
                <Text style={styles.pricingPrice}>$9.99/month</Text>
                <Text style={styles.pricingDescription}>
                  (Demo Mode - No Payment Required)
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgradePress}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  descriptionContainer: {
    padding: 15,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    position: 'relative',
  },
  actionText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
  },
  callButton: {
    backgroundColor: '#4CAF50',
  },
  messageButton: {
    backgroundColor: '#2196F3',
  },
  upgradeButton: {
    backgroundColor: '#FF9800',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  upgradeModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  upgradeModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  upgradeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  upgradeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  upgradeModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  upgradeIcon: {
    marginBottom: 15,
  },
  upgradeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  benefitText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#333',
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  pricingCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 5,
  },
  pricingDescription: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  trialBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  upgradeBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6347',
  },
  messageBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E6F2FF',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
});

export default PostDetailModal; 