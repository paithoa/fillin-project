import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../config';
import { getConversationsList, sendDirectMessage, getMessages } from '../services/api';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatListScreen = ({ navigation, route }) => {
  const { userInfo, requireLogin } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [trialError, setTrialError] = useState('');
  const requestedTrialRef = useRef(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (userInfo) {
        fetchConversations();
      }
    });

    return unsubscribe;
  }, [navigation, route]);

  // New effect to handle selected user and post for new conversation
  useEffect(() => {
    if (route.params?.selectedUser && route.params?.selectedPost && route.params?.showComposeMessage) {
      // Directly show compose modal - no premium check
      setSelectedUser(route.params.selectedUser);
      setSelectedPost(route.params.selectedPost);
      setShowComposeModal(true);
    }
  }, [route.params?.selectedUser, route.params?.selectedPost, route.params?.showComposeMessage]);

  useEffect(() => {
    if (userInfo) {
      fetchConversations();
    }
  }, [userInfo]);

  const checkAccess = () => {
    // Just check if user is logged in
    return !!userInfo;
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      
      // Try to use the real API endpoint first
      try {
        console.log('Attempting to fetch conversations from API...');
        const apiConversations = await getConversationsList();
        
        if (apiConversations && apiConversations.length > 0) {
          console.log('Successfully fetched conversations from API');
          
          // Format the conversations to match our UI structure
          const formattedConversations = apiConversations.map(message => {
            // Determine if the current user is the sender or recipient
            const otherParty = message.sender._id === userInfo._id ? 
              message.receiver : message.sender;
              
            return {
              _id: `${otherParty._id}_${message.post._id}`,
              user: otherParty,
              post: message.post,
              lastMessage: message,
              messages: [message], // We'll get more messages when user opens the conversation
              unreadCount: message.receiver._id === userInfo._id && !message.isRead ? 1 : 0
            };
          });
          
          // Sort by most recent message
          formattedConversations.sort((a, b) => 
            new Date(b.lastMessage?.createdAt) - new Date(a.lastMessage?.createdAt)
          );
          
          setConversations(formattedConversations);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch (apiError) {
        console.log('Error fetching from API, falling back to local storage:', apiError);
      }
      
      // If the API call fails, fall back to AsyncStorage
      // This is a fallback for demonstration when not connected to backend
      const savedConversations = await AsyncStorage.getItem('demo_conversations');
      
      if (savedConversations) {
        const parsedConversations = JSON.parse(savedConversations);
        if (parsedConversations && parsedConversations.length > 0) {
          setConversations(parsedConversations);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }
      
      // Create demo conversation if nothing found
      const demoConversations = [
        {
          _id: 'demo1',
          user: { 
            _id: 'user1', 
            name: 'John Doe',
            profileImage: 'https://randomuser.me/api/portraits/men/32.jpg'
          },
          lastMessage: {
            content: 'This is a demo conversation.',
            createdAt: new Date(),
            sender: { _id: 'user1', name: 'John Doe' },
            recipient: { _id: userInfo._id, name: userInfo.name }
          },
          post: {
            _id: 'post1',
            title: 'Basketball game this weekend'
          },
          unreadCount: 1,
          messages: [
            {
              _id: `msg_${Date.now()}`,
              content: 'This is a demo conversation.',
              createdAt: new Date(),
              sender: { _id: 'user1', name: 'John Doe' },
              recipient: { _id: userInfo._id, name: userInfo.name },
              post: {
                _id: 'post1',
                title: 'Basketball game this weekend'
              }
            }
          ]
        }
      ];
      
      setConversations(demoConversations);
      await AsyncStorage.setItem('demo_conversations', JSON.stringify(demoConversations));
      
    } catch (error) {
      console.log('Error fetching conversations:', error);
      Alert.alert('Error', 'Failed to load conversations. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const goToChat = async (conversation) => {
    // Set up the conversation for viewing/replying
    setSelectedUser(conversation.user);
    setSelectedPost(conversation.post);
    setNewMessage(''); // Clear any previous message
    
    try {
      // Try to fetch messages from API first
      try {
        console.log('Fetching messages for conversation with:', conversation.user._id);
        const response = await getMessages(conversation.user._id);
        
        if (response.success && response.data && response.data.length > 0) {
          // Update conversation with full message history
          const existingConvIndex = conversations.findIndex(c => 
            c._id === conversation._id
          );
          
          if (existingConvIndex !== -1) {
            const updatedConversations = [...conversations];
            updatedConversations[existingConvIndex].messages = response.data;
            setConversations(updatedConversations);
          }
        }
      } catch (apiError) {
        console.log('Error fetching messages from API:', apiError);
      }
      
      // Open the compose modal instead of navigating to ChatScreen
      setShowComposeModal(true);
      
    } catch (error) {
      console.log('Error in goToChat:', error);
      // Even if there's an error, still try to open the modal
      setShowComposeModal(true);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !selectedPost) {
      return;
    }

    try {
      // First try to send via API
      const messageData = {
        recipient: selectedUser._id,
        content: newMessage.trim(),
        post: selectedPost._id
      };
      
      console.log('Sending message via API:', messageData);
      
      let response;
      try {
        response = await sendDirectMessage(messageData);
        console.log('API response:', response);
      } catch (apiError) {
        console.log('Error sending via API, using local fallback:', apiError);
        
        // Create a local message object as fallback
        response = {
          _id: `local_msg_${Date.now()}`,
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
          sender: { 
            _id: userInfo._id, 
            name: userInfo.name,
            email: userInfo.email 
          },
          receiver: selectedUser,
          post: selectedPost
        };
        
        // Save to local storage as fallback
        const savedConversations = await AsyncStorage.getItem('demo_conversations');
        let localConversations = savedConversations ? JSON.parse(savedConversations) : [];
        
        // Find existing conversation or create new one
        const conversationId = `${selectedUser._id}_${selectedPost._id}`;
        const existingConvIndex = localConversations.findIndex(c => 
          c.user._id === selectedUser._id && c.post._id === selectedPost._id
        );
        
        if (existingConvIndex !== -1) {
          // Update existing conversation
          localConversations[existingConvIndex].lastMessage = response;
          localConversations[existingConvIndex].messages.unshift(response);
        } else {
          // Create new conversation
          const newConversation = {
            _id: conversationId,
            user: selectedUser,
            lastMessage: response,
            messages: [response],
            post: selectedPost,
            unreadCount: 0
          };
          localConversations.unshift(newConversation);
        }
        
        await AsyncStorage.setItem('demo_conversations', JSON.stringify(localConversations));
      }
      
      // Update UI regardless of source (API or local)
      // Find existing conversation or create new one
      const conversationId = `${selectedUser._id}_${selectedPost._id}`;
      const existingConvIndex = conversations.findIndex(c => 
        c.user._id === selectedUser._id && c.post._id === selectedPost._id
      );
      
      let updatedConversations = [...conversations];
      
      if (existingConvIndex !== -1) {
        // Update existing conversation
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          lastMessage: response,
          messages: [
            response,
            ...(updatedConversations[existingConvIndex].messages || [])
          ]
        };
      } else {
        // Create new conversation
        const newConversation = {
          _id: conversationId,
          user: selectedUser,
          lastMessage: response,
          messages: [response],
          post: selectedPost,
          unreadCount: 0
        };
        updatedConversations = [newConversation, ...updatedConversations];
      }
      
      setConversations(updatedConversations);
      
      // Clear the message input but keep the modal open
      setNewMessage('');
      
    } catch (error) {
      console.log('Error saving message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // Update the reset function to clear data
  const resetMessages = async () => {
    try {
      // For demo purposes only - clear local storage
      await AsyncStorage.removeItem('demo_conversations');
      
      Alert.alert(
        'Messages Reset',
        'Local message cache has been cleared. Messages from the server may still exist. Pull down to refresh and see the changes.',
        [{ text: 'OK', onPress: () => fetchConversations() }]
      );
    } catch (error) {
      console.log('Error resetting messages:', error);
      Alert.alert('Error', 'Failed to reset messages.');
    }
  };

  // Not logged in view
  if (!userInfo) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="chatbubbles-outline" size={70} color="#0066CC" />
        <Text style={styles.noticeTitle}>Login Required</Text>
        <Text style={styles.noticeText}>
          Please log in to access your conversations
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show empty state when there are no conversations
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={70} color="#ccc" />
        <Text style={styles.emptyTitle}>No Conversations Yet</Text>
        <Text style={styles.emptyText}>
          You don't have any messages yet. Find a post you're interested in and start a conversation!
        </Text>
        <TouchableOpacity
          style={styles.findPostsButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.findPostsButtonText}>Find Posts</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderConversationItem = ({ item }) => {
    const isUnread = item.unreadCount > 0;
    const isSenderMe = item.lastMessage?.sender?._id === userInfo?._id;
    const messagePreview = isSenderMe 
      ? `You: ${item.lastMessage?.content}` 
      : item.lastMessage?.content;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, isUnread && styles.unreadItem]}
        onPress={() => goToChat(item)}
      >
        <View style={styles.avatarContainer}>
          {item.user?.profileImage ? (
            <Image
              source={{ uri: item.user.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, isUnread && styles.unreadText]}>
              {item.user?.name || 'Unknown User'}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.lastMessage?.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          <Text style={styles.postTitle} numberOfLines={1}>
            Re: {item.post?.title || 'Unknown Post'}
          </Text>
          
          <Text style={[styles.messagePreview, isUnread && styles.unreadText]} numberOfLines={1}>
            {messagePreview || 'No messages yet'}
          </Text>
        </View>
        
        {isUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Add this function to render the compose message modal
  const renderComposeModal = () => {
    // Find the conversation that matches the selected user and post
    const selectedConversation = conversations.find(
      c => c.user._id === selectedUser?._id && c.post._id === selectedPost?._id
    );
    
    // Get messages from the selected conversation
    const conversationMessages = selectedConversation?.messages || [];
    
    return (
      <Modal
        visible={showComposeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComposeModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.chatModalContent}>
            <View style={styles.composeModalHeader}>
              <View style={styles.chatHeaderInfo}>
                {selectedUser?.profileImage ? (
                  <Image
                    source={{ uri: selectedUser.profileImage }}
                    style={styles.chatHeaderAvatar}
                  />
                ) : (
                  <View style={styles.chatHeaderAvatarPlaceholder}>
                    <Ionicons name="person" size={18} color="#ccc" />
                  </View>
                )}
                <View style={styles.chatHeaderTextContainer}>
                  <Text style={styles.composeModalTitle}>
                    {selectedUser?.name || 'Chat'}
                  </Text>
                  {selectedPost && (
                    <Text style={styles.chatHeaderPostTitle} numberOfLines={1}>
                      Re: {selectedPost.title}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowComposeModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.chatMessagesContainer}>
              {conversationMessages.length > 0 ? (
                <FlatList
                  data={conversationMessages}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => {
                    const isFromMe = item.sender?._id === userInfo?._id;
                    return (
                      <View style={[
                        styles.messageBubble,
                        isFromMe ? styles.myMessage : styles.theirMessage
                      ]}>
                        <Text style={[
                          styles.messageText,
                          isFromMe ? styles.myMessageText : styles.theirMessageText
                        ]}>
                          {item.content}
                        </Text>
                        <Text style={[
                          styles.messageTime,
                          isFromMe ? styles.myMessageTime : styles.theirMessageTime
                        ]}>
                          {new Date(item.createdAt).toLocaleTimeString([], 
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </Text>
                      </View>
                    );
                  }}
                  inverted={true}
                  contentContainerStyle={styles.messagesListContent}
                />
              ) : (
                <View style={styles.noMessagesContainer}>
                  <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
                  <Text style={styles.noMessagesText}>No messages yet</Text>
                  <Text style={styles.noMessagesSubtext}>
                    Start the conversation below
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type your message here..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxHeight={100}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newMessage.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendNewMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newMessage.trim() ? "white" : "#999"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderComposeModal()}
      
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderConversationItem}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={conversations.length === 0 ? { flex: 1 } : null}
      />
      
      {/* Chat buttons - show for all logged in users */}
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.newChatButtonText}>Find Posts</Text>
      </TouchableOpacity>
      
      {/* Add a reset button for testing */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={() => {
          Alert.alert(
            'Reset Messages',
            'This will clear all messages for all users. Are you sure?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', onPress: resetMessages, style: 'destructive' }
            ]
          );
        }}
      >
        <Ionicons name="trash" size={20} color="white" />
        <Text style={styles.resetButtonText}>Reset Messages</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  unreadItem: {
    backgroundColor: '#f0f7ff',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  postTitle: {
    fontSize: 14,
    color: '#0066CC',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#333',
  },
  unreadBadge: {
    backgroundColor: '#0066CC',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    alignSelf: 'center',
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noticeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  noticeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trialButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  trialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeButton: {
    borderWidth: 1,
    borderColor: '#0066CC',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 22,
  },
  findPostsButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findPostsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newChatButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#0066CC',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  trialModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  trialModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  trialModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trialModalBody: {
    padding: 20,
    alignItems: 'center',
  },
  trialIcon: {
    marginBottom: 15,
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  trialDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  phoneInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  phoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  startTrialButton: {
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 8,
    flex: 1.5,
    alignItems: 'center',
  },
  startTrialButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  composeModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  composeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  chatHeaderAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  chatHeaderTextContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  composeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatHeaderPostTitle: {
    fontSize: 14,
    color: '#666',
  },
  chatMessagesContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  messagesListContent: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  myMessage: {
    backgroundColor: '#0066CC',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: 'white',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chatInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0066CC',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  noMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMessagesText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },
  noMessagesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  resetButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'white',
  },
  chatModalContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
});

export default ChatListScreen; 