import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const { userInfo, userToken, logout, upgradeToPremium, cancelPremium, isLoading, requireLogin, setUserInfo, setUserToken } = useContext(AuthContext);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPremiumProcessing, setIsPremiumProcessing] = useState(false);

  // Update navigation options to show auth status in header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: userToken ? 'My Profile' : 'Profile',
      headerRight: () => (
        userToken ? (
          <View style={styles.headerStatusContainer}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Logged In</Text>
          </View>
        ) : null
      ),
    });
  }, [navigation, userToken]);

  useEffect(() => {
    // Auto-check authentication without prompt for profile screen
    if (!userToken) {
      // User is not authenticated, but no need to log it
    }
  }, [userToken, navigation]);

  // Show login prompt if user is not logged in
  if (!userInfo) {
    return (
      <View style={styles.notLoggedInContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#0066CC" />
        <Text style={styles.notLoggedInTitle}>Not Logged In</Text>
        <Text style={styles.notLoggedInText}>
          Please log in to view and manage your profile
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    
    // In a real app, this would handle payment processing
    Alert.alert(
      'Confirm Upgrade',
      'Are you sure you want to upgrade to premium? (This is a demo - no actual payment will be processed)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Upgrade',
          onPress: async () => {
            try {
              setIsPremiumProcessing(true);
              await upgradeToPremium();
              setIsPremiumProcessing(false);
              Alert.alert('Success', 'Your account has been upgraded to premium!');
            } catch (error) {
              setIsPremiumProcessing(false);
              console.log(error);
              Alert.alert('Error', 'Failed to upgrade account. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const handleCancelPremium = () => {
    Alert.alert(
      'Cancel Premium',
      'Are you sure you want to cancel your premium membership? You will lose access to premium features immediately.',
      [
        {
          text: 'Keep Premium',
          style: 'cancel',
        },
        {
          text: 'Cancel Premium',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsPremiumProcessing(true);
              await cancelPremium();
              setIsPremiumProcessing(false);
              Alert.alert('Premium Canceled', 'Your premium membership has been canceled.');
            } catch (error) {
              setIsPremiumProcessing(false);
              console.log(error);
              Alert.alert('Error', 'Failed to cancel premium. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            console.log('ProfileScreen: User confirmed logout, proceeding...');
            try {
              console.log('ProfileScreen: Calling logout()');
              const success = await logout();
              
              console.log('ProfileScreen: logout() returned:', success);
              
              // Always reset navigation even if logout technically fails
              // This provides better UX, and context state is already cleared
              console.log('ProfileScreen: Resetting navigation stack');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            } catch (error) {
              console.error('ProfileScreen: Error during logout:', error);
              Alert.alert('Logout Error', 'There was a problem logging out. Please try again.');
              
              // Force navigation reset even on error
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          },
        },
      ]
    );
  };

  // Add a test function for direct logout
  const testDirectLogout = async () => {
    console.log('ProfileScreen: Testing direct logout...');
    try {
      // Clear AsyncStorage directly
      console.log('ProfileScreen: Directly clearing AsyncStorage...');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('userToken');
      
      // Clear context state
      console.log('ProfileScreen: Setting context state to null directly...');
      // Note: We're using the AuthContext functions which should trigger proper state updates
      setUserToken(null);
      setUserInfo(null);
      
      console.log('ProfileScreen: Direct logout complete, resetting navigation');
      // Reset navigation
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('ProfileScreen: Error in direct logout test:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.authStatusBar}>
        <View style={styles.authStatusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.authStatusText}>Logged in as {userInfo?.name}</Text>
        </View>
      </View>
      
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {userInfo?.profileImage ? (
            <Image
              source={{ uri: userInfo.profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
        </View>
        <Text style={styles.name}>{userInfo?.name}</Text>
        {userInfo?.isPremium && (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={22} color="#555" />
          <Text style={styles.infoText}>{userInfo?.email}</Text>
        </View>
        {userInfo?.phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={22} color="#555" />
            <Text style={styles.infoText}>{userInfo.phone}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={22} color="#555" />
          <Text style={styles.infoText}>
            Joined on{' '}
            {userInfo?.createdAt && !isNaN(new Date(userInfo.createdAt).getTime())
              ? new Date(userInfo.createdAt).toLocaleDateString()
              : 'Unknown date'}
          </Text>
        </View>
        {userInfo?.isPremium && userInfo?.premiumSince && (
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={22} color="#555" />
            <Text style={styles.infoText}>
              Premium since{' '}
              {!isNaN(new Date(userInfo.premiumSince).getTime())
                ? new Date(userInfo.premiumSince).toLocaleDateString()
                : 'recently'}
            </Text>
          </View>
        )}
      </View>

      {/* Premium status cards */}
      {/* {!userInfo?.isPremium ? (
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={() => setShowUpgradeModal(true)}
          disabled={isPremiumProcessing}
        >
          <View style={styles.upgradeTop}>
            <Ionicons name="star" size={30} color="#FFD700" />
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
          </View>
          <Text style={styles.upgradeDescription}>
            Get access to messaging and more features with a premium account.
          </Text>
          <View style={styles.upgradeButton}>
            {isPremiumProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
              </>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.premiumStatusCard}>
          <View style={styles.premiumStatusHeader}>
            <Ionicons name="star" size={30} color="#FFD700" />
            <Text style={styles.premiumStatusTitle}>Premium Member</Text>
          </View>
          <Text style={styles.premiumStatusDescription}>
            You have access to all premium features including direct messaging and priority listings.
          </Text>
          <TouchableOpacity
            style={styles.cancelPremiumButton}
            onPress={handleCancelPremium}
            disabled={isPremiumProcessing}
          >
            {isPremiumProcessing ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.cancelPremiumButtonText}>Cancel Membership</Text>
            )}
          </TouchableOpacity>
        </View>
      )} */}

      <View style={styles.logoutButtonContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={testDirectLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
 
      </View>

      {/* Premium Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Premium Benefits</Text>
              <TouchableOpacity onPress={() => setShowUpgradeModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.benefitItem}>
                <Ionicons name="chatbubble-outline" size={24} color="#0066CC" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Messaging</Text>
                  <Text style={styles.benefitDescription}>
                    Send direct messages to teams and players.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="eye-outline" size={24} color="#0066CC" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Priority Listings</Text>
                  <Text style={styles.benefitDescription}>
                    Your posts will appear at the top of search results.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <Ionicons name="notifications-outline" size={24} color="#0066CC" />
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Notifications</Text>
                  <Text style={styles.benefitDescription}>
                    Get notified when someone views your profile or posts.
                  </Text>
                </View>
              </View>

              <View style={styles.pricingCard}>
                <Text style={styles.pricingTitle}>Premium Membership</Text>
                <Text style={styles.pricingPrice}>$9.99/month</Text>
                <Text style={styles.pricingDescription}>
                  (Demo Mode - No Payment Required)
                </Text>
              </View>

              <TouchableOpacity
                style={styles.upgradeModalButton}
                onPress={handleUpgrade}
                disabled={isPremiumProcessing}
              >
                {isPremiumProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.upgradeModalButtonText}>Upgrade Now</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Add new styles for authentication status
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0C0',
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '600',
  },
  authStatusBar: {
    backgroundColor: '#E6F3FF',
    padding: 10,
    marginBottom: 5,
  },
  authStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0C0',
    marginRight: 8,
  },
  authStatusText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  notLoggedInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  notLoggedInTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  notLoggedInText: {
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
    width: '80%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#0066CC',
    width: '80%',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#0066CC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    marginTop: 10,
  },
  premiumText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  upgradeCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  upgradeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  upgradeButton: {
    backgroundColor: '#0066CC',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  benefitContent: {
    marginLeft: 10,
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#666',
  },
  pricingCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    alignItems: 'center',
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
  upgradeModalButton: {
    backgroundColor: '#0066CC',
    padding: 15,
    margin: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  upgradeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonContainer: {
    marginHorizontal: 15,
    marginVertical: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    // Add shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 10,
  },
  premiumStatusCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  premiumStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  premiumStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  premiumStatusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  cancelPremiumButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  cancelPremiumButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 