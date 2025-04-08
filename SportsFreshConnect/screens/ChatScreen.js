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

  useEffect(() => {
    if (userInfo) {
      // Simplified: no premium checks
      fetchMessages();
    }

    // Set the header title to the recipient's name
    navigation.setOptions({
      title: recipient?.name || 'Chat',
    });

    // Load dummy messages for demo if we don't have real ones
    setLoading(true);
    setTimeout(() => {
      setMessages(prevMessages => {
        // Only load demo messages if we don't have any
        if (prevMessages.length === 0) {
          return [
            {
              _id: '1',
              text: `Hi there! I'm interested in your post about "${post?.title}"`,
              createdAt: new Date(),
              sender: userInfo?._id,
              user: {
                _id: userInfo?._id,
                name: userInfo?.name,
              },
            },
            {
              _id: '2',
              text: 'Hi! Thanks for reaching out. Would you like to know more about it?',
              createdAt: new Date(Date.now() - 1000 * 60),
              sender: recipient?._id,
              user: {
                _id: recipient?._id,
                name: recipient?.name,
              },
            },
          ];
        }
        return prevMessages;
      });
      setLoading(false);
    }, 1000);
  }, [navigation, recipient, userInfo]);

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
    
    // No premium check needed - allow all logged in users to send messages
    // NOTE FOR FUTURE: Premium checks could be implemented here

    if (postFromParams && recipient?._id) {
      const messageData = {
        recipientId: recipient._id,
        postId: postFromParams._id,
        text: newMessage.trim(),
      };

      setLoading(true);
      try {
        const result = await sendMessage(recipient._id, postFromParams._id, newMessage.trim());
        if (result.success) {
          setNewMessage('');
          
          // Add message to the list immediately for better UX
          const newMessageObj = {
            _id: result.data._id || `temp-${Date.now()}`,
            content: newMessage.trim(),
            createdAt: new Date(),
            sender: { _id: userInfo._id, name: userInfo.name },
            receiver: { _id: recipient._id, name: recipient.name },
            post: postFromParams
          };
          
          setMessages(prev => [newMessageObj, ...prev]);
          
          // Fetch fresh messages to ensure consistency
          fetchMessages();
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
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>
            {isMyMessage ? 'You' : item.sender.name}
          </Text>
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        <Text style={styles.messageContent}>{item.content}</Text>
        {item.post && (
          <Text style={styles.postReference}>
            Re: {item.post.title}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {post && (
        <View style={styles.postInfoContainer}>
          <Text style={styles.postInfoText}>
            Chatting about: <Text style={styles.postInfoTitle}>{post.title}</Text>
          </Text>
        </View>
      )}

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
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
  phoneInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: '100%',
  },
  phoneDisclaimer: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  premiumBadge: {
    backgroundColor: '#FFF8E1',
    padding: 4,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialBadge: {
    backgroundColor: '#E3F2FD',
    padding: 4,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default ChatScreen; 