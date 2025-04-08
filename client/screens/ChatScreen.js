import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { getMessages, sendMessage } from '../services/api';
import axios from 'axios';
import { API_URL } from '../config';

const ChatScreen = ({ navigation, route }) => {
  const { userInfo, requireLogin } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [post, setPost] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  
  // Get information from route params
  const recipientFromParams = route.params?.recipient;
  const postFromParams = route.params?.post;

  // Set up recipient and post from route params
  useEffect(() => {
    if (recipientFromParams) {
      setRecipient(recipientFromParams);
    }
    
    if (postFromParams) {
      setPost(postFromParams);
    }
  }, [recipientFromParams, postFromParams]);

  // Add focus listener to refresh messages when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userInfo && recipient?._id) {
        fetchMessages();
      }
    });

    return unsubscribe;
  }, [navigation, userInfo, recipient]);

  useEffect(() => {
    if (userInfo) {
      fetchMessages();
    }

    // Set the header title to the recipient's name
    navigation.setOptions({
      title: recipient?.name || 'Chat',
      headerRight: () => (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetMessages}
        >
          <Ionicons name="refresh" size={24} color="#0066CC" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, recipient, userInfo]);

  const handleResetMessages = async () => {
    Alert.alert(
      'Reset Messages',
      'Are you sure you want to clear this conversation? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // Clear local messages
              setMessages([]);
              
              // Call API to reset messages
              try {
                await axios.delete(`${API_URL}/api/messages/${recipient._id}`, {
                  headers: { Authorization: `Bearer ${userInfo.token}` },
                });
                Alert.alert('Success', 'Messages have been reset successfully');
              } catch (error) {
                console.log('Error resetting messages on server:', error);
                Alert.alert('Error', 'Failed to reset messages on server');
              }
              
              // Fetch fresh messages
              await fetchMessages();
            } catch (error) {
              console.log('Error resetting messages:', error);
              Alert.alert('Error', 'Failed to reset messages');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteMessage = async (messageId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Remove from local messages
              setMessages(prevMessages => 
                prevMessages.filter(msg => msg._id !== messageId)
              );
              
              // If you have a backend API endpoint for deleting messages
              try {
                await axios.delete(`${API_URL}/api/messages/single/${messageId}`, {
                  headers: { Authorization: `Bearer ${userInfo.token}` },
                });
              } catch (error) {
                console.log('Error deleting message on server:', error);
              }
              
              setShowMessageOptions(false);
              setSelectedMessage(null);
            } catch (error) {
              console.log('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
    setShowMessageOptions(false);
    // Focus on text input
    // This could be improved by using a ref to the TextInput
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const checkAccess = () => {
    // Just check if user is logged in - no premium checks
    return !!userInfo;
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      if (!recipient || !recipient._id) {
        console.log('No recipient ID available');
        setLoading(false);
        return;
      }
      
      // Try to fetch messages from API
      try {
        const response = await axios.get(`${API_URL}/api/messages/${recipient._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setMessages(response.data);
      } catch (error) {
        console.log('Error fetching messages from API:', error);
        // For demo purposes, use placeholder messages
        setMessages([
          {
            _id: 'welcome',
            content: `This is a demo conversation with ${recipient?.name}. The server is currently unavailable.`,
            createdAt: new Date(),
            sender: { _id: 'system', name: 'System' },
            receiver: { _id: userInfo?._id, name: userInfo?.name }
          }
        ]);
      }
    } catch (error) {
      console.log('Error in fetchMessages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (postFromParams && recipient?._id) {
      const messageData = {
        recipientId: recipient._id,
        postId: postFromParams._id,
        text: newMessage.trim(),
        replyToId: replyingTo?._id, // Add reference to replied message
      };

      setLoading(true);
      try {
        const result = await sendMessage(recipient._id, postFromParams._id, newMessage.trim(), replyingTo?._id);
        if (result.success) {
          setNewMessage('');
          setReplyingTo(null); // Clear reply status
          
          // Add message to the list immediately for better UX
          const newMessageObj = {
            _id: result.data._id || `temp-${Date.now()}`,
            content: newMessage.trim(),
            createdAt: new Date(),
            sender: { _id: userInfo._id, name: userInfo.name },
            receiver: { _id: recipient._id, name: recipient.name },
            post: postFromParams,
            replyTo: replyingTo, // Include reply reference
          };
          
          setMessages(prev => [newMessageObj, ...prev]);
          
          // Fetch fresh messages to ensure consistency
          await fetchMessages();
        } else {
          Alert.alert('Error', result.message || 'Failed to send message');
        }
      } catch (error) {
        console.log('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
      setLoading(false);
    } else {
      Alert.alert('Error', 'No receiver selected. Please select a post and user first.');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender._id === userInfo?._id;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
        onLongPress={() => {
          setSelectedMessage(item);
          setShowMessageOptions(true);
        }}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>
            {isMyMessage ? 'You' : item.sender.name}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        
        {item.replyTo && (
          <View style={styles.replyToContainer}>
            <View style={styles.replyLine} />
            <Text style={styles.replyToText} numberOfLines={1}>
              Reply to: {item.replyTo.content}
            </Text>
          </View>
        )}
        
        <Text style={styles.messageContent}>{item.content}</Text>
        
        {item.post && (
          <Text style={styles.postReference}>
            Re: {item.post.title}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderMessageOptionsModal = () => (
    <Modal
      visible={showMessageOptions}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowMessageOptions(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowMessageOptions(false)}
      >
        <View style={styles.messageOptionsContainer}>
          <TouchableOpacity 
            style={styles.messageOptionItem}
            onPress={() => handleReplyToMessage(selectedMessage)}
          >
            <Ionicons name="arrow-undo-outline" size={24} color="#0066CC" />
            <Text style={styles.messageOptionText}>Reply</Text>
          </TouchableOpacity>
          
          {selectedMessage && selectedMessage.sender._id === userInfo._id && (
            <TouchableOpacity 
              style={styles.messageOptionItem}
              onPress={() => handleDeleteMessage(selectedMessage._id)}
            >
              <Ionicons name="trash-outline" size={24} color="#FF3B30" />
              <Text style={[styles.messageOptionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {post && (
        <View style={styles.postInfoContainer}>
          <Text style={styles.postInfoText}>
            Chatting about: <Text style={styles.postInfoTitle}>{post.title}</Text>
          </Text>
        </View>
      )}

      {renderMessageOptionsModal()}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {recipient?.profileImage ? (
              <Image
                source={{ uri: recipient.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#ccc" />
              </View>
            )}
            <Text style={styles.username}>{recipient?.name}</Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted
          onRefresh={handleRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubText}>
                Send a message to start the conversation
              </Text>
            </View>
          }
        />

        {replyingTo && (
          <View style={styles.replyingContainer}>
            <View style={styles.replyingContent}>
              <Text style={styles.replyingLabel}>Replying to:</Text>
              <Text style={styles.replyingText} numberOfLines={1}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={cancelReply}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={loading || !newMessage.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  noticeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  noticeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
  },
  upgradeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messagesList: {
    flexGrow: 1,
    padding: 15,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  theirMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
  },
  messageContent: {
    fontSize: 14,
  },
  postReference: {
    fontSize: 12,
    color: '#0066CC',
    fontStyle: 'italic',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 50,
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
  },
  postInfoContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  postInfoText: {
    fontSize: 14,
    color: '#666',
  },
  postInfoTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    marginRight: 15,
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageOptionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    width: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  messageOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  messageOptionText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  replyingContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f3f3',
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-between',
  },
  replyingContent: {
    flex: 1,
    marginRight: 10,
  },
  replyingLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  replyingText: {
    fontSize: 14,
    color: '#333',
  },
  replyToContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 5,
    borderRadius: 5,
    marginBottom: 5,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0066CC',
  },
  replyToText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  replyLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#0066CC',
  },
});

export default ChatScreen; 